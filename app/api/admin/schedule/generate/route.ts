import { NextResponse } from "next/server";
import { handleRouteError } from "../../../../../lib/http";
import { requireRole } from "../../../../../lib/server-data";
import { generateSmartSchedule } from "../../../../../lib/smart-schedule";
import { requireSessionUser } from "../../../../../lib/session";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);
        const body = await request.json().catch(() => ({}));

        const result = await generateSmartSchedule({
            weekStartDate: body?.weekStartDate,
            useExistingConstraints: body?.useExistingConstraints !== false,
            createdById: user.id,
        });

        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        return handleRouteError(error);
    }
}
