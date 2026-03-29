import { NextResponse } from "next/server";
import { handleRouteError } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";
import { getChatHistory } from "../../../../lib/server-data";
import { requireSession } from "../../../../lib/session";

export async function GET() {
    try {
        const session = await requireSession();
        const messages = await getChatHistory(session.userId);
        return NextResponse.json({ messages });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function DELETE() {
    try {
        const session = await requireSession();
        await prisma.chatMessage.deleteMany({
            where: { userId: session.userId },
        });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error);
    }
}
