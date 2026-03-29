import { NextResponse } from "next/server";
import { getMockBilimClassClasses, getMockBilimClassRouteList, getMockBilimClassStudents } from "../../../../lib/mock-bilimclass";

export async function GET() {
    const [routes, students, classes] = await Promise.all([
        getMockBilimClassRouteList(),
        getMockBilimClassStudents(),
        getMockBilimClassClasses(),
    ]);

    return NextResponse.json({
        name: "Mock BilimClass API",
        description: "Реалистичный mock для демо-защиты: оценки, посещаемость, классы и сценарии учеников.",
        performance: "Данные отдаются из локальной demo-базы быстро и стабильно.",
        scenarios: students.map((student) => ({
            studentId: student.studentId,
            fullName: student.fullName,
            className: student.class.name,
            scenario: student.scenario.labelRu,
            notes: student.scenario.notes,
        })),
        stats: {
            totalStudents: students.length,
            totalClasses: classes.length,
            totalSubjects: [...new Set(students.flatMap((student) => student.grades.map((grade) => grade.subjectName)))].length,
        },
        routes,
    });
}
