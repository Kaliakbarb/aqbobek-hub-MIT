import { NextResponse } from "next/server";
import { handleRouteError } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";
import { createAdminEventLog, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { BroadcastAudienceType, EventLogKind, NewsCategory, UserRole } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);
        const body = await request.json();
        const announcements = Array.isArray(body?.announcements) ? body.announcements : [];
        const broadcasts = Array.isArray(body?.broadcasts) ? body.broadcasts : [];

        let importedAnnouncements = 0;
        let importedBroadcasts = 0;

        for (const item of announcements) {
            if (!item?.title || !item?.date) continue;

            const exists = await prisma.newsItem.findFirst({
                where: {
                    title: item.title,
                    publishedAt: new Date(item.date),
                },
            });

            if (exists) continue;

            await prisma.newsItem.create({
                data: {
                    category: NewsCategory.announcement,
                    title: item.title,
                    description: item.desc ?? "Импортировано из локального демо-хранилища.",
                    publishedAt: new Date(item.date),
                    highlight: Boolean(item.highlight),
                    createdByUserId: user.id,
                },
            });
            importedAnnouncements += 1;
        }

        for (const item of broadcasts) {
            if (!item?.text) continue;

            const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
            const exists = await prisma.broadcast.findFirst({
                where: {
                    text: item.text,
                    createdAt,
                },
            });

            if (exists) continue;

            await prisma.broadcast.create({
                data: {
                    audienceType: BroadcastAudienceType.all,
                    audienceLabel: item.audience ?? "Все пользователи",
                    text: item.text,
                    createdByUserId: user.id,
                    createdAt,
                },
            });
            importedBroadcasts += 1;
        }

        await createAdminEventLog({
            title: "Импорт локальных данных",
            note: `Импортировано объявлений: ${importedAnnouncements}, рассылок: ${importedBroadcasts}.`,
            kind: EventLogKind.system,
            userId: user.id,
        });

        return NextResponse.json({
            ok: true,
            importedAnnouncements,
            importedBroadcasts,
        });
    } catch (error) {
        return handleRouteError(error);
    }
}
