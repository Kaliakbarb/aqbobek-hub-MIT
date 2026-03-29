import { NextResponse } from "next/server";
import { handleRouteError } from "../../../../lib/http";
import { getTeacherDashboard, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { UserRole } from "@prisma/client";

export async function GET() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.teacher]);

        const dashboard = await getTeacherDashboard(user.id);
        return NextResponse.json({ dashboard });
    } catch (error) {
        return handleRouteError(error);
    }
}
