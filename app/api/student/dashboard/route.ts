import { NextResponse } from "next/server";
import { handleRouteError } from "../../../../lib/http";
import { getStudentDashboard, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { UserRole } from "@prisma/client";

export async function GET() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.student]);

        const dashboard = await getStudentDashboard(user.id);
        return NextResponse.json({ dashboard });
    } catch (error) {
        return handleRouteError(error);
    }
}
