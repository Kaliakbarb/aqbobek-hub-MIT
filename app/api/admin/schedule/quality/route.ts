import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../../lib/http";
import { predictScheduleQualitySafe, getScheduleQualitySummary } from "../../../../../lib/schedule-quality";
import { requireRole } from "../../../../../lib/server-data";
import { requireSessionUser } from "../../../../../lib/session";

export async function GET(request: NextRequest) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const planId = request.nextUrl.searchParams.get("planId") ?? undefined;
        const quality = await getScheduleQualitySummary(planId);
        if (!quality) {
            return jsonError("План расписания не найден.", 404);
        }

        return NextResponse.json({ quality });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const body = await request.json();
        const metrics = body?.metrics ?? body;
        if (!metrics || typeof metrics !== "object") {
            return jsonError("Некорректные метрики качества расписания.");
        }

        const result = await predictScheduleQualitySafe(metrics);
        return NextResponse.json({
            quality: result.prediction,
            source: result.source,
        });
    } catch (error) {
        return handleRouteError(error);
    }
}
