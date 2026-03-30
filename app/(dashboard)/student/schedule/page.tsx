import React from "react";
import { UserRole } from "@prisma/client";
import { StudentScheduleView } from "./StudentScheduleView";
import { getStudentDashboard, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";

export default async function StudentSchedulePage() {
    const user = await requireSessionUser();
    requireRole(user, [UserRole.student]);
    const dashboard = await getStudentDashboard(user.id);

    return <StudentScheduleView dashboard={dashboard} />;
}
