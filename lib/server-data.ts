import {
    ApprovalStatus,
    AttendanceStatus,
    BroadcastAudienceType,
    IncidentStatus,
    KioskItemType,
    NewsCategory,
    Prisma,
    RiskLevel,
    SchedulePlanStatus,
    UserRole,
} from "@prisma/client";
import { prisma } from "./prisma";
import { getStudentResourceRecommendations } from "./resource-recommender";
import { getScheduleQualitySummary } from "./schedule-quality";
import { getScheduleSubstituteMatches } from "./substitute-matcher";
import { getStudentTopicWeaknessSummary } from "./topic-weakness";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const monthFormatter = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

function average(values: number[]) {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, digits = 1) {
    return Number(value.toFixed(digits));
}

function formatNewsCategory(category: NewsCategory) {
    if (category === NewsCategory.announcement) return "Объявление";
    if (category === NewsCategory.olympiad) return "Олимпиада";
    if (category === NewsCategory.schedule) return "Расписание";
    if (category === NewsCategory.courses) return "Курсы";
    if (category === NewsCategory.sports) return "Спорт";
    return "Событие";
}

function formatRiskLevel(level: RiskLevel) {
    if (level === RiskLevel.high) return "Высокий";
    if (level === RiskLevel.medium) return "Средний";
    return "Низкий";
}

function formatDate(value: Date) {
    return dateFormatter.format(value);
}

function formatMonth(value: Date) {
    const result = monthFormatter.format(value);
    return result.charAt(0).toUpperCase() + result.slice(1);
}

function matchesBroadcastForUser(
    broadcast: {
        audienceType: BroadcastAudienceType;
        targetRole: UserRole | null;
        targetClassId: string | null;
    },
    user: {
        role: UserRole;
        student?: { classId: string } | null;
        parentLinks?: Array<{ student: { classId: string } }>;
    },
) {
    if (broadcast.audienceType === BroadcastAudienceType.all) return true;
    if (broadcast.audienceType === BroadcastAudienceType.role) {
        return broadcast.targetRole === user.role;
    }

    const classIds = new Set<string>();
    if (user.student?.classId) classIds.add(user.student.classId);
    for (const link of user.parentLinks ?? []) {
        classIds.add(link.student.classId);
    }

    return broadcast.targetClassId ? classIds.has(broadcast.targetClassId) : false;
}

function matchesNewsForUser(
    item: {
        targetRole: UserRole | null;
        targetClassId: string | null;
    },
    user: {
        role: UserRole;
        student?: { classId: string } | null;
        parentLinks?: Array<{ student: { classId: string } }>;
    },
) {
    const classIds = new Set<string>();
    if (user.student?.classId) classIds.add(user.student.classId);
    for (const link of user.parentLinks ?? []) {
        classIds.add(link.student.classId);
    }

    const roleMatch = !item.targetRole || item.targetRole === user.role;
    const classMatch = !item.targetClassId || classIds.has(item.targetClassId);
    return roleMatch && classMatch;
}

export function requireRole<T extends { role: UserRole }>(user: T, roles: UserRole[]) {
    if (!roles.includes(user.role)) {
        throw new Error("FORBIDDEN");
    }
}

export function buildSessionPayload(user: {
    id: string;
    username: string;
    role: UserRole;
    fullName: string;
    homePath: string;
}) {
    return {
        userId: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        homePath: user.homePath,
    };
}

export async function getMe(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { settings: true },
    });

    if (!user) return null;

    return {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        homePath: user.homePath,
        settings: user.settings,
    };
}

export async function getVisibleNews(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            student: true,
            parentLinks: {
                include: {
                    student: true,
                },
            },
        },
    });

    if (!user) return [];

    const news = await prisma.newsItem.findMany({
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    });

    return news
        .filter((item) => matchesNewsForUser(item, user))
        .map((item) => ({
            id: item.id,
            type: formatNewsCategory(item.category),
            title: item.title,
            desc: item.description,
            date: formatDate(item.publishedAt),
            isoDate: item.publishedAt.toISOString(),
            highlight: item.highlight,
            pinned: item.pinned,
        }));
}

