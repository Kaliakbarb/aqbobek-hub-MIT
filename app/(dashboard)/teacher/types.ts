export type TeacherDashboardPayload = {
    teacher: {
        fullName: string;
        firstName: string;
        subtitle: string;
    };
    adminMessages: Array<{ id: string; audience: string; text: string; createdAt: string }>;
    scheduleMeta: {
        weekLabel: string | null;
        pushAlertsEnabled: boolean;
        totalLessons: number;
        replacementCount: number;
    };
    stats: {
        totalStudents: number;
        avgGrade: number;
        riskCount: number;
        absences: number;
    };
    focusBoard: {
        classCount: number;
        urgentTaskCount: number;
        openTaskCount: number;
        completedTaskCount: number;
        replacementCount: number;
        nextLesson: {
            id: string;
            dayOfWeek: number;
            slotIndex: number;
            time: string;
            title: string;
            className: string;
            room: string;
            sourceType: string;
            isReplacement: boolean;
            statusLabel: string;
            statusTone: string;
        } | null;
    };
    classSummaries: Array<{
        id: string;
        name: string;
        subjects: string[];
        studentCount: number;
        avgGrade: number;
        riskCount: number;
        absences: number;
        focusLabel: string;
        topRiskReason: string;
    }>;
    activeAbsence: {
        id: string;
        startsAt: string;
        endsAt: string;
        startsAtIso: string;
        endsAtIso: string;
        reason: string;
        triggeredPlanId: string | null;
    } | null;
    upcomingLessons: Array<{
        id: string;
        dayOfWeek: number;
        slotIndex: number;
        time: string;
        title: string;
        className: string;
        room: string;
        sourceType: string;
        isReplacement: boolean;
        statusLabel: string;
        statusTone: string;
    }>;
    scheduleDays: Array<{
        dayOfWeek: number;
        dayLabel: string;
        shortLabel: string;
        lessonCount: number;
        slots: Array<{
            id: string;
            dayOfWeek: number;
            slotIndex: number;
            durationSlots: number;
            time: string;
            title: string;
            className: string;
            room: string;
            sourceType: string;
            isReplacement: boolean;
            statusLabel: string;
            statusTone: string;
        }>;
    }>;
    replacementLessons: Array<{
        id: string;
        time: string;
        title: string;
        className: string;
        room: string;
    }>;
    recentActions: Array<{
        id: string;
        title: string;
        note: string;
        kind: string;
        createdAt: string;
    }>;
    aiSummary: string;
    students: Array<{
        id: string;
        studentId: string;
        firstName: string;
        name: string;
        class: string;
        subject: string;
        drop: string;
        reason: string;
        risk: string;
    }>;
    tasks: Array<{
        id: string;
        title: string;
        note: string | null;
        done: boolean;
        urgent: boolean;
    }>;
};
