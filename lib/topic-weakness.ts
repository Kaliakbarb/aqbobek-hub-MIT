import { AttendanceStatus } from "@prisma/client";
import { spawn } from "node:child_process";
import path from "node:path";
import { getMockBilimClassStudentSnapshot } from "./mock-bilimclass";

export type TopicWeaknessModelInput = {
    student_id: string;
    grade_level: number;
    subject_name: string;
    topic_name: string;
    topic_difficulty: number;
    recent_avg_score_topic: number;
    historical_avg_score_topic: number;
    recent_avg_score_subject: number;
    missed_classes_topic: number;
    assignment_completion_rate: number;
    quiz_attempts_topic: number;
    improvement_trend: number;
    days_since_last_topic_assessment: number;
    related_topic_mastery: number;
    exam_proximity_days: number;
    engagement_score: number;
};

export type TopicWeaknessPrediction = {
    weak_topic_probability: number;
    risk_level: "strong" | "medium" | "weak";
    risk_level_ru: string;
    model_label?: string;
};

export type TopicWeaknessSummary = TopicWeaknessPrediction & {
    subjectName: string;
    topicName: string;
    topicDifficulty: number;
    reason: string;
    source: "ml" | "fallback";
};

type TopicCatalogEntry = {
    topicName: string;
    difficulty: number;
    keywords?: string[];
};

const TOPIC_CATALOG: Record<string, TopicCatalogEntry[]> = {
    "Математика": [
        { topicName: "Квадратные уравнения", difficulty: 4, keywords: ["квадрат", "уравнен"] },
        { topicName: "Тригонометрия", difficulty: 5, keywords: ["тригоном"] },
        { topicName: "Логарифмы", difficulty: 4, keywords: ["логариф"] },
        { topicName: "Производные", difficulty: 5, keywords: ["производн"] },
        { topicName: "Геометрия", difficulty: 3, keywords: ["геометр"] },
    ],
    "Физика": [
        { topicName: "Механика", difficulty: 3, keywords: ["механик"] },
        { topicName: "Термодинамика", difficulty: 4, keywords: ["термо"] },
        { topicName: "Оптика", difficulty: 3, keywords: ["оптик"] },
        { topicName: "Электричество", difficulty: 5, keywords: ["электр", "индукц", "фараде", "поле"] },
        { topicName: "Квантовая физика", difficulty: 5, keywords: ["квант"] },
    ],
    "Химия": [
        { topicName: "Органическая химия", difficulty: 4, keywords: ["органич"] },
        { topicName: "Неорганическая химия", difficulty: 3, keywords: ["неорганич"] },
        { topicName: "Таблица Менделеева", difficulty: 2, keywords: ["менделе"] },
        { topicName: "Реакции", difficulty: 4, keywords: ["реакц"] },
        { topicName: "Кислоты и основания", difficulty: 4, keywords: ["кислот", "основан"] },
    ],
    "История": [
        { topicName: "Средние века", difficulty: 3, keywords: ["средневек"] },
        { topicName: "Древний мир", difficulty: 2, keywords: ["древн"] },
        { topicName: "Новое время", difficulty: 3, keywords: ["новое время"] },
        { topicName: "Вторая мировая война", difficulty: 4, keywords: ["войн"] },
        { topicName: "История Казахстана", difficulty: 3, keywords: ["казахстан"] },
    ],
    "Биология": [
        { topicName: "Клетка", difficulty: 2, keywords: ["клет"] },
        { topicName: "Генетика", difficulty: 4, keywords: ["генет"] },
        { topicName: "Зоология", difficulty: 2, keywords: ["зоолог"] },
        { topicName: "Ботаника", difficulty: 2, keywords: ["ботан"] },
        { topicName: "Анатомия", difficulty: 3, keywords: ["анатом"] },
    ],
    "Английский язык": [
        { topicName: "Present Simple", difficulty: 2, keywords: ["present"] },
        { topicName: "Passive Voice", difficulty: 4, keywords: ["passive"] },
        { topicName: "Conditionals", difficulty: 4, keywords: ["conditional"] },
        { topicName: "Vocabulary", difficulty: 3, keywords: ["vocabulary", "словар"] },
        { topicName: "Listening", difficulty: 3, keywords: ["listening", "аудирован"] },
    ],
};

const SUBJECT_NORMALIZATION: Record<string, string> = {
    "Алгебра": "Математика",
    "Геометрия": "Математика",
    "История Казахстана": "История",
};

