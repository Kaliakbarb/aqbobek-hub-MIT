import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { NewsCategory, UserRole } from "@prisma/client";

type Context = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Context) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);
        const { id } = await params;
        const body = await request.json();

        const item = await prisma.newsItem.update({
            where: { id },
            data: {
                title: typeof body?.title === "string" ? body.title.trim() : undefined,
                description: typeof body?.description === "string" ? body.description.trim() : undefined,
                category: typeof body?.category === "string"
                    ? (NewsCategory[body.category as keyof typeof NewsCategory] ?? undefined)
                    : undefined,
                highlight: typeof body?.highlight === "boolean" ? body.highlight : undefined,
                pinned: typeof body?.pinned === "boolean" ? body.pinned : undefined,
            },
        });

        return NextResponse.json({ ok: true, item });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function DELETE(_request: Request, { params }: Context) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);
        const { id } = await params;

        const existing = await prisma.newsItem.findUnique({ where: { id } });
        if (!existing) {
            return jsonError("Новость не найдена.", 404);
        }

        await prisma.newsItem.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error);
    }
}
