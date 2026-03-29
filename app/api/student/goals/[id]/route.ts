import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../../lib/http";
import { prisma } from "../../../../../lib/prisma";
import { requireRole } from "../../../../../lib/server-data";
import { requireSessionUser } from "../../../../../lib/session";
import { UserRole } from "@prisma/client";

type Context = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Context) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.student]);

        if (!user.student) {
            return jsonError("Профиль ученика не найден.", 404);
        }

        const body = await request.json();
        const { id } = await params;

        const goal = await prisma.studentGoal.findFirst({
            where: {
                id,
                studentId: user.student.id,
            },
        });

        if (!goal) {
            return jsonError("Цель не найдена.", 404);
        }

        const updated = await prisma.studentGoal.update({
            where: { id },
            data: {
                completed: typeof body?.completed === "boolean" ? body.completed : !goal.completed,
            },
        });

        return NextResponse.json({ ok: true, goal: updated });
    } catch (error) {
        return handleRouteError(error);
    }
}