export async function getStudentDashboard(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            student: {
                include: {
                    schoolClass: true,
                    grades: {
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
            },
        },
    });

    if (!user?.student) return null;

    const latestPlan = await prisma.schedulePlan.findFirst({
        where: { status: SchedulePlanStatus.published },
        orderBy: { publishedAt: "desc" },
        include: {
            slots: {
                where: { classId: user.student.classId },
                include: {
                    subject: true,
                },
                orderBy: { timeLabel: "asc" },
            },
        },
    });

    const [news, topicWeakness] = await Promise.all([
        getVisibleNews(userId),
        getStudentTopicWeaknessSummary(user.student.id),
    ]);
    const resourceRecommendations = await getStudentResourceRecommendations(user.student.id, topicWeakness, 5);
    const subjectMap = new Map<string, { name: string; grade: string; trend: string; progress: number; color: string }>();

    for (const grade of user.student.grades) {
        if (subjectMap.has(grade.subjectId)) continue;
        const progress = Math.round(grade.percent ?? grade.numericValue ?? 0);
        subjectMap.set(grade.subjectId, {
            name: grade.subject.name,
            grade: grade.displayValue,
            trend: grade.trend ?? "up",
            progress,
            color: progress >= 95 ? "bg-green-500" : progress >= 90 ? "bg-blue-500" : progress >= 80 ? "bg-primary" : "bg-orange-500",
        });
    }

    const primaryRisk = user.student.riskAlerts[0];
    const topSubject = [...subjectMap.values()].sort((left, right) => right.progress - left.progress)[0];
    const nextGoal = user.student.goals[0] ?? null;

    return {
        student: {
            fullName: user.fullName,
            firstName: user.firstName,
            className: user.student.schoolClass.name,
            gpa: user.student.gpa,
            homeworkPct: user.student.homeworkPct,
            rank: user.student.rank,
            rankTotal: user.student.rankTotal,
        },
        subjects: [...subjectMap.values()].slice(0, 6),
        lessons: latestPlan?.slots.map((slot) => ({
            id: slot.id,
            time: slot.timeLabel,
            title: slot.subject.name,
            room: slot.room.startsWith("Каб.") || slot.room.startsWith("Лаб.") ? slot.room : `Каб. ${slot.room}`,
            highlight: primaryRisk?.subjectId === slot.subjectId,
        })) ?? [],
        goal: nextGoal,
        insights: {
            primaryRisk: primaryRisk ? {
                title: `Зона риска: ${primaryRisk.subject?.name ?? "Предмет"}`,
                probability: 82,
                reason: primaryRisk.reason,
            } : null,
            topSubject: topSubject ? {
                title: `Сильная динамика: ${topSubject.name}`,
                text: `Последние результаты по предмету держатся на уровне ${topSubject.grade}. Продолжай в том же темпе.`,
            } : null,
        },
        topicWeakness,
        resourceRecommendations,
        news: news.slice(0, 2),
    };
}

export async function getStudentProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            student: {
                include: {
                    schoolClass: true,
                    achievements: true,
                    skills: true,
                    activityEntries: {
                        orderBy: { occurredAt: "desc" },
                    },
                    badges: true,
                },
            },
        },
    });

    if (!user?.student) return null;

    return {
        fullName: user.fullName,
        className: user.student.schoolClass.name,
        profileDirection: user.student.profileDirection,
        gpa: user.student.gpa,
        rank: user.student.rank,
        rankTotal: user.student.rankTotal,
        achievements: user.student.achievements,
        skills: user.student.skills,
        badges: user.student.badges,
        activity: user.student.activityEntries.map((item) => ({
            id: item.id,
            date: formatMonth(item.occurredAt),
            title: item.title,
            color: item.color,
        })),
    };
}

