import { spawn } from "node:child_process";
import path from "node:path";
import { prisma } from "./prisma";
import { TopicWeaknessSummary, getStudentTopicWeaknessSummary } from "./topic-weakness";

export type ResourceRecommendationContext = {
    student_id: string;
    grade_level: number;
    preferred_language: "ru" | "en" | "kz";
    preferred_content_type: "video" | "quiz" | "article" | "practice" | "summary" | "flashcards";
    subject_name: string;
    weak_topic_name: string;
    weak_topic_probability: number;
    topic_mastery_score: number;
    exam_proximity_days: number;
    engagement_score: number;
    available_study_minutes: number;
};

export type RecommendedResource = {
    resource_id: string;
    title_ru: string;
    subject_name: string;
    topic_name: string;
    content_type: string;
    language: string;
    estimated_minutes: number;
    predicted_relevance_score: number;
    relevance_label_ru: string;
};

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function mapLanguagePreference(language: string | null | undefined): ResourceRecommendationContext["preferred_language"] {
    const normalized = (language ?? "").toLowerCase();
    if (normalized.includes("english") || normalized.includes("англ") || normalized === "en") return "en";
    if (normalized.includes("қаз") || normalized.includes("каз") || normalized === "kz") return "kz";
    return "ru";
}

function inferPreferredContentType(weakTopic: TopicWeaknessSummary, examProximityDays: number): ResourceRecommendationContext["preferred_content_type"] {
    if (weakTopic.risk_level === "weak" && examProximityDays <= 10) return "video";
    if (weakTopic.risk_level === "weak") return "summary";
    if (examProximityDays <= 7) return "practice";
    if (weakTopic.risk_level === "medium") return "quiz";
    return "article";
}

function inferAvailableStudyMinutes(homeworkPct: number, examProximityDays: number, streakDays: number) {
    const base = homeworkPct >= 95 ? 30 : homeworkPct >= 85 ? 25 : 20;
    const examBoost = examProximityDays <= 7 ? 5 : 0;
    const streakBoost = streakDays >= 10 ? 5 : 0;
    return clamp(base + examBoost + streakBoost, 15, 45);
}

function deriveTopicMasteryScore(weakTopic: TopicWeaknessSummary) {
    return clamp(1 - weakTopic.weak_topic_probability, 0.1, 0.95);
}

async function runResourceRecommendation(context: ResourceRecommendationContext, topN = 5) {
    const scriptPath = path.join(process.cwd(), "Resource recommender", "recommend_resources.py");

    return await new Promise<RecommendedResource[]>((resolve, reject) => {
        const child = spawn("python3", [scriptPath], {
            cwd: process.cwd(),
            stdio: ["pipe", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", reject);
        child.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(stderr.trim() || stdout.trim() || "Resource recommender failed."));
                return;
            }

            try {
                resolve(JSON.parse(stdout) as RecommendedResource[]);
            } catch (error) {
                reject(error);
            }
        });

        child.stdin.write(JSON.stringify({ context, top_n: topN }));
        child.stdin.end();
    });
}

function fallbackRecommend(context: ResourceRecommendationContext): RecommendedResource[] {
    return [
        {
            resource_id: "fallback-1",
            title_ru: `${context.weak_topic_name}: базовый разбор`,
            subject_name: context.subject_name,
            topic_name: context.weak_topic_name,
            content_type: context.preferred_content_type,
            language: context.preferred_language,
            estimated_minutes: Math.min(context.available_study_minutes, 20),
            predicted_relevance_score: 0.78,
            relevance_label_ru: "подходит",
        },
    ];
}

export async function recommendResources(
    context: ResourceRecommendationContext,
    topN = 5,
) {
    try {
        const resources = await runResourceRecommendation(context, topN);
        return {
            resources,
            source: "ml" as const,
        };
    } catch {
        return {
            resources: fallbackRecommend(context),
            source: "fallback" as const,
        };
    }
}

export async function getStudentResourceRecommendations(
    studentId: string,
    weakTopics?: TopicWeaknessSummary[],
    topN = 5,
) {
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            user: {
                include: {
                    settings: true,
                },
            },
            schoolClass: true,
            goals: {
                where: { completed: false },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!student) return [];

    const resolvedWeakTopics = weakTopics ?? await getStudentTopicWeaknessSummary(studentId);
    const primaryWeakTopic = resolvedWeakTopics[0];
    if (!primaryWeakTopic) return [];

    const examProximityDays = clamp(student.goals[0]?.daysLeft ?? (primaryWeakTopic.risk_level === "weak" ? 7 : 14), 3, 30);
    const engagementScore = clamp((student.homeworkPct / 100) * 0.7 + clamp(student.streakDays / 20, 0, 1) * 0.3, 0.2, 1);
    const context: ResourceRecommendationContext = {
        student_id: student.id,
        grade_level: student.schoolClass.grade,
        preferred_language: mapLanguagePreference(student.user.settings?.language),
        preferred_content_type: inferPreferredContentType(primaryWeakTopic, examProximityDays),
        subject_name: primaryWeakTopic.subjectName,
        weak_topic_name: primaryWeakTopic.topicName,
        weak_topic_probability: primaryWeakTopic.weak_topic_probability,
        topic_mastery_score: deriveTopicMasteryScore(primaryWeakTopic),
        exam_proximity_days: examProximityDays,
        engagement_score: engagementScore,
        available_study_minutes: inferAvailableStudyMinutes(student.homeworkPct, examProximityDays, student.streakDays),
    };

    const result = await recommendResources(context, topN);
    return result.resources;
}
