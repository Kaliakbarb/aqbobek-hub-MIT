import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { encodeSession, SESSION_COOKIE } from "../../../../lib/demo-auth";
import { buildSessionPayload } from "../../../../lib/server-data";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
        const password = typeof body?.password === "string" ? body.password : "";

        if (!username || !password) {
            return NextResponse.json({ error: "Введите логин и пароль." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return NextResponse.json({ error: "Неверный логин или пароль." }, { status: 401 });
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            return NextResponse.json({ error: "Неверный логин или пароль." }, { status: 401 });
        }

        const session = buildSessionPayload(user);
        const response = NextResponse.json({ ok: true, session });
        response.cookies.set({
            name: SESSION_COOKIE,
            value: encodeSession(session),
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch {
        return NextResponse.json({ error: "Не удалось выполнить вход." }, { status: 500 });
    }
}