export async function getTeacherDashboard(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            teacher: {
                include: {
                    tasks: {
                        orderBy: [{ urgent: "desc" }, { createdAt: "asc" }],
                    },
                    assignments: {
                        include: {
                            schoolClass: true,
                            subject: true,
                        },
                    },
                },
            },
        },
    });

    if (!user?.teacher) return null;

    const classIds = [...new Set(user.teacher.assignments.map((item) => item.classId))];
    const students = await prisma.student.findMany({
        where: { classId: { in: classIds } },
        include: {
            user: true,
            schoolClass: true,
            riskAlerts: {
                where: { resolved: false },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    const teacherStudentIds = students.map((item) => item.id);
    const attendance = await prisma.attendanceRecord.findMany({
        where: {
            studentId: { in: teacherStudentIds },
            status: AttendanceStatus.absent,
        },
    });

    const broadcasts = await prisma.broadcast.findMany({
        orderBy: { createdAt: "desc" },
    });

    const visibleBroadcasts = broadcasts
        .filter((item) => matchesBroadcastForUser(item, user))
        .slice(0, 3)
        .map((item) => ({
            id: item.id,
            audience: item.audienceLabel,
            text: item.text,
        }));

    const riskStudents = students
        .flatMap((student) =>
            student.riskAlerts.map((alert) => ({
                id: alert.id,
                name: student.user.fullName,
                class: student.schoolClass.name,
                drop: alert.dropLabel,
                reason: alert.reason,
                risk: formatRiskLevel(alert.riskLevel),
            })),
        )
        .sort((left, right) => (left.risk === "Высокий" ? -1 : 1) - (right.risk === "Высокий" ? -1 : 1));

    const avgGrade = average(students.map((item) => item.gpa));

    return {
        teacher: {
            fullName: user.fullName,
            subtitle: user.teacher.assignments
                .slice(0, 2)
                .map((item) => `${item.subject.name}, ${item.schoolClass.name}`)
                .join(" • "),
        },
        adminMessages: visibleBroadcasts,
        stats: {
            totalStudents: students.length,
            avgGrade: round(avgGrade, 1),
            riskCount: riskStudents.filter((item) => item.risk === "Высокий").length,
            absences: attendance.length,
        },
        aiSummary:
            riskStudents.length > 0
                ? `${riskStudents[0].class} требует внимания: ${riskStudents[0].reason}. Рекомендуется короткое диагностическое тестирование и точечная работа с домашними заданиями.`
                : "В группах наблюдается стабильная динамика. Можно усилить работу через мини-тесты и индивидуальные рекомендации.",
        students: riskStudents,
        tasks: user.teacher.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            note: task.note,
            done: task.done,
            urgent: task.urgent,
        })),
    };
}

export async function getParentDashboard(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            parentLinks: {
                include: {
                    student: {
                        include: {
                            user: true,
                            schoolClass: true,
                            grades: {
                                include: { subject: true },
                                orderBy: { recordedAt: "desc" },
                            },
                            attendance: {
                                orderBy: { recordedAt: "desc" },
                            },
                            riskAlerts: {
                                where: { resolved: false },
                                include: { subject: true },
                                orderBy: { createdAt: "desc" },
                            },
                        },
                    },
                },
            },
        },
    });

    const linkedStudent = user?.parentLinks[0]?.student;
    if (!user || !linkedStudent) return null;

    const absences = linkedStudent.attendance.filter((item) => item.status === AttendanceStatus.absent);
    const grades = linkedStudent.grades.slice(0, 4).map((grade) => ({
        id: grade.id,
        name: grade.subject.name,
        grade: grade.displayValue,
        type: grade.type,
        status: grade.status ?? (grade.displayValue === "Н" ? "bad" : grade.numericValue && grade.numericValue >= 5 ? "good" : "neutral"),
    }));
    const news = await getVisibleNews(userId);
    const risk = linkedStudent.riskAlerts[0];

    return {
        parent: {
            fullName: user.fullName,
        },
        child: {
            fullName: linkedStudent.user.fullName,
            className: linkedStudent.schoolClass.name,
            gpa: linkedStudent.gpa,
            absences: absences.length,
        },
        grades,
        aiSummary: risk
            ? `Ваш ребенок показывает хорошую динамику по сильным предметам, однако стоит уделить внимание предмету ${risk.subject?.name ?? "из зоны риска"}: ${risk.reason}.`
            : "Ваш ребенок держит стабильный темп. Рекомендуется сохранить текущий режим подготовки и контроль дедлайнов.",
        recommendation: "Рекомендуется обсудить с ребенком тайм-менеджмент и выделить время на повторение сложных тем в выходные.",
        news: news.slice(0, 2),
    };
}

