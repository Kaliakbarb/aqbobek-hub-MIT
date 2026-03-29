import { NextResponse } from "next/server";
import { handleRouteError } from "../../../../lib/http";
import { getStudentProfile, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { UserRole } from "@prisma/client";

export async function GET() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.student]);

        const profile = await getStudentProfile(user.id);
        return NextResponse.json({ profile });
    } catch (error) {
        return handleRouteError(error);
    }
}
