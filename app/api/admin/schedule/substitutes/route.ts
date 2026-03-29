import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../../lib/http";
import { getScheduleSubstituteMatches, rankSubstituteCandidates } from "../../../../../lib/substitute-matcher";
import { requireRole } from "../../../../../lib/server-data";
import { requireSessionUser } from "../../../../../lib/session";

export async function GET(request: NextRequest) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const planId = request.nextUrl.searchParams.get("planId") ?? undefined;
        const substituteMatch = await getScheduleSubstituteMatches(planId);
        if (!substituteMatch) {
            return jsonError("Для текущего плана нет активного кейса замены.", 404);
        }

        return NextResponse.json({ substituteMatch });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const body = await request.json();
        const lessonContext = body?.lesson_context ?? body?.lessonContext;
        const candidates = body?.candidates;
        const topN = Number(body?.topN ?? body?.top_n ?? 5);

        if (!lessonContext || !Array.isArray(candidates)) {
            return jsonError("Нужны lesson_context и candidates для substitute matcher.");
        }

        const result = await rankSubstituteCandidates(lessonContext, candidates, Number.isFinite(topN) ? topN : 5);
        return NextResponse.json({
            candidates: result.ranked,
            source: result.source,
        });
    } catch (error) {
        return handleRouteError(error);
    }
}
