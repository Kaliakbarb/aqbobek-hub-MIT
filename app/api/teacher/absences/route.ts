import { NextResponse } from "next/server";
import { EventLogKind, TeacherAbsenceStatus, UserRole } from "@prisma/client";
import { handleRouteError, jsonError } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";
import { createAdminEventLog, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { createTeacherAbsenceAndReoptimize } from "../../../../lib/smart-schedule";

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.teacher]);

        const teacher = await prisma.teacher.findUnique({
            where: { userId: user.id },
        });

        if (!teacher) {
            return jsonError("Профиль учителя не найден.", 404);
        }

        const body = await request.json();
        const startsAt = typeof body?.startsAt === "string" ? body.startsAt : "";
        const endsAt = typeof body?.endsAt === "string" ? body.endsAt : "";
        const reason = typeof body?.reason === "string" && body.reason.trim().length > 0 ? body.reason.trim() : "Больничный";

        if (!startsAt || !endsAt) {
            return jsonError("Укажите дату начала и окончания больничного.");
        }

        const startDate = new Date(startsAt);
        const endDate = new Date(endsAt);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return jsonError("Некорректные даты больничного.");
        }
        if (endDate < startDate) {
            return jsonError("Дата окончания не может быть раньше даты начала.");
        }

        const overlappingAbsence = await prisma.teacherAbsence.findFirst({
            where: {
                teacherId: teacher.id,
                status: TeacherAbsenceStatus.active,
                startsAt: { lte: endDate },
                endsAt: { gte: startDate },
            },
        });

        if (overlappingAbsence) {
            return jsonError("На этот период уже есть активный больничный.");
        }

        const result = await createTeacherAbsenceAndReoptimize({
            teacherId: teacher.id,
            startsAt,
            endsAt,
            reason,
            createdById: user.id,
        });

        await createAdminEventLog({
            title: "Учитель оформил больничный",
            note: `${user.fullName}: ${startDate.toISOString().slice(0, 10)} - ${endDate.toISOString().slice(0, 10)} • ${reason}`,
            kind: EventLogKind.schedule,
            userId: user.id,
        });

        return NextResponse.json({
            ok: true,
            message: `Больничный оформлен. Перестроено слотов: ${result.affectedSlots}, нерешенных конфликтов: ${result.unresolvedCount}.`,
            result,
        });
    } catch (error) {
        return handleRouteError(error);
    }
}
