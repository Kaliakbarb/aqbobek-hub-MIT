import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { jsonError, handleRouteError } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";
import { requireSessionUser } from "../../../../lib/session";

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        const body = await request.json();
        const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
        const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

        if (!currentPassword || !newPassword) {
            return jsonError("Введите текущий и новый пароль.");
        }

        if (newPassword.length < 5) {
            return jsonError("Новый пароль должен быть не короче 5 символов.");
        }

        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) {
            return jsonError("Текущий пароль указан неверно.", 401);
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error);
    }
}