export async function getAdminDashboard() {
    const [studentCount, teacherCount, approvals, incidents, eventLogs] = await Promise.all([
        prisma.student.count(),
        prisma.teacher.count(),
        prisma.approval.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.incident.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.eventLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    ]);

    return {
        stats: {
            students: studentCount,
            teachers: teacherCount,
            pendingApprovals: approvals.filter((item) => item.status === ApprovalStatus.pending).length,
            openIncidents: incidents.filter((item) => item.status === IncidentStatus.open).length,
        },
        approvals: approvals.map((item) => ({
            id: item.id,
            title: item.title,
            meta: item.meta,
            priority: item.priority,
            status: item.status,
        })),
        incidents: incidents.map((item) => ({
            id: item.id,
            title: item.title,
            location: item.location,
            owner: item.ownerLabel,
            severity: item.severity,
            status: item.status,
        })),
        events: eventLogs.map((item) => ({
            id: item.id,
            title: item.title,
            note: item.note,
            kind: item.kind,
        })),
    };
}

export async function getScheduleDashboard() {
    const plan = await prisma.schedulePlan.findFirst({
        orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
        include: {
            slots: {
                include: {
                    schoolClass: true,
                    subject: true,
                    teacher: {
                        include: {
                            user: true,
                        },
                    },
                },
                orderBy: [{ schoolClass: { name: "asc" } }, { timeLabel: "asc" }],
            },
            conflicts: {
                orderBy: { createdAt: "asc" },
            },
        },
    });

    const classes = await prisma.schoolClass.findMany({ orderBy: { name: "asc" } });
    const [quality, substituteMatch] = plan
        ? await Promise.all([
            getScheduleQualitySummary(plan.id),
            getScheduleSubstituteMatches(plan.id),
        ])
        : [null, null];

    if (!plan) {
        return {
            plan: null,
            classes: classes.map((item) => ({ id: item.id, name: item.name, slots: [] })),
            conflicts: [],
            quality: null,
            substituteMatch: null,
        };
    }

    return {
        plan: {
            id: plan.id,
            status: plan.status,
            published: plan.status === SchedulePlanStatus.published,
        },
        classes: classes.map((item) => ({
            id: item.id,
            name: item.name,
            slots: plan.slots
                .filter((slot) => slot.classId === item.id)
                .map((slot) => ({
                    id: slot.id,
                    time: slot.timeLabel,
                    subject: slot.subject.name,
                    teacher: slot.teacher?.user.fullName ?? "Подгруппы / замена",
                    room: slot.room,
                    split: slot.split,
                })),
        })),
        conflicts: plan.conflicts.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            severity: item.severity,
            resolved: item.resolved,
        })),
        quality,
        substituteMatch,
    };
}

export async function getLeaderboard(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            student: {
                include: {
                    badges: true,
                },
            },
        },
    });

    const entries = await prisma.leaderboardEntry.findMany({
        include: {
            student: {
                include: {
                    user: true,
                    schoolClass: true,
                },
            },
        },
        orderBy: [{ category: "asc" }, { rank: "asc" }],
    });

    const categories = [...new Set(entries.map((item) => item.category))];
    const rankings = Object.fromEntries(
        categories.map((category) => [
            category,
            entries
                .filter((entry) => entry.category === category)
                .map((entry) => ({
                    rank: entry.rank,
                    name: entry.student.user.fullName,
                    class: entry.student.schoolClass.name,
                    points: entry.points,
                    trend: entry.trend ?? "-",
                    me: entry.student.userId === userId,
                })),
        ]),
    );

    return {
        rankings,
        streakDays: user?.student?.streakDays ?? 0,
        badges: user?.student?.badges ?? [],
    };
}

export async function getKioskData() {
    const items = await prisma.kioskItem.findMany({
        where: { active: true },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return {
        replacements: items.filter((item) => item.type === KioskItemType.replacement),
        featured: items.find((item) => item.type === KioskItemType.announcement) ?? null,
        spotlight: items.find((item) => item.type === KioskItemType.spotlight) ?? null,
        cafeteria: items.find((item) => item.type === KioskItemType.cafeteria) ?? null,
    };
}

export async function getChatHistory(userId: string) {
    const messages = await prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
    });

    return messages.map((message) => ({
        id: message.id,
        role: message.role,
        text: message.text,
    }));
}

