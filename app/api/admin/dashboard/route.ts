import { NextResponse } from "next/server";
import { handleRouteError } from "../../../../lib/http";
import { getAdminDashboard, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { UserRole } from "@prisma/client";

export async function GET() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const dashboard = await getAdminDashboard();
        return NextResponse.json({ dashboard });
    } catch (error) {
        return handleRouteError(error);
    }
}
