import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../lib/http";
import { recommendResources, ResourceRecommendationContext, getStudentResourceRecommendations } from "../../../../lib/resource-recommender";
import { requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";

function isRecommendationContext(value: unknown): value is ResourceRecommendationContext {
    if (!value || typeof value !== "object") return false;

    const payload = value as Record<string, unknown>;
    return [
        "student_id",
        "grade_level",
        "preferred_language",
        "preferred_content_type",
        "subject_name",
        "weak_topic_name",
        "weak_topic_probability",
        "topic_mastery_score",
        "exam_proximity_days",
        "engagement_score",
        "available_study_minutes",
    ].every((key) => key in payload);
}

export async function GET(request: NextRequest) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.student]);

        if (!user.student) {
            return jsonError("Профиль ученика не найден.", 404);
        }

        const topN = Number(request.nextUrl.searchParams.get("topN") ?? "5");
        const resources = await getStudentResourceRecommendations(user.student.id, undefined, Number.isFinite(topN) ? topN : 5);
        return NextResponse.json({ resources });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.student, UserRole.teacher, UserRole.admin, UserRole.parent]);

        const body = await request.json();
        const context = body?.context ?? body;
        const topN = Number(body?.topN ?? body?.top_n ?? 5);

        if (!isRecommendationContext(context)) {
            return jsonError("Некорректный контекст для resource recommender.");
        }

        const result = await recommendResources(context, Number.isFinite(topN) ? topN : 5);
        return NextResponse.json({
            resources: result.resources,
            source: result.source,
        });
    } catch (error) {
        return handleRouteError(error);
    }
}
