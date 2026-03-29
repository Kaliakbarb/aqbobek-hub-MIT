import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../../lib/http";
import { prisma } from "../../../../../lib/prisma";
import { createAdminEventLog, requireRole } from "../../../../../lib/server-data";
import { requireSessionUser } from "../../../../../lib/session";
import { EventLogKind, IncidentStatus, UserRole } from "@prisma/client";

type Context = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Context) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);
        const { id } = await params;
        const body = await request.json();
        const statusValue = body?.status === "resolved" ? IncidentStatus.resolved : body?.status === "open" ? IncidentStatus.open : null;

        if (!statusValue) {
            return jsonError("Некорректный статус.");
        }

        const incident = await prisma.incident.findUnique({ where: { id } });
        if (!incident) {
            return jsonError("Инцидент не найден.", 404);
        }

        const updated = await prisma.incident.update({
            where: { id },
            data: {
                status: statusValue,
                resolvedAt: statusValue === IncidentStatus.resolved ? new Date() : null,
            },
        });

        await createAdminEventLog({
            title: statusValue === IncidentStatus.resolved ? "Инцидент закрыт" : "Инцидент открыт",
            note: `${incident.title} • ${incident.location}`,
            kind: EventLogKind.incident,
            userId: user.id,
        });

        return NextResponse.json({ ok: true, incident: updated });
    } catch (error) {
        return handleRouteError(error);
    }
}
