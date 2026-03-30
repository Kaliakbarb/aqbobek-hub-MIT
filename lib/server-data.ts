import {
    ApprovalStatus,
    AttendanceStatus,
    BroadcastAudienceType,
    HomeworkSubmissionStatus,
    IncidentStatus,
    KioskItemType,
    NewsCategory,
    Prisma,
    RiskLevel,
    SchedulePlanStatus,
    ScheduleSlotSourceType,
    TeacherAbsenceStatus,
    UserRole,
} from "@prisma/client";
import { prisma } from "./prisma";
import { getStudentResourceRecommendations } from "./resource-recommender";
import { DAY_LABELS, DAY_SHORT_LABELS, SCHEDULE_DAYS, SLOT_TEMPLATES, formatWeekLabel } from "./schedule-constants";
import { getScheduleQualitySummary } from "./schedule-quality";
import { buildConstraintSummary, getScheduleConstraintBundle } from "./smart-schedule";
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

function getCurrentSchoolDay() {
    const jsDay = new Date().getDay();
    if (jsDay === 0) return 1;
    if (jsDay === 6) return 5;
    return jsDay;
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

function getAchievementCategory(title: string, description: string) {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes("олимпиад") || text.includes("место")) return "Академическое";
    if (text.includes("сертифик") || text.includes("cambridge") || text.includes("fce")) return "Сертификация";
    if (text.includes("спорт") || text.includes("разряд") || text.includes("атлет")) return "Спорт";
    return "Развитие";
}

function getAchievementRarity(title: string) {
    if (/1\s*место|gold|золото/i.test(title)) return { label: "Легендарное", tone: "text-amber-700 bg-amber-100" };
    if (/сертификат|призер|призёр|2\s*место|3\s*место/i.test(title)) return { label: "Редкое", tone: "text-blue-700 bg-blue-100" };
    return { label: "Стабильное", tone: "text-green-700 bg-green-100" };
}

function getAchievementReason(title: string, description: string) {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes("олимпиад") || text.includes("место")) {
        return "За высокий результат на академическом соревновании и сильную предметную подготовку.";
    }
    if (text.includes("сертифик") || text.includes("cambridge") || text.includes("fce")) {
        return "За подтвержденный внешний уровень и готовность применять знания вне школы.";
    }
    if (text.includes("спорт") || text.includes("разряд") || text.includes("атлет")) {
        return "За дисциплину, регулярные тренировки и результат вне учебного класса.";
    }
    return "За устойчивый прогресс и заметный вклад в школьную активность.";
}

function getAchievementHighlight(title: string, description: string) {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes("олимпиад") || text.includes("место")) {
        return "Показывает, что ученик умеет соревноваться на высоком уровне, а не только хорошо учиться в классе.";
    }
    if (text.includes("сертифик") || text.includes("cambridge") || text.includes("fce")) {
        return "Это понятный внешний маркер качества, который усиливает портфолио при поступлении и конкурсах.";
    }
    if (text.includes("спорт") || text.includes("разряд") || text.includes("атлет")) {
        return "Такие достижения добавляют профилю устойчивость: воля, режим и умение держать нагрузку.";
    }
    return "Достижение усиливает цифровое портфолио и показывает реальную динамику, а не случайный успех.";
}

