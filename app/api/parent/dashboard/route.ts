import { NextResponse } from "next/server";
import { handleRouteError } from "../../../../lib/http";
import { getParentDashboard, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { UserRole } from "@prisma/client";

export async function GET() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.parent]);

        const dashboard = await getParentDashboard(user.id);
        return NextResponse.json({ dashboard });
    } catch (error) {
        return handleRouteError(error);
    }
}
