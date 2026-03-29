import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.student]);

        if (!user.student) {
            return jsonError("Профиль ученика не найден.", 404);
        }

        const body = await request.json();
        const title = typeof body?.title === "string" ? body.title.trim() : "";
        const color = typeof body?.color === "string" ? body.color : "bg-primary";

        if (!title) {
            return jsonError("Не удалось сохранить действие.");
        }

        const entry = await prisma.activityEntry.create({
            data: {
                studentId: user.student.id,
                title,
                color,
                occurredAt: new Date(),
            },
        });

        return NextResponse.json({ ok: true, entry });
    } catch (error) {
        return handleRouteError(error);
    }
}