function getBadgeMeta(name: string) {
    const normalized = name.toLowerCase();
    if (normalized.includes("эрудит")) {
        return {
            reason: "Выдан за сильные академические результаты и стабильно высокий уровень по сложным предметам.",
            unlockHint: "Держать высокий GPA и регулярно попадать в верхние строчки предметного рейтинга.",
            impact: "Такой бейдж показывает интеллектуальную устойчивость и усиливает профиль в рейтинге школы.",
        };
    }
    if (normalized.includes("скорость")) {
        return {
            reason: "Выдан за быстрый темп выполнения задач, дедлайнов и домашних работ без потери качества.",
            unlockHint: "Закрывать задания вовремя и держать высокий процент выполненного ДЗ.",
            impact: "Бейдж подчёркивает дисциплину и умение работать в хорошем темпе под нагрузкой.",
        };
    }
    if (normalized.includes("перфекционист")) {
        return {
            reason: "Выдан за аккуратность, точность и высокий процент сильных оценок без резких провалов.",
            unlockHint: "Стабильно сдавать контрольные и домашние без потери качества.",
            impact: "Подсвечивает надежность ученика: такой результат сложнее держать, чем один раз выстрелить.",
        };
    }
    if (normalized.includes("спорт")) {
        return {
            reason: "Выдан за активность и результативность в спортивном направлении школы.",
            unlockHint: "Участвовать в секциях, соревнованиях и держать хороший темп вне класса.",
            impact: "Показывает баланс между учебой и внешкольной активностью, что делает профиль сильнее.",
        };
    }
    if (normalized.includes("староста")) {
        return {
            reason: "Выдан за лидерство, ответственность за класс и регулярную помощь учителям и одноклассникам.",
            unlockHint: "Брать организационные задачи, держать доверие класса и быть опорой в учебных вопросах.",
            impact: "Это маркер не только успеваемости, но и зрелости: школа видит в таком ученике лидера.",
        };
    }

    return {
        reason: "Выдан за заметный вклад в учебу и школьную активность.",
        unlockHint: "Поддерживать сильную динамику в учебе и внеурочной жизни.",
        impact: "Бейдж усиливает цифровое портфолио и делает прогресс ученика более видимым.",
    };
}

function buildAchievementMilestones(student: {
    gpa: number;
    homeworkPct: number;
    streakDays: number;
    rank: number | null;
    badges: Array<unknown>;
}, rankTotal: number | null) {
    const milestones = [
        {
            id: "gpa",
            title: "Академический рывок",
            hint: "Поднять средний балл до 4.9",
            current: student.gpa,
            target: 4.9,
            valueLabel: `${student.gpa.toFixed(1)} / 4.9`,
        },
        {
            id: "homework",
            title: "Безупречная дисциплина",
            hint: "Довести выполнение ДЗ до 100%",
            current: student.homeworkPct,
            target: 100,
            valueLabel: `${Math.round(student.homeworkPct)}% / 100%`,
        },
        {
            id: "streak",
            title: "Серия без срывов",
            hint: "Собрать 21 день учебного стрика",
            current: student.streakDays,
            target: 21,
            valueLabel: `${student.streakDays} / 21 дней`,
        },
        {
            id: "badges",
            title: "Коллекционер бейджей",
            hint: "Открыть 8 учебных бейджей",
            current: student.badges.length,
            target: 8,
            valueLabel: `${student.badges.length} / 8 бейджей`,
        },
        {
            id: "rank",
            title: "Войти в топ-10 школы",
            hint: "Подняться в школьном рейтинге",
            current: student.rank ? Math.max((rankTotal ?? 10) - student.rank + 1, 0) : 0,
            target: Math.max((rankTotal ?? 10) - 10 + 1, 1),
            valueLabel: student.rank && rankTotal ? `${student.rank} место из ${rankTotal}` : "Рейтинг появится после публикации",
        },
    ];

    return milestones.map((item) => ({
        ...item,
        progress: Math.max(0, Math.min(100, Math.round((item.current / item.target) * 100))),
    }));
}

function formatDateTime(value: Date) {
    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(value);
}

function formatRoomName(roomName: string | null | undefined) {
    if (!roomName) return "Онлайн / без кабинета";
    if (roomName.startsWith("Каб.") || roomName.startsWith("Лаб.") || roomName.startsWith("Спорт") || roomName.startsWith("Акт")) {
        return roomName;
    }
    if (/^\d/.test(roomName)) return `Каб. ${roomName}`;
    return roomName;
}