export async function buildAiContext(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            student: {
                include: {
                    schoolClass: true,
                    goals: { where: { completed: false }, orderBy: { createdAt: "asc" } },
                    grades: {
                        include: { subject: true },
                        orderBy: { recordedAt: "desc" },
                    },
                    riskAlerts: {
                        where: { resolved: false },
                        include: { subject: true },
                        orderBy: { createdAt: "desc" },
                    },
                },
            },
            teacher: {
                include: {
                    tasks: { orderBy: [{ urgent: "desc" }, { createdAt: "asc" }] },
                    assignments: {
                        include: {
                            schoolClass: true,
                            subject: true,
                        },
                    },
                },
            },
            parentLinks: {
                include: {
                    student: {
                        include: {
                            user: true,
                            schoolClass: true,
                            grades: {
                                include: { subject: true },
                                orderBy: { recordedAt: "desc" },
                            },
                            attendance: {
                                orderBy: { recordedAt: "desc" },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!user) return "Контекст пользователя не найден.";

    if (user.role === UserRole.student && user.student) {
        const schedule = await prisma.schedulePlan.findFirst({
            where: { status: SchedulePlanStatus.published },
            orderBy: { publishedAt: "desc" },
            include: {
                slots: {
                    where: { classId: user.student.classId },
                    include: { subject: true },
                    orderBy: { timeLabel: "asc" },
                },
            },
        });

        return [
            `Роль: ученик`,
            `Имя: ${user.fullName}`,
            `Класс: ${user.student.schoolClass.name}`,
            `GPA: ${user.student.gpa}`,
            `Выполнение ДЗ: ${user.student.homeworkPct}%`,
            `Цели: ${user.student.goals.map((item) => item.title).join("; ") || "нет активных целей"}`,
            `Последние оценки: ${user.student.grades.slice(0, 6).map((grade) => `${grade.subject.name} — ${grade.displayValue}`).join("; ")}`,
            `Риски: ${user.student.riskAlerts.map((alert) => `${alert.subject?.name ?? "Предмет"} — ${alert.reason}`).join("; ") || "активных рисков нет"}`,
            `Сегодняшнее расписание: ${schedule?.slots.map((slot) => `${slot.timeLabel} ${slot.subject.name} (${slot.room})`).join("; ") || "нет опубликованного расписания"}`,
        ].join("\n");
    }

    if (user.role === UserRole.teacher && user.teacher) {
        const classIds = [...new Set(user.teacher.assignments.map((item) => item.classId))];
        const riskAlerts = await prisma.riskAlert.findMany({
            where: {
                student: {
                    classId: { in: classIds },
                },
                resolved: false,
            },
            include: {
                student: {
                    include: {
                        user: true,
                        schoolClass: true,
                    },
                },
                subject: true,
            },
            orderBy: { createdAt: "desc" },
            take: 6,
        });

        return [
            `Роль: учитель`,
            `Имя: ${user.fullName}`,
            `Назначения: ${user.teacher.assignments.map((item) => `${item.subject.name} — ${item.schoolClass.name}`).join("; ")}`,
            `Задачи: ${user.teacher.tasks.map((task) => `${task.title}${task.done ? " (выполнено)" : ""}`).join("; ") || "нет активных задач"}`,
            `Ученики в риске: ${riskAlerts.map((alert) => `${alert.student.user.fullName}, ${alert.student.schoolClass.name}, ${alert.subject?.name ?? "предмет"} — ${alert.reason}`).join("; ") || "нет активных рисков"}`,
        ].join("\n");
    }

    if (user.role === UserRole.parent && user.parentLinks[0]?.student) {
        const child = user.parentLinks[0].student;
        return [
            `Роль: родитель`,
            `Родитель: ${user.fullName}`,
            `Ребенок: ${child.user.fullName}, ${child.schoolClass.name}`,
            `Последние оценки: ${child.grades.slice(0, 6).map((grade) => `${grade.subject.name} — ${grade.displayValue}`).join("; ")}`,
            `Пропуски: ${child.attendance.filter((item) => item.status === AttendanceStatus.absent).length}`,
        ].join("\n");
    }

    const stats = await getAdminDashboard();
    return [
        `Роль: администратор`,
        `Имя: ${user.fullName}`,
        `Статистика: студентов ${stats.stats.students}, учителей ${stats.stats.teachers}, согласований ${stats.stats.pendingApprovals}, открытых инцидентов ${stats.stats.openIncidents}`,
    ].join("\n");
}

export async function createAdminEventLog(data: Prisma.EventLogUncheckedCreateInput) {
    return prisma.eventLog.create({ data });
}
