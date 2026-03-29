import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
    return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
        return jsonError("Требуется авторизация.", 401);
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
        return jsonError("Недостаточно прав.", 403);
    }

    const message = error instanceof Error ? error.message : "Внутренняя ошибка сервера.";
    return jsonError(message, 500);
}
