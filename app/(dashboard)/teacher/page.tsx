import { UserRole } from "@prisma/client";
import { getTeacherDashboard, requireRole } from "../../../lib/server-data";
import { requireSessionUser } from "../../../lib/session";
import { TeacherOverviewView } from "./TeacherOverviewView";

export default async function TeacherPage() {
    const user = await requireSessionUser();
    requireRole(user, [UserRole.teacher]);

    const dashboard = await getTeacherDashboard(user.id);

    return <TeacherOverviewView dashboard={dashboard} />;
}
