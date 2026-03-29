import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../../lib/http";
import { prisma } from "../../../../../lib/prisma";
import { createAdminEventLog, requireRole } from "../../../../../lib/server-data";
import { requireSessionUser } from "../../../../../lib/session";
import { ApprovalStatus, EventLogKind, UserRole } from "@prisma/client";

type Context = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Context) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);
        const { id } = await params;
        const body = await request.json();

        const statusValue = body?.status === "approved" ? ApprovalStatus.approved : body?.status === "rejected" ? ApprovalStatus.rejected : null;
        if (!statusValue) {
            return jsonError("Некорректный статус.");
        }

        const approval = await prisma.approval.findUnique({ where: { id } });
        if (!approval) {
            return jsonError("Заявка не найдена.", 404);
        }

        const updated = await prisma.approval.update({
            where: { id },
            data: {
                status: statusValue,
                decidedAt: new Date(),
                decidedById: user.id,
            },
        });

        await createAdminEventLog({
            title: statusValue === ApprovalStatus.approved ? "Заявка согласована" : "Заявка отклонена",
            note: approval.title,
            kind: EventLogKind.approval,
            userId: user.id,
        });

        return NextResponse.json({ ok: true, approval: updated });
    } catch (error) {
        return handleRouteError(error);
    }
}
