import { UserRole } from "@prisma/client";
import { getTeacherDashboard, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { TeacherClassesView } from "../TeacherClassesView";

export default async function TeacherClassesPage() {
    const user = await requireSessionUser();
    requireRole(user, [UserRole.teacher]);

    const dashboard = await getTeacherDashboard(user.id);

    return <TeacherClassesView dashboard={dashboard} />;
}
