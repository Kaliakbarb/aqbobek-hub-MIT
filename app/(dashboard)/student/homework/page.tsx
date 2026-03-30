import React from "react";
import { UserRole } from "@prisma/client";
import { getStudentHomeworkHub } from "../../../../lib/server-data";
import { requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";
import { StudentHomeworkView } from "./StudentHomeworkView";

export default async function StudentHomeworkPage() {
    const user = await requireSessionUser();
    requireRole(user, [UserRole.student]);
    const hub = await getStudentHomeworkHub(user.id);

    return <StudentHomeworkView hub={hub} />;
}
