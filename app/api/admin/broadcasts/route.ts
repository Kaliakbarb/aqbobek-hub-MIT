import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";
import { createAdminEventLog, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { BroadcastAudienceType, EventLogKind, UserRole } from "@prisma/client";

function getAudienceConfig(audience: string) {
    if (audience === "Учителя") {
        return {
            audienceType: BroadcastAudienceType.role,
            targetRole: UserRole.teacher,
        };
    }

    if (audience === "Родители") {
        return {
            audienceType: BroadcastAudienceType.role,
            targetRole: UserRole.parent,
        };
    }

    if (audience === "Ученики 10-х классов") {
        return {
            audienceType: BroadcastAudienceType.class,
            targetRole: null,
        };
    }

    return {
        audienceType: BroadcastAudienceType.all,
        targetRole: null,
    };
}

export async function GET() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const broadcasts = await prisma.broadcast.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ broadcasts });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const body = await request.json();
        const audience = typeof body?.audience === "string" ? body.audience : "Все пользователи";
        const text = typeof body?.text === "string" ? body.text.trim() : "";

        if (!text) {
            return jsonError("Введите текст рассылки.");
        }

        const config = getAudienceConfig(audience);
        const classTarget = audience === "Ученики 10-х классов"
            ? await prisma.schoolClass.findFirst({ where: { name: "10 А" } })
            : null;

        const broadcast = await prisma.broadcast.create({
            data: {
                audienceLabel: audience,
                audienceType: config.audienceType,
                targetRole: config.targetRole,
                targetClassId: classTarget?.id,
                text,
                createdByUserId: user.id,
            },
        });

        await createAdminEventLog({
            title: "Новая рассылка",
            note: `${audience}: ${text}`,
            kind: EventLogKind.mail,
            userId: user.id,
        });

        return NextResponse.json({ ok: true, broadcast });
    } catch (error) {
        return handleRouteError(error);
    }
}
