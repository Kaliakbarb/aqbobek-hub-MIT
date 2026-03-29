import { NextResponse } from "next/server";
import { handleRouteError } from "../../../../lib/http";
import { getScheduleDashboard, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { UserRole } from "@prisma/client";

export async function GET() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const schedule = await getScheduleDashboard();
        return NextResponse.json({ schedule });
    } catch (error) {
        return handleRouteError(error);
    }
}