function average(values: number[]) {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function normalizeSubjectName(subjectName: string) {
    return SUBJECT_NORMALIZATION[subjectName] ?? subjectName;
}

function detectTopicName(subjectName: string, hintText: string) {
    const topics = TOPIC_CATALOG[subjectName];
    if (!topics?.length) {
        return { topicName: "Общая тема", difficulty: 3 };
    }

    const normalizedHint = hintText.toLowerCase();
    const matched = topics.find((topic) =>
        topic.keywords?.some((keyword) => normalizedHint.includes(keyword)),
    );

    return matched ?? topics[0];
}

function toFivePointScore(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return 0;
    return value <= 5 ? value : value / 20;
}

function buildRiskReason(input: TopicWeaknessModelInput, probability: number) {
    const reasons: string[] = [];

    if (input.recent_avg_score_topic < 4) {
        reasons.push(`недавний средний балл ${input.recent_avg_score_topic.toFixed(1)}`);
    }
    if (input.missed_classes_topic > 0) {
        reasons.push(`${input.missed_classes_topic} пропуск(а) по теме`);
    }
    if (input.improvement_trend < 0) {
        reasons.push("отрицательный тренд по последним оценкам");
    }
    if (input.assignment_completion_rate < 0.8) {
        reasons.push(`выполнение заданий ${Math.round(input.assignment_completion_rate * 100)}%`);
    }
    if (input.engagement_score < 0.55) {
        reasons.push("снижение вовлечённости");
    }

    if (reasons.length === 0) {
        return probability >= 0.7
            ? "модель видит накопленный риск по сочетанию оценок и активности"
            : "текущие данные выглядят стабильными";
    }

    return reasons.slice(0, 3).join(", ");
}

async function runPythonInference(payload: TopicWeaknessModelInput | TopicWeaknessModelInput[]) {
    const scriptPath = path.join(process.cwd(), "topic_weakness_model", "predict_topic_weakness.py");

    return await new Promise<TopicWeaknessPrediction | TopicWeaknessPrediction[]>((resolve, reject) => {
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
                reject(new Error(stderr.trim() || stdout.trim() || "Python inference failed."));
                return;
            }

            try {
                resolve(JSON.parse(stdout) as TopicWeaknessPrediction | TopicWeaknessPrediction[]);
            } catch (error) {
                reject(error);
            }
        });

        child.stdin.write(JSON.stringify(payload));
        child.stdin.end();
    });
}

function fallbackPrediction(input: TopicWeaknessModelInput): TopicWeaknessPrediction {
    const scorePenalty = clamp((4.8 - input.recent_avg_score_topic) / 2.8, 0, 1) * 0.35;
    const attendancePenalty = clamp(input.missed_classes_topic / 4, 0, 1) * 0.15;
    const completionPenalty = clamp((0.9 - input.assignment_completion_rate) / 0.6, 0, 1) * 0.15;
    const trendPenalty = clamp(Math.abs(Math.min(input.improvement_trend, 0)), 0, 1) * 0.15;
    const masteryPenalty = clamp(0.7 - input.related_topic_mastery, 0, 0.7) / 0.7 * 0.1;
    const engagementPenalty = clamp(0.65 - input.engagement_score, 0, 0.65) / 0.65 * 0.1;
    const weakProbability = clamp(
        0.1 + scorePenalty + attendancePenalty + completionPenalty + trendPenalty + masteryPenalty + engagementPenalty,
        0.02,
        0.98,
    );

    if (weakProbability >= 0.7) {
        return { weak_topic_probability: weakProbability, risk_level: "weak", risk_level_ru: "слабая тема" };
    }
    if (weakProbability >= 0.4) {
        return { weak_topic_probability: weakProbability, risk_level: "medium", risk_level_ru: "тема требует внимания" };
    }
    return { weak_topic_probability: weakProbability, risk_level: "strong", risk_level_ru: "сильная тема" };
}

export async function predictTopicWeakness(
    payload: TopicWeaknessModelInput | TopicWeaknessModelInput[],
): Promise<TopicWeaknessPrediction | TopicWeaknessPrediction[]> {
    return runPythonInference(payload);
}

export async function predictTopicWeaknessSafe(
    payload: TopicWeaknessModelInput | TopicWeaknessModelInput[],
) {
    try {
        const prediction = await runPythonInference(payload);
        return {
            prediction,
            source: "ml" as const,
        };
    } catch {
        if (Array.isArray(payload)) {
            return {
                prediction: payload.map(fallbackPrediction),
                source: "fallback" as const,
            };
        }

        return {
            prediction: fallbackPrediction(payload),
            source: "fallback" as const,
        };
    }
}

