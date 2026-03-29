import { NextResponse } from "next/server";
import { handleRouteError } from "../../../../lib/http";
import { createAdminEventLog, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { EventLogKind, UserRole } from "@prisma/client";

export async function POST() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.teacher]);

        await createAdminEventLog({
            title: "Сформирован отчет учителя",
            note: `Отчет создан пользователем ${user.fullName}.`,
            kind: EventLogKind.system,
            userId: user.id,
        });

        return NextResponse.json({
            ok: true,
            message: 'Отчет сформирован: 10 "А" стабилен, 10 "Б" требует короткого диагностического теста и разбора домашней работы.',
        });
    } catch (error) {
        return handleRouteError(error);
    }
}
