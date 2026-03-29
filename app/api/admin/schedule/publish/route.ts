import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../../lib/http";
import { prisma } from "../../../../../lib/prisma";
import { createAdminEventLog, requireRole } from "../../../../../lib/server-data";
import { requireSessionUser } from "../../../../../lib/session";
import { EventLogKind, SchedulePlanStatus, UserRole } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);
        const body = await request.json();
        const planId = typeof body?.planId === "string" ? body.planId : "";

        if (!planId) {
            return jsonError("Идентификатор плана не указан.");
        }

        await prisma.schedulePlan.updateMany({
            where: { status: SchedulePlanStatus.published },
            data: { status: SchedulePlanStatus.draft },
        });

        const plan = await prisma.schedulePlan.update({
            where: { id: planId },
            data: {
                status: SchedulePlanStatus.published,
                publishedAt: new Date(),
            },
        });

        await createAdminEventLog({
            title: "Расписание опубликовано",
            note: plan.title,
            kind: EventLogKind.schedule,
            userId: user.id,
        });

        return NextResponse.json({ ok: true, plan });
    } catch (error) {
        return handleRouteError(error);
    }
}
