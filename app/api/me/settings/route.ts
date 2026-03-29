import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";
import { requireSession } from "../../../../lib/session";

export async function GET() {
    try {
        const session = await requireSession();
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.userId },
        });

        return NextResponse.json({ settings });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await requireSession();
        const body = await request.json();

        if (typeof body !== "object" || body === null) {
            return jsonError("Некорректные данные.");
        }

        const settings = await prisma.userSettings.upsert({
            where: { userId: session.userId },
            create: {
                userId: session.userId,
                language: typeof body.language === "string" ? body.language : "Русский",
                themeAuto: typeof body.themeAuto === "boolean" ? body.themeAuto : true,
                emailAlerts: typeof body.emailAlerts === "boolean" ? body.emailAlerts : true,
                pushAlerts: typeof body.pushAlerts === "boolean" ? body.pushAlerts : true,
            },
            update: {
                language: typeof body.language === "string" ? body.language : undefined,
                themeAuto: typeof body.themeAuto === "boolean" ? body.themeAuto : undefined,
                emailAlerts: typeof body.emailAlerts === "boolean" ? body.emailAlerts : undefined,
                pushAlerts: typeof body.pushAlerts === "boolean" ? body.pushAlerts : undefined,
            },
        });

        return NextResponse.json({ ok: true, settings });
    } catch (error) {
        return handleRouteError(error);
    }
}