export async function getStudentTopicWeaknessSummary(studentId: string) {
    const student = await getMockBilimClassStudentSnapshot(studentId);

    if (!student) return [];

    const gradeGroups = new Map<string, typeof student.grades>();
    for (const grade of student.grades) {
        const normalizedSubjectName = normalizeSubjectName(grade.subjectName);
        if (!TOPIC_CATALOG[normalizedSubjectName]) continue;

        const subjectGrades = gradeGroups.get(normalizedSubjectName) ?? [];
        subjectGrades.push(grade);
        gradeGroups.set(normalizedSubjectName, subjectGrades);
    }

    const allSubjectScores = student.grades
        .map((grade) => toFivePointScore(grade.numericValue ?? grade.percent ?? null))
        .filter((value) => value > 0);

    const overallAverage = average(allSubjectScores);
    const examProximityDays = student.goals[0]?.daysLeft ?? 14;
    const engagementScore = clamp(
        (student.homeworkPct / 100) * 0.55 +
            clamp(student.streakDays / 20, 0, 1) * 0.3 +
            (1 - clamp(student.attendance.filter((entry) => entry.status === AttendanceStatus.absent).length / 6, 0, 1)) * 0.15,
        0.1,
        1,
    );

    const candidates = [...gradeGroups.entries()]
        .map(([normalizedSubjectName, subjectGrades]) => {
            const recentGrades = subjectGrades.slice(0, 3);
            const recentAverage = average(
                recentGrades.map((grade) => toFivePointScore(grade.numericValue ?? grade.percent ?? null)).filter((value) => value > 0),
            );
            const historicalAverage = average(
                subjectGrades.map((grade) => toFivePointScore(grade.numericValue ?? grade.percent ?? null)).filter((value) => value > 0),
            );
            const latestGrade = subjectGrades[0];
            const attendanceMisses = student.attendance.filter(
                (entry) =>
                    entry.status === AttendanceStatus.absent &&
                    normalizeSubjectName(entry.subjectName ?? normalizedSubjectName) === normalizedSubjectName,
            ).length;
            const improvementTrend = clamp(recentAverage - historicalAverage, -1, 1);
            const lastAssessmentDate = latestGrade?.recordedAt ? new Date(latestGrade.recordedAt) : new Date();
            const daysSinceLastAssessment = Math.max(
                0,
                Math.round((Date.now() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24)),
            );
            const relatedMastery = clamp(
                overallAverage > 0
                    ? overallAverage / 5
                    : student.gpa / 5,
                0.2,
                1,
            );
            const hintText = `${student.riskAlerts.find((alert) => normalizeSubjectName(alert.subjectName ?? "") === normalizedSubjectName)?.reason ?? ""} ${latestGrade?.type ?? ""}`;
            const topic = detectTopicName(normalizedSubjectName, hintText);

            const input: TopicWeaknessModelInput = {
                student_id: student.studentId,
                grade_level: student.class.grade,
                subject_name: normalizedSubjectName,
                topic_name: topic.topicName,
                topic_difficulty: topic.difficulty,
                recent_avg_score_topic: clamp(recentAverage || historicalAverage || student.gpa, 2, 5),
                historical_avg_score_topic: clamp(historicalAverage || recentAverage || student.gpa, 2, 5),
                recent_avg_score_subject: clamp(overallAverage || student.gpa, 2, 5),
                missed_classes_topic: attendanceMisses,
                assignment_completion_rate: clamp(student.homeworkPct / 100, 0.3, 1),
                quiz_attempts_topic: clamp(subjectGrades.length, 1, 5),
                improvement_trend: improvementTrend,
                days_since_last_topic_assessment: clamp(daysSinceLastAssessment, 1, 30),
                related_topic_mastery: relatedMastery,
                exam_proximity_days: clamp(examProximityDays, 1, 60),
                engagement_score: engagementScore,
            };

            return {
                subjectName: normalizedSubjectName,
                topicName: topic.topicName,
                topicDifficulty: topic.difficulty,
                input,
            };
        })
        .sort((left, right) => left.input.recent_avg_score_topic - right.input.recent_avg_score_topic)
        .slice(0, 3);

    if (candidates.length === 0) return [];

    const { prediction, source } = await predictTopicWeaknessSafe(candidates.map((item) => item.input));
    const predictions = Array.isArray(prediction) ? prediction : [prediction];

    return candidates
        .map((candidate, index): TopicWeaknessSummary => {
            const result = predictions[index] ?? fallbackPrediction(candidate.input);
            return {
                ...result,
                subjectName: candidate.subjectName,
                topicName: candidate.topicName,
                topicDifficulty: candidate.topicDifficulty,
                reason: buildRiskReason(candidate.input, result.weak_topic_probability),
                source,
            };
        })
        .sort((left, right) => right.weak_topic_probability - left.weak_topic_probability);
}
