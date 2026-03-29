import { NextResponse } from "next/server";
import { handleRouteError } from "../../../lib/http";
import { prisma } from "../../../lib/prisma";
import { getMe } from "../../../lib/server-data";
import { requireSession } from "../../../lib/session";

export async function GET() {
    try {
        const session = await requireSession();
        const me = await getMe(session.userId);
        return NextResponse.json({ me });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await requireSession();
        const body = await request.json();
        const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
        const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";

        if (!firstName || !lastName) {
            return NextResponse.json({ error: "Имя и фамилия обязательны." }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: session.userId },
            data: {
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`.trim(),
            },
        });

        return NextResponse.json({
            ok: true,
            me: {
                id: updated.id,
                firstName: updated.firstName,
                lastName: updated.lastName,
                fullName: updated.fullName,
                email: updated.email,
            },
        });
    } catch (error) {
        return handleRouteError(error);
    }
}
