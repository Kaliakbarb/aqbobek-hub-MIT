import { AttendanceStatus, RiskLevel } from "@prisma/client";
import { prisma } from "./prisma";

export type BilimClassMockGrade = {
    id: string;
    subjectId: string;
    subjectName: string;
    type: string;
    displayValue: string;
    numericValue: number | null;
    percent: number | null;
    trend: string | null;
    term: string | null;
    status: string | null;
    recordedAt: string;
};

export type BilimClassMockAttendance = {
    id: string;
    subjectName: string | null;
    status: AttendanceStatus;
    note: string | null;
    recordedAt: string;
};

export type BilimClassMockRiskAlert = {
    id: string;
    subjectName: string | null;
    reason: string;
    riskLevel: RiskLevel;
    createdAt: string;
};

export type BilimClassMockStudentSnapshot = {
    studentId: string;
    userId: string;
    username: string;
    fullName: string;
    firstName: string;
    class: {
        id: string;
        name: string;
        grade: number;
        profile: string | null;
    };
    profileDirection: string | null;
    gpa: number;
    homeworkPct: number;
    streakDays: number;
    scenario: {
        code: "strong" | "risk" | "absences" | "falling";
        labelRu: string;
        notes: string[];
    };
    grades: BilimClassMockGrade[];
    attendance: BilimClassMockAttendance[];
    goals: Array<{ id: string; title: string; daysLeft: number | null }>;
    riskAlerts: BilimClassMockRiskAlert[];
};

