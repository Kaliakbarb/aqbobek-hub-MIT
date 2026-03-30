import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../../lib/http";
import { requireRole } from "../../../../../lib/server-data";
import { createTeacherAbsenceAndReoptimize } from "../../../../../lib/smart-schedule";
import { requireSessionUser } from "../../../../../lib/session";

export async function POST(request: NextRequest) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const body = await request.json();
        const teacherId = typeof body?.teacherId === "string" ? body.teacherId : "";
        const startsAt = typeof body?.startsAt === "string" ? body.startsAt : "";
        const endsAt = typeof body?.endsAt === "string" ? body.endsAt : startsAt;
        const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : "Больничный";

        if (!teacherId || !startsAt) {
            return jsonError("Нужны teacherId и startsAt для запуска перестройки.");
        }

        const result = await createTeacherAbsenceAndReoptimize({
            teacherId,
            startsAt,
            endsAt,
            reason,
            createdById: user.id,
        });

        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        return handleRouteError(error);
    }
}
