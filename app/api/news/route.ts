import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../lib/http";
import { prisma } from "../../../lib/prisma";
import { getVisibleNews, requireRole } from "../../../lib/server-data";
import { requireSessionUser } from "../../../lib/session";
import { NewsCategory, UserRole } from "@prisma/client";

export async function GET() {
    try {
        const user = await requireSessionUser();
        const items = await getVisibleNews(user.id);
        return NextResponse.json({ items });
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
        const description = typeof body?.description === "string" ? body.description.trim() : "";
        const categoryKey = typeof body?.category === "string" ? body.category : "announcement";

        if (!title || !description) {
            return jsonError("Заполните заголовок и описание.");
        }

        const item = await prisma.newsItem.create({
            data: {
                title,
                description,
                category: (NewsCategory[categoryKey as keyof typeof NewsCategory] ?? NewsCategory.announcement) as NewsCategory,
                publishedAt: body?.publishedAt ? new Date(body.publishedAt) : new Date(),
                highlight: Boolean(body?.highlight),
                pinned: Boolean(body?.pinned),
                createdByUserId: user.id,
            },
        });

        return NextResponse.json({ ok: true, item });
    } catch (error) {
        return handleRouteError(error);
    }
}
