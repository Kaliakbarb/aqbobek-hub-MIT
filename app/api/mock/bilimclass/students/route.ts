import { NextResponse } from "next/server";
import { getMockBilimClassStudents } from "../../../../../lib/mock-bilimclass";

export async function GET() {
    const students = await getMockBilimClassStudents();

    return NextResponse.json({
        students: students.map((student) => ({
            studentId: student.studentId,
            fullName: student.fullName,
            firstName: student.firstName,
            username: student.username,
            class: student.class,
            gpa: student.gpa,
            homeworkPct: student.homeworkPct,
            streakDays: student.streakDays,
            scenario: student.scenario,
            activeRiskCount: student.riskAlerts.length,
            absencesCount: student.attendance.filter((entry) => entry.status === "absent").length,
        })),
    });
}
