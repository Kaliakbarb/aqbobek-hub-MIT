import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../lib/http";
import { requireRole } from "../../../../lib/server-data";
import {
    getStudentTopicWeaknessSummary,
    predictTopicWeaknessSafe,
    TopicWeaknessModelInput,
} from "../../../../lib/topic-weakness";
import { requireSessionUser } from "../../../../lib/session";

function isTopicWeaknessInput(value: unknown): value is TopicWeaknessModelInput {
    if (!value || typeof value !== "object") return false;

    const payload = value as Record<string, unknown>;
    return [
        "student_id",
        "grade_level",
        "subject_name",
        "topic_name",
        "topic_difficulty",
        "recent_avg_score_topic",
        "historical_avg_score_topic",
        "recent_avg_score_subject",
        "missed_classes_topic",
        "assignment_completion_rate",
        "quiz_attempts_topic",
        "improvement_trend",
        "days_since_last_topic_assessment",
        "related_topic_mastery",
        "exam_proximity_days",
        "engagement_score",
    ].every((key) => key in payload);
}

export async function GET() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.student]);

        if (!user.student) {
            return jsonError("Профиль ученика не найден.", 404);
        }

        const topics = await getStudentTopicWeaknessSummary(user.student.id);
        return NextResponse.json({ topics });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.student, UserRole.teacher, UserRole.admin, UserRole.parent]);

        const body = await request.json();
        const input = body?.input ?? body;

        if (Array.isArray(input)) {
            if (!input.every(isTopicWeaknessInput)) {
                return jsonError("Некорректный массив признаков для topic weakness detector.");
            }

            const result = await predictTopicWeaknessSafe(input);
            return NextResponse.json({
                predictions: result.prediction,
                source: result.source,
            });
        }

        if (!isTopicWeaknessInput(input)) {
            return jsonError("Некорректный input для topic weakness detector.");
        }

        const result = await predictTopicWeaknessSafe(input);
        return NextResponse.json({
            prediction: result.prediction,
            source: result.source,
        });
    } catch (error) {
        return handleRouteError(error);
    }
}
