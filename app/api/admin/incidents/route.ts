import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";
import { createAdminEventLog, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { EventLogKind, IncidentStatus, UserRole } from "@prisma/client";

export async function GET() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const incidents = await prisma.incident.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ incidents });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);
        const body = await request.json();
        const title = typeof body?.title === "string" ? body.title.trim() : "";
        const location = typeof body?.location === "string" ? body.location.trim() : "";
        const owner = typeof body?.owner === "string" ? body.owner.trim() : user.fullName;
        const severity = typeof body?.severity === "string" ? body.severity : "Средне";

        if (!title || !location) {
            return jsonError("Введите заголовок и локацию инцидента.");
        }

        const incident = await prisma.incident.create({
            data: {
                title,
                location,
                ownerLabel: owner,
                ownerUserId: user.id,
                severity,
                status: IncidentStatus.open,
            },
        });

        await createAdminEventLog({
            title: "Новый инцидент",
            note: `${incident.title} • ${incident.location}`,
            kind: EventLogKind.incident,
            userId: user.id,
        });

        return NextResponse.json({ ok: true, incident });
    } catch (error) {
        return handleRouteError(error);
    }
}