function average(values: number[]) {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toFivePointScore(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return 0;
    return value <= 5 ? value : value / 20;
}

function inferStudentScenario(snapshot: {
    username: string;
    grades: BilimClassMockGrade[];
    attendance: BilimClassMockAttendance[];
    riskAlerts: BilimClassMockRiskAlert[];
    gpa: number;
    homeworkPct: number;
}) {
    const absenceCount = snapshot.attendance.filter((entry) => entry.status === AttendanceStatus.absent).length;
    const recentScores = snapshot.grades
        .slice(0, 4)
        .map((grade) => toFivePointScore(grade.numericValue ?? grade.percent))
        .filter((score) => score > 0);
    const olderScores = snapshot.grades
        .slice(4, 8)
        .map((grade) => toFivePointScore(grade.numericValue ?? grade.percent))
        .filter((score) => score > 0);
    const trendDelta = average(recentScores) - average(olderScores);

    if (snapshot.username === "student2" || (snapshot.gpa >= 4.8 && snapshot.homeworkPct >= 95)) {
        return {
            code: "strong" as const,
            labelRu: "сильный ученик",
            notes: ["стабильно высокие оценки", "высокое выполнение ДЗ", "без критичных рисков"],
        };
    }

    if (absenceCount >= 2) {
        return {
            code: "absences" as const,
            labelRu: "ученик с пропусками",
            notes: [`${absenceCount} пропуска в выборке`, "нужен контроль посещаемости"],
        };
    }

    if (snapshot.riskAlerts.length > 0) {
        return {
            code: "risk" as const,
            labelRu: "рисковый ученик",
            notes: ["есть активные risk alerts", "нужна точечная поддержка по слабым темам"],
        };
    }

    if (trendDelta < -0.2 || snapshot.grades.some((grade) => grade.trend === "down")) {
        return {
            code: "falling" as const,
            labelRu: "падение оценок",
            notes: ["виден нисходящий тренд по последним оценкам", "стоит проверить причины снижения"],
        };
    }

    return {
        code: "strong" as const,
        labelRu: "стабильный ученик",
        notes: ["данные без резких отклонений"],
    };
}

export async function getMockBilimClassStudents() {
    const students = await prisma.student.findMany({
        include: {
            user: true,
            schoolClass: true,
            grades: {
                include: { subject: true },
                orderBy: { recordedAt: "desc" },
            },
            attendance: {
                include: { subject: true },
                orderBy: { recordedAt: "desc" },
            },
            goals: {
                where: { completed: false },
                orderBy: { createdAt: "asc" },
            },
            riskAlerts: {
                where: { resolved: false },
                include: { subject: true },
                orderBy: { createdAt: "desc" },
            },
        },
        orderBy: {
            user: {
                fullName: "asc",
            },
        },
    });

    return students.map((student) => {
        const grades: BilimClassMockGrade[] = student.grades.map((grade) => ({
            id: grade.id,
            subjectId: grade.subjectId,
            subjectName: grade.subject.name,
            type: grade.type,
            displayValue: grade.displayValue,
            numericValue: grade.numericValue,
            percent: grade.percent,
            trend: grade.trend,
            term: grade.term,
            status: grade.status,
            recordedAt: grade.recordedAt.toISOString(),
        }));

        const attendance: BilimClassMockAttendance[] = student.attendance.map((entry) => ({
            id: entry.id,
            subjectName: entry.subject?.name ?? null,
            status: entry.status,
            note: entry.note,
            recordedAt: entry.recordedAt.toISOString(),
        }));

        const riskAlerts: BilimClassMockRiskAlert[] = student.riskAlerts.map((alert) => ({
            id: alert.id,
            subjectName: alert.subject?.name ?? null,
            reason: alert.reason,
            riskLevel: alert.riskLevel,
            createdAt: alert.createdAt.toISOString(),
        }));

        return {
            studentId: student.id,
            userId: student.userId,
            username: student.user.username,
            fullName: student.user.fullName,
            firstName: student.user.firstName,
            class: {
                id: student.schoolClass.id,
                name: student.schoolClass.name,
                grade: student.schoolClass.grade,
                profile: student.schoolClass.profile,
            },
            profileDirection: student.profileDirection,
            gpa: student.gpa,
            homeworkPct: student.homeworkPct,
            streakDays: student.streakDays,
            scenario: inferStudentScenario({
                username: student.user.username,
                grades,
                attendance,
                riskAlerts,
                gpa: student.gpa,
                homeworkPct: student.homeworkPct,
            }),
            grades,
            attendance,
            goals: student.goals.map((goal) => ({
                id: goal.id,
                title: goal.title,
                daysLeft: goal.daysLeft,
            })),
            riskAlerts,
        } satisfies BilimClassMockStudentSnapshot;
    });
}

export async function getMockBilimClassStudentSnapshot(studentId: string) {
    const students = await getMockBilimClassStudents();
    return students.find((student) => student.studentId === studentId) ?? null;
}

export async function getMockBilimClassClasses() {
    const students = await getMockBilimClassStudents();
    const classMap = new Map<string, {
        id: string;
        name: string;
        grade: number;
        profile: string | null;
        students: Array<{ studentId: string; fullName: string; scenario: string; gpa: number }>;
    }>();

    for (const student of students) {
        const existing = classMap.get(student.class.id) ?? {
            id: student.class.id,
            name: student.class.name,
            grade: student.class.grade,
            profile: student.class.profile,
            students: [],
        };

        existing.students.push({
            studentId: student.studentId,
            fullName: student.fullName,
            scenario: student.scenario.labelRu,
            gpa: student.gpa,
        });

        classMap.set(student.class.id, existing);
    }

    return [...classMap.values()].map((schoolClass) => ({
        ...schoolClass,
        studentCount: schoolClass.students.length,
        averageGpa: Number(average(schoolClass.students.map((student) => student.gpa)).toFixed(2)),
    }));
}

export async function getMockBilimClassRouteList() {
    const base = "/api/mock/bilimclass";
    return [
        { method: "GET", path: `${base}`, description: "Документация и список mock BilimClass маршрутов." },
        { method: "GET", path: `${base}/students`, description: "Список учеников со сценариями для демо." },
        { method: "GET", path: `${base}/classes`, description: "Список классов, учеников и средних показателей." },
        { method: "GET", path: `${base}/students/:studentId`, description: "Профиль и snapshot ученика." },
        { method: "GET", path: `${base}/students/:studentId/grades`, description: "Оценки ученика по предметам." },
        { method: "GET", path: `${base}/students/:studentId/attendance`, description: "Посещаемость и пропуски ученика." },
    ];
}
