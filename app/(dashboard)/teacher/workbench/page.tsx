import { UserRole } from "@prisma/client";
import { getTeacherDashboard, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { TeacherWorkbenchView } from "../TeacherWorkbenchView";

export default async function TeacherWorkbenchPage() {
    const user = await requireSessionUser();
    requireRole(user, [UserRole.teacher]);

    const dashboard = await getTeacherDashboard(user.id);

    return <TeacherWorkbenchView dashboard={dashboard} />;
}
