import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "../../../../../lib/http";
import { requireRole } from "../../../../../lib/server-data";
import { getScheduleConstraintBundle, updateScheduleConstraints } from "../../../../../lib/smart-schedule";
import { requireSessionUser } from "../../../../../lib/session";

export async function GET() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const constraints = await getScheduleConstraintBundle();
        return NextResponse.json({ constraints });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const body = await request.json();
        const constraints = await updateScheduleConstraints(body ?? {});
        return NextResponse.json({ ok: true, constraints });
    } catch (error) {
        return handleRouteError(error);
    }
}
