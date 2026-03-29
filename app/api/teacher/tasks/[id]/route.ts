import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../../lib/http";
import { prisma } from "../../../../../lib/prisma";
import { createAdminEventLog, requireRole } from "../../../../../lib/server-data";
import { requireSessionUser } from "../../../../../lib/session";
import { EventLogKind, UserRole } from "@prisma/client";

type Context = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Context) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.teacher]);

        if (!user.teacher) {
            return jsonError("Профиль учителя не найден.", 404);
        }

        const body = await request.json();
        const { id } = await params;

        const task = await prisma.teacherTask.findFirst({
            where: {
                id,
                teacherId: user.teacher.id,
            },
        });

        if (!task) {
            return jsonError("Задача не найдена.", 404);
        }

        const done = typeof body?.done === "boolean" ? body.done : !task.done;
        const updated = await prisma.teacherTask.update({
            where: { id },
            data: {
                done,
                completedAt: done ? new Date() : null,
            },
        });

        await createAdminEventLog({
            title: done ? "Задача учителя выполнена" : "Задача возвращена в работу",
            note: task.title,
            kind: EventLogKind.system,
            userId: user.id,
        });

        return NextResponse.json({ ok: true, task: updated });
    } catch (error) {
        return handleRouteError(error);
    }
}
