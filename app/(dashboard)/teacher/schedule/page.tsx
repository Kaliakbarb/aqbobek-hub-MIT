import { UserRole } from "@prisma/client";
import { getTeacherDashboard, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { TeacherScheduleView } from "../TeacherScheduleView";

export default async function TeacherSchedulePage() {
    const user = await requireSessionUser();
    requireRole(user, [UserRole.teacher]);

    const dashboard = await getTeacherDashboard(user.id);

    return <TeacherScheduleView dashboard={dashboard} />;
}