function matchesBroadcastForUser(
    broadcast: {
        targetUserId?: string | null;
        audienceType: BroadcastAudienceType;
        targetRole: UserRole | null;
        targetClassId: string | null;
    },
    user: {
        id?: string;
        role: UserRole;
        student?: { classId: string } | null;
        parentLinks?: Array<{ student: { classId: string } }>;
    },
) {
    if (broadcast.audienceType === BroadcastAudienceType.all) return true;
    if (broadcast.audienceType === BroadcastAudienceType.user) {
        return Boolean(user.id && broadcast.targetUserId && broadcast.targetUserId === user.id);
    }
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
            settings: true,
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
                    room: true,
                    teacher: {
                        include: {
                            user: true,
                        },
                    },
                },
                orderBy: [{ dayOfWeek: "asc" }, { slotIndex: "asc" }],
            },
        },
    });
    const [news, topicWeakness, broadcasts] = await Promise.all([
        getVisibleNews(userId),
        getStudentTopicWeaknessSummary(user.student.id),
        prisma.broadcast.findMany({
            orderBy: { createdAt: "desc" },
            take: 12,
        }),
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
    const recommendedResourceBySubject = new Map(
        resourceRecommendations.map((item) => [item.subject_name, item]),
    );
    const scheduleDays = SCHEDULE_DAYS.map((dayOfWeek) => {
        const slots = latestPlan?.slots.filter((slot) => slot.dayOfWeek === dayOfWeek) ?? [];
        return {
            dayOfWeek,
            dayLabel: DAY_LABELS[dayOfWeek],
            shortLabel: DAY_SHORT_LABELS[dayOfWeek],
            lessonCount: slots.reduce((sum, slot) => sum + slot.durationSlots, 0),
            slots: slots.map((slot) => ({
                id: slot.id,
                slotIndex: slot.slotIndex,
                durationSlots: slot.durationSlots,
                time: slot.timeLabel,
                title: slot.title ?? slot.subject?.name ?? "Событие",
                teacher: slot.teacher?.user.fullName ?? "Учитель уточняется",
                room: formatRoomName(slot.room?.name),
                sourceType: slot.sourceType,
                isChanged: slot.sourceType !== ScheduleSlotSourceType.generated,
                statusLabel:
                    slot.sourceType === ScheduleSlotSourceType.substitute
                        ? "Замена"
                        : slot.sourceType === ScheduleSlotSourceType.reoptimized
                            ? "Перестроено"
                            : primaryRisk?.subjectId === slot.subjectId
                                ? "Фокус"
                                : "По плану",
                statusTone:
                    slot.sourceType === ScheduleSlotSourceType.substitute
                        ? "amber"
                        : slot.sourceType === ScheduleSlotSourceType.reoptimized
                            ? "blue"
                            : primaryRisk?.subjectId === slot.subjectId
                                ? "red"
                                : "green",
                homework:
                    primaryRisk?.subjectId === slot.subjectId
                        ? `Повтори тему и разбор ошибок: ${primaryRisk.reason}.`
                        : slot.subject?.name && recommendedResourceBySubject.has(slot.subject.name)
                            ? `После урока открой материал: ${recommendedResourceBySubject.get(slot.subject.name)?.title_ru}.`
                            : nextGoal
                                ? `Фокус недели: ${nextGoal.title}.`
                                : "После урока обнови конспект и проверь дедлайны в профиле.",
                focusNote:
                    slot.subject?.name && recommendedResourceBySubject.has(slot.subject.name)
                        ? `Для этого урока уже подобран материал: ${recommendedResourceBySubject.get(slot.subject.name)?.relevance_label_ru}.`
                        : primaryRisk?.subjectId === slot.subjectId
                            ? "Этот предмет сейчас в зоне внимания AI-наставника."
                            : "Урок идет по стабильному плану недели.",
            })),
        };
    }).filter((day) => day.slots.length > 0);
    const visibleBroadcasts = broadcasts
        .filter((item) => matchesBroadcastForUser(item, user))
        .slice(0, 4)
        .map((item) => ({
            id: item.id,
            text: item.text,
            audience: item.audienceLabel,
            createdAt: formatDateTime(item.createdAt),
        }));

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
        lessons: latestPlan?.slots.slice(0, 8).map((slot) => ({
            id: slot.id,
            time: `${DAY_LABELS[slot.dayOfWeek]} • ${slot.timeLabel}`,
            title: slot.title ?? slot.subject?.name ?? "Событие",
            room: formatRoomName(slot.room?.name),
            highlight: primaryRisk?.subjectId === slot.subjectId,
        })) ?? [],
        scheduleMeta: {
            weekLabel: latestPlan ? formatWeekLabel(latestPlan.weekStartDate) : null,
            pushAlertsEnabled: user.settings?.pushAlerts ?? true,
            currentDayOfWeek: getCurrentSchoolDay(),
            maxSlotsPerDay: SLOT_TEMPLATES.length,
        },
        scheduleDays,
        notices: visibleBroadcasts,
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
                    attendance: true,
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
    const achievementCards = user.student.achievements.map((item) => ({
        ...item,
        earnedAtLabel: formatMonth(item.createdAt),
        category: getAchievementCategory(item.title, item.description),
        rarity: getAchievementRarity(item.title),
        reasonLabel: getAchievementReason(item.title, item.description),
        highlightText: getAchievementHighlight(item.title, item.description),
    }));
    const absenceCount = user.student.attendance.filter((item) => item.status === AttendanceStatus.absent).length;
    const milestones = buildAchievementMilestones(user.student, user.student.rankTotal);
    const featuredMilestone = [...milestones].sort((left, right) => right.progress - left.progress)[0] ?? null;

    return {
        fullName: user.fullName,
        className: user.student.schoolClass.name,
        profileDirection: user.student.profileDirection,
        gpa: user.student.gpa,
        rank: user.student.rank,
        rankTotal: user.student.rankTotal,
        achievements: achievementCards,
        achievementSummary: {
            total: achievementCards.length,
            rareCount: achievementCards.filter((item) => item.rarity.label !== "Стабильное").length,
            badgeCount: user.student.badges.length,
            absenceCount,
            strongestTrack: achievementCards[0]?.category ?? "Развитие",
        },
        nextAchievements: milestones,
        featuredMilestone,
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

export async function getStudentHomeworkHub(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            student: {
                include: {
                    schoolClass: true,
                    homeworkSubmissions: {
                        include: {
                            assignment: {
                                include: {
                                    subject: true,
                                    teacher: {
                                        include: {
                                            user: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!user?.student) return null;

    const assignments = await prisma.homeworkAssignment.findMany({
        where: {
            classId: user.student.classId,
            active: true,
        },
        include: {
            subject: true,
            teacher: {
                include: {
                    user: true,
                },
            },
            submissions: {
                where: {
                    studentId: user.student.id,
                },
            },
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    });

    const summary = {
        total: assignments.length,
        submitted: assignments.filter((item) => item.submissions[0]?.status === HomeworkSubmissionStatus.submitted || item.submissions[0]?.status === HomeworkSubmissionStatus.reviewed).length,
        pending: assignments.filter((item) => !item.submissions[0] || item.submissions[0]?.status === HomeworkSubmissionStatus.draft).length,
        reviewed: assignments.filter((item) => item.submissions[0]?.status === HomeworkSubmissionStatus.reviewed).length,
    };

    return {
        student: {
            fullName: user.fullName,
            firstName: user.firstName,
            className: user.student.schoolClass.name,
        },
        summary,
        assignments: assignments.map((assignment) => {
            const submission = assignment.submissions[0] ?? null;
            const status =
                submission?.status === HomeworkSubmissionStatus.reviewed
                    ? "Проверено"
                    : submission?.status === HomeworkSubmissionStatus.submitted
                        ? "Сдано"
                        : submission?.status === HomeworkSubmissionStatus.draft
                            ? "Черновик"
                            : "Ждет сдачи";
            const tone =
                submission?.status === HomeworkSubmissionStatus.reviewed
                    ? "green"
                    : submission?.status === HomeworkSubmissionStatus.submitted
                        ? "blue"
                        : submission?.status === HomeworkSubmissionStatus.draft
                            ? "amber"
                            : "slate";

            return {
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                subject: assignment.subject?.name ?? "Предмет",
                teacher: assignment.teacher?.user.fullName ?? "Учитель",
                dueAt: formatDateTime(assignment.dueAt),
                dueAtIso: assignment.dueAt.toISOString(),
                status,
                tone,
                submission: submission
                    ? {
                        id: submission.id,
                        status: submission.status,
                        note: submission.note,
                        fileName: submission.fileName,
                        fileUrl: submission.fileUrl,
                        submittedAt: submission.submittedAt ? formatDateTime(submission.submittedAt) : null,
                        teacherFeedback: submission.teacherFeedback,
                    }
                    : null,
            };
        }),
    };
}

export async function getTeacherDashboard(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            settings: true,
            teacher: {
                include: {
                    absences: {
                        orderBy: { startsAt: "desc" },
                        take: 5,
                    },
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
    const teacherProfile = user.teacher;

    const classIds = [...new Set(teacherProfile.assignments.map((item) => item.classId))];
    const students = await prisma.student.findMany({
        where: { classId: { in: classIds } },
        include: {
            user: true,
            schoolClass: true,
            riskAlerts: {
                where: { resolved: false },
                include: {
                    subject: true,
                },
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
    const latestPlan = await prisma.schedulePlan.findFirst({
        where: { status: SchedulePlanStatus.published },
        orderBy: { publishedAt: "desc" },
        include: {
            slots: {
                where: {
                    OR: [
                        { teacherId: teacherProfile.id },
                        { originalTeacherId: teacherProfile.id },
                    ],
                },
                include: {
                    schoolClass: true,
                    subject: true,
                    room: true,
                },
                orderBy: [{ dayOfWeek: "asc" }, { slotIndex: "asc" }],
            },
        },
    });
    const recentEventLogs = await prisma.eventLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
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
            createdAt: formatDateTime(item.createdAt),
        }));

    const riskStudents = students
        .flatMap((student) =>
            student.riskAlerts.map((alert) => ({
                id: alert.id,
                studentId: student.id,
                name: student.user.fullName,
                firstName: student.user.firstName,
                class: student.schoolClass.name,
                subject: alert.subject?.name ?? "Предмет",
                drop: alert.dropLabel,
                reason: alert.reason,
                risk: formatRiskLevel(alert.riskLevel),
            })),
        )
        .sort((left, right) => (left.risk === "Высокий" ? -1 : 1) - (right.risk === "Высокий" ? -1 : 1));

    const avgGrade = average(students.map((item) => item.gpa));
    const classSummaries = classIds.map((classId) => {
        const assignmentGroup = teacherProfile.assignments.filter((item) => item.classId === classId);
        const classStudents = students.filter((item) => item.classId === classId);
        const absenceCount = attendance.filter((item) => classStudents.some((student) => student.id === item.studentId)).length;
        const riskCount = classStudents.reduce((sum, student) => sum + student.riskAlerts.length, 0);
        const leadingRisk = classStudents
            .flatMap((student) => student.riskAlerts)
            .sort((left, right) => (left.riskLevel === RiskLevel.high ? -1 : 1) - (right.riskLevel === RiskLevel.high ? -1 : 1))[0];

        return {
            id: classId,
            name: assignmentGroup[0]?.schoolClass.name ?? "Класс",
            subjects: [...new Set(assignmentGroup.map((item) => item.subject.name))],
            studentCount: classStudents.length,
            avgGrade: round(average(classStudents.map((item) => item.gpa)), 1),
            riskCount,
            absences: absenceCount,
            focusLabel: riskCount > 0 ? "Требует внимания" : "Стабильно",
            topRiskReason: leadingRisk?.reason ?? "Группа идет по плану без активных AI-рисков.",
        };
    }).sort((left, right) => right.riskCount - left.riskCount || right.absences - left.absences || left.name.localeCompare(right.name, "ru"));
    const scheduleDays = SCHEDULE_DAYS.map((dayOfWeek) => {
        const slots = latestPlan?.slots.filter((slot) => slot.dayOfWeek === dayOfWeek) ?? [];
        return {
            dayOfWeek,
            dayLabel: DAY_LABELS[dayOfWeek],
            shortLabel: DAY_SHORT_LABELS[dayOfWeek],
            lessonCount: slots.reduce((sum, slot) => sum + slot.durationSlots, 0),
            slots: slots.map((slot) => ({
                id: slot.id,
                dayOfWeek: slot.dayOfWeek,
                slotIndex: slot.slotIndex,
                durationSlots: slot.durationSlots,
                time: slot.timeLabel,
                title: slot.title ?? slot.subject?.name ?? "Событие",
                className: slot.schoolClass.name,
                room: formatRoomName(slot.room?.name),
                sourceType: slot.sourceType,
                isReplacement: slot.sourceType === ScheduleSlotSourceType.substitute || slot.teacherId !== slot.originalTeacherId,
                statusLabel:
                    slot.sourceType === ScheduleSlotSourceType.substitute
                        ? "Замена"
                        : slot.sourceType === ScheduleSlotSourceType.reoptimized
                            ? "Перестроено"
                            : "По плану",
                statusTone:
                    slot.sourceType === ScheduleSlotSourceType.substitute
                        ? "amber"
                        : slot.sourceType === ScheduleSlotSourceType.reoptimized
                            ? "blue"
                            : "green",
            })),
        };
    }).filter((day) => day.slots.length > 0);
    const replacementLessons = (latestPlan?.slots ?? [])
        .filter((slot) => slot.sourceType === ScheduleSlotSourceType.substitute || slot.sourceType === ScheduleSlotSourceType.reoptimized || slot.teacherId !== slot.originalTeacherId)
        .slice(0, 4)
        .map((slot) => ({
            id: slot.id,
            time: `${DAY_LABELS[slot.dayOfWeek]} • ${slot.timeLabel}`,
            title: slot.title ?? slot.subject?.name ?? "Событие",
            className: slot.schoolClass.name,
            room: formatRoomName(slot.room?.name),
        }));
    const activeAbsence = teacherProfile.absences.find((absence) => absence.status === TeacherAbsenceStatus.active) ?? null;
    const currentSchoolDay = getCurrentSchoolDay();
    const sortedUpcomingSlots = [...(latestPlan?.slots ?? [])].sort((left, right) => {
        const leftDistance = (left.dayOfWeek - currentSchoolDay + 7) % 7;
        const rightDistance = (right.dayOfWeek - currentSchoolDay + 7) % 7;
        if (leftDistance !== rightDistance) return leftDistance - rightDistance;
        return left.slotIndex - right.slotIndex;
    });
    const upcomingLessons = sortedUpcomingSlots.slice(0, 8).map((slot) => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        slotIndex: slot.slotIndex,
        time: `${DAY_LABELS[slot.dayOfWeek]} • ${slot.timeLabel}`,
        title: slot.title ?? slot.subject?.name ?? "Событие",
        className: slot.schoolClass.name,
        room: formatRoomName(slot.room?.name),
        sourceType: slot.sourceType,
        isReplacement: slot.sourceType === ScheduleSlotSourceType.substitute || slot.teacherId !== slot.originalTeacherId,
        statusLabel:
            slot.sourceType === ScheduleSlotSourceType.substitute
                ? "Замена"
                : slot.sourceType === ScheduleSlotSourceType.reoptimized
                    ? "Перестроено"
                    : "По плану",
        statusTone:
            slot.sourceType === ScheduleSlotSourceType.substitute
                ? "amber"
                : slot.sourceType === ScheduleSlotSourceType.reoptimized
                    ? "blue"
                    : "green",
    }));
    const taskSummary = {
        total: teacherProfile.tasks.length,
        urgent: teacherProfile.tasks.filter((task) => task.urgent && !task.done).length,
        open: teacherProfile.tasks.filter((task) => !task.done).length,
        completed: teacherProfile.tasks.filter((task) => task.done).length,
    };
    const weeklyLessonCount = scheduleDays.reduce((sum, day) => sum + day.lessonCount, 0);

    return {
        teacher: {
            fullName: user.fullName,
            firstName: user.firstName,
            subtitle: teacherProfile.assignments
                .slice(0, 2)
                .map((item) => `${item.subject.name}, ${item.schoolClass.name}`)
                .join(" • "),
        },
        adminMessages: visibleBroadcasts,
        scheduleMeta: {
            weekLabel: latestPlan ? formatWeekLabel(latestPlan.weekStartDate) : null,
            pushAlertsEnabled: user.settings?.pushAlerts ?? true,
            totalLessons: weeklyLessonCount,
            replacementCount: replacementLessons.length,
        },
        stats: {
            totalStudents: students.length,
            avgGrade: round(avgGrade, 1),
            riskCount: riskStudents.filter((item) => item.risk === "Высокий").length,
            absences: attendance.length,
        },
        focusBoard: {
            classCount: classSummaries.length,
            urgentTaskCount: taskSummary.urgent,
            openTaskCount: taskSummary.open,
            completedTaskCount: taskSummary.completed,
            replacementCount: replacementLessons.length,
            nextLesson: upcomingLessons[0] ?? null,
        },
        classSummaries,
        activeAbsence: activeAbsence ? {
            id: activeAbsence.id,
            startsAt: formatDate(activeAbsence.startsAt),
            endsAt: formatDate(activeAbsence.endsAt),
            startsAtIso: activeAbsence.startsAt.toISOString().slice(0, 10),
            endsAtIso: activeAbsence.endsAt.toISOString().slice(0, 10),
            reason: activeAbsence.reason,
            triggeredPlanId: activeAbsence.triggeredPlanId,
        } : null,
        upcomingLessons,
        scheduleDays,
        replacementLessons,
        recentActions: recentEventLogs.map((item) => ({
            id: item.id,
            title: item.title,
            note: item.note,
            kind: item.kind,
            createdAt: formatDateTime(item.createdAt),
        })),
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
                    room: true,
                    teacher: {
                        include: {
                            user: true,
                        },
                    },
                },
                orderBy: [{ dayOfWeek: "asc" }, { slotIndex: "asc" }, { schoolClass: { name: "asc" } }],
            },
            conflicts: {
                orderBy: { createdAt: "asc" },
            },
        },
    });

    const [classes, constraints] = await Promise.all([
        prisma.schoolClass.findMany({ orderBy: { name: "asc" } }),
        getScheduleConstraintBundle(),
    ]);
    const [quality, substituteMatch] = plan
        ? await Promise.all([
            getScheduleQualitySummary(plan.id),
            getScheduleSubstituteMatches(plan.id),
        ])
        : [null, null];

    if (!plan) {
        return {
            plan: null,
            classes: classes.map((item) => ({ id: item.id, name: item.name, days: [] })),
            conflicts: [],
            quality: null,
            substituteMatch: null,
            constraints,
            summary: buildConstraintSummary(constraints),
        };
    }

    return {
        plan: {
            id: plan.id,
            status: plan.status,
            published: plan.status === SchedulePlanStatus.published,
            weekStartDate: plan.weekStartDate.toISOString(),
            generationMode: plan.generationMode,
            regenerationReason: plan.regenerationReason,
        },
        classes: classes.map((item) => ({
            id: item.id,
            name: item.name,
            days: Array.from({ length: 5 }, (_, index) => index + 1).map((dayOfWeek) => ({
                dayOfWeek,
                dayLabel: DAY_LABELS[dayOfWeek],
                slots: plan.slots
                    .filter((slot) => slot.classId === item.id && slot.dayOfWeek === dayOfWeek)
                    .map((slot) => ({
                        id: slot.id,
                        time: slot.timeLabel,
                        slotIndex: slot.slotIndex,
                        durationSlots: slot.durationSlots,
                        subject: slot.title ?? slot.subject?.name ?? "Событие",
                        teacher: slot.teacher?.user.fullName ?? "Подгруппы / замена",
                        room: formatRoomName(slot.room?.name),
                        split: slot.split,
                        itemType: slot.itemType,
                        sourceType: slot.sourceType,
                        locked: slot.locked,
                    })),
            })),
        })),
        conflicts: plan.conflicts.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            severity: item.severity,
            resolved: item.resolved,
            needsAttention: item.needsAttention,
        })),
        quality,
        substituteMatch,
        constraints,
        summary: buildConstraintSummary(constraints),
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
        badges: (user?.student?.badges ?? []).map((badge) => ({
            ...badge,
            ...getBadgeMeta(badge.name),
        })),
    };
}

export async function getKioskData() {
    const [items, plan] = await Promise.all([
        prisma.kioskItem.findMany({
            where: { active: true },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        }),
        prisma.schedulePlan.findFirst({
            where: { status: SchedulePlanStatus.published },
            orderBy: { publishedAt: "desc" },
        }),
    ]);
    const latestItem = [...items].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())[0] ?? null;

    return {
        replacements: items.filter((item) => item.type === KioskItemType.replacement),
        featured: items.find((item) => item.type === KioskItemType.announcement) ?? null,
        spotlight: items.find((item) => item.type === KioskItemType.spotlight) ?? null,
        cafeteria: items.find((item) => item.type === KioskItemType.cafeteria) ?? null,
        meta: {
            weekLabel: plan ? formatWeekLabel(plan.weekStartDate) : null,
            updatedAt: latestItem ? formatDateTime(latestItem.updatedAt) : null,
            replacementsCount: items.filter((item) => item.type === KioskItemType.replacement).length,
        },
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
                    include: { subject: true, room: true },
                    orderBy: [{ dayOfWeek: "asc" }, { slotIndex: "asc" }],
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
            `Расписание недели: ${schedule?.slots.map((slot) => `${DAY_LABELS[slot.dayOfWeek]} ${slot.timeLabel} ${slot.title ?? slot.subject?.name ?? "Событие"} (${formatRoomName(slot.room?.name)})`).join("; ") || "нет опубликованного расписания"}`,
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
