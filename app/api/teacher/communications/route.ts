import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../lib/http";
import { createAdminEventLog, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { EventLogKind, UserRole } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.teacher]);

        const body = await request.json();
        const action = typeof body?.action === "string" ? body.action : "";

        if (!action) {
            return jsonError("Действие не указано.");
        }

        await createAdminEventLog({
            title: "Коммуникация учителя",
            note: `${user.fullName}: ${action}`,
            kind: EventLogKind.mail,
            userId: user.id,
        });

        const message =
            action === "notify-parents"
                ? 'Черновик уведомления для родителей 10 "Б" подготовлен и сохранен в журнале коммуникаций.'
                : action === "generate-test"
                    ? "Диагностический тест на 10 минут создан. Его можно выдать на следующий урок."
                    : action.startsWith("review-student:")
                        ? `Открыта карточка ученика: ${action.replace("review-student:", "")}. Приоритет - персональная работа на следующем уроке.`
                        : action.startsWith("broadcast:")
                            ? "Сообщение администрации отмечено как просмотренное в журнале коммуникаций."
                            : "Действие выполнено.";

        return NextResponse.json({ ok: true, message });
    } catch (error) {
        return handleRouteError(error);
    }
}
