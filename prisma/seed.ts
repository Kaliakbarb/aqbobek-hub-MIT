import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import {
    ApprovalStatus,
    AttendanceStatus,
    BroadcastAudienceType,
    ChatRole,
    EventLogKind,
    IncidentStatus,
    KioskItemType,
    NewsCategory,
    PrismaClient,
    RiskLevel,
    SchedulePlanStatus,
    UserRole,
} from "@prisma/client";

const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./dev.db" }),
});

async function main() {
    const passwordHash = await bcrypt.hash("12345", 10);

    await prisma.chatMessage.deleteMany();
    await prisma.kioskItem.deleteMany();
    await prisma.eventLog.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.approval.deleteMany();
    await prisma.broadcast.deleteMany();
    await prisma.newsItem.deleteMany();
    await prisma.studentBadge.deleteMany();
    await prisma.leaderboardEntry.deleteMany();
    await prisma.scheduleConflict.deleteMany();
    await prisma.scheduleSlot.deleteMany();
    await prisma.schedulePlan.deleteMany();
    await prisma.teacherTask.deleteMany();
    await prisma.riskAlert.deleteMany();
    await prisma.activityEntry.deleteMany();
    await prisma.studentSkill.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.studentGoal.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.grade.deleteMany();
    await prisma.teachingAssignment.deleteMany();
    await prisma.parentStudent.deleteMany();
    await prisma.student.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.schoolClass.deleteMany();
    await prisma.user.deleteMany();

    const schoolClasses = await Promise.all([
        prisma.schoolClass.create({ data: { name: "10 А", grade: 10, section: "А", profile: "Физико-математическое", roomLabel: "302" } }),
        prisma.schoolClass.create({ data: { name: "10 Б", grade: 10, section: "Б", profile: "Физико-математическое", roomLabel: "304" } }),
        prisma.schoolClass.create({ data: { name: "10 В", grade: 10, section: "В", profile: "STEM", roomLabel: "301" } }),
    ]);

    const classMap = Object.fromEntries(schoolClasses.map((item) => [item.name, item]));

    const subjects = await Promise.all([
        "Алгебра",
        "Геометрия",
        "Физика",
        "История Казахстана",
        "История",
        "Английский язык",
        "Биология",
        "Химия",
        "Физкультура",
        "Информатика",
    ].map((name) => prisma.subject.create({ data: { name } })));

    const subjectMap = Object.fromEntries(subjects.map((item) => [item.name, item]));

    const users = await Promise.all([
        prisma.user.create({
            data: {
                username: "student1",
                passwordHash,
                role: UserRole.student,
                firstName: "Тимур",
                lastName: "Асанов",
                fullName: "Тимур Асанов",
                email: "student1@aqbobek.kz",
                homePath: "/student",
                settings: { create: {} },
            },
        }),
        prisma.user.create({
            data: {
                username: "student2",
                passwordHash,
                role: UserRole.student,
                firstName: "Алиса",
                lastName: "Воронова",
                fullName: "Алиса Воронова",
                email: "student2@aqbobek.kz",
                homePath: "/student",
                settings: { create: { language: "Русский", pushAlerts: true, emailAlerts: true } },
            },
        }),
        prisma.user.create({
            data: {
                username: "student3",
                passwordHash,
                role: UserRole.student,
                firstName: "Дамир",
                lastName: "Абишев",
                fullName: "Дамир Абишев",
                email: "student3@aqbobek.kz",
                homePath: "/student",
                settings: { create: {} },
            },
        }),
        prisma.user.create({
            data: {
                username: "teacher1",
                passwordHash,
                role: UserRole.teacher,
                firstName: "М.Т.",
                lastName: "Жукенов",
                fullName: "Жукенов М.Т.",
                email: "teacher1@aqbobek.kz",
                homePath: "/teacher",
                settings: { create: {} },
            },
        }),
        prisma.user.create({
            data: {
                username: "teacher2",
                passwordHash,
                role: UserRole.teacher,
                firstName: "К.А.",
                lastName: "Смагулова",
                fullName: "Смагулова К.А.",
                email: "teacher2@aqbobek.kz",
                homePath: "/teacher",
                settings: { create: {} },
            },
        }),
        prisma.user.create({
            data: {
                username: "teacher3",
                passwordHash,
                role: UserRole.teacher,
                firstName: "С.С.",
                lastName: "Ахметов",
                fullName: "Ахметов С.С.",
                email: "teacher3@aqbobek.kz",
                homePath: "/teacher",
                settings: { create: {} },
            },
        }),
        prisma.user.create({
            data: {
                username: "admin",
                passwordHash,
                role: UserRole.admin,
                firstName: "Администратор",
                lastName: "Школы",
                fullName: "Администратор школы",
                email: "admin@aqbobek.kz",
                homePath: "/admin",
                settings: { create: {} },
            },
        }),
        prisma.user.create({
            data: {
                username: "parent1",
                passwordHash,
                role: UserRole.parent,
                firstName: "Айгуль",
                lastName: "Асанова",
                fullName: "Айгуль Асанова",
                email: "parent1@aqbobek.kz",
                homePath: "/parent",
                settings: { create: { emailAlerts: true, pushAlerts: false } },
            },
        }),
        prisma.user.create({
            data: {
                username: "parent2",
                passwordHash,
                role: UserRole.parent,
                firstName: "Динара",
                lastName: "Воронова",
                fullName: "Динара Воронова",
                email: "parent2@aqbobek.kz",
                homePath: "/parent",
                settings: { create: { emailAlerts: true, pushAlerts: true } },
            },
        }),
        prisma.user.create({
            data: {
                username: "parent3",
                passwordHash,
                role: UserRole.parent,
                firstName: "Ерлан",
                lastName: "Абишев",
                fullName: "Ерлан Абишев",
                email: "parent3@aqbobek.kz",
                homePath: "/parent",
                settings: { create: { emailAlerts: false, pushAlerts: true } },
            },
        }),
    ]);

    const userMap = Object.fromEntries(users.map((item) => [item.username, item]));

    const [student1, student2, student3] = await Promise.all([
        prisma.student.create({
            data: {
                userId: userMap.student1.id,
                classId: classMap["10 А"].id,
                profileDirection: "Физико-математическое направление",
                gpa: 4.8,
                homeworkPct: 94,
                rank: 4,
                rankTotal: 120,
                streakDays: 14,
            },
        }),
        prisma.student.create({
            data: {
                userId: userMap.student2.id,
                classId: classMap["10 А"].id,
                profileDirection: "Естественно-математическое направление",
                gpa: 4.9,
                homeworkPct: 97,
                rank: 2,
                rankTotal: 120,
                streakDays: 18,
            },
        }),
        prisma.student.create({
            data: {
                userId: userMap.student3.id,
                classId: classMap["10 В"].id,
                profileDirection: "STEM",
                gpa: 4.7,
                homeworkPct: 91,
                rank: 5,
                rankTotal: 120,
                streakDays: 10,
            },
        }),
    ]);

    const [teacher1, teacher2, teacher3] = await Promise.all([
        prisma.teacher.create({ data: { userId: userMap.teacher1.id, bio: "Физика, 10-11 классы" } }),
        prisma.teacher.create({ data: { userId: userMap.teacher2.id, bio: "Алгебра и геометрия" } }),
        prisma.teacher.create({ data: { userId: userMap.teacher3.id, bio: "История Казахстана" } }),
    ]);

    await prisma.parentStudent.createMany({
        data: [
            {
                parentId: userMap.parent1.id,
                studentId: student1.id,
            },
            {
                parentId: userMap.parent2.id,
                studentId: student2.id,
            },
            {
                parentId: userMap.parent3.id,
                studentId: student3.id,
            },
        ],
    });

    await prisma.teachingAssignment.createMany({
        data: [
            { teacherId: teacher2.id, subjectId: subjectMap["Алгебра"].id, classId: classMap["10 А"].id },
            { teacherId: teacher2.id, subjectId: subjectMap["Геометрия"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher2.id, subjectId: subjectMap["Алгебра"].id, classId: classMap["10 В"].id },
            { teacherId: teacher1.id, subjectId: subjectMap["Физика"].id, classId: classMap["10 А"].id },
            { teacherId: teacher1.id, subjectId: subjectMap["Физика"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher3.id, subjectId: subjectMap["История"].id, classId: classMap["10 А"].id },
            { teacherId: teacher3.id, subjectId: subjectMap["История Казахстана"].id, classId: classMap["10 А"].id },
            { teacherId: teacher3.id, subjectId: subjectMap["История"].id, classId: classMap["10 В"].id },
        ],
    });

    await prisma.grade.createMany({
        data: [
            { studentId: student1.id, subjectId: subjectMap["Алгебра"].id, type: "СОР", displayValue: "98%", numericValue: 4.9, percent: 98, trend: "up", term: "3 четверть", recordedAt: new Date("2026-03-11T08:00:00Z") },
            { studentId: student1.id, subjectId: subjectMap["Геометрия"].id, type: "СОР", displayValue: "92%", numericValue: 4.6, percent: 92, trend: "up", term: "3 четверть", recordedAt: new Date("2026-03-10T08:00:00Z") },
            { studentId: student1.id, subjectId: subjectMap["Физика"].id, type: "СОЧ", displayValue: "74%", numericValue: 3.7, percent: 74, trend: "down", term: "3 четверть", recordedAt: new Date("2026-03-09T08:00:00Z") },
            { studentId: student1.id, subjectId: subjectMap["История Казахстана"].id, type: "ДЗ", displayValue: "88%", numericValue: 4.4, percent: 88, trend: "up", term: "3 четверть", recordedAt: new Date("2026-03-08T08:00:00Z") },
            { studentId: student1.id, subjectId: subjectMap["Алгебра"].id, type: "СОЧ", displayValue: "5", numericValue: 5, percent: 100, status: "good", term: "Неделя 11", recordedAt: new Date("2026-03-12T08:00:00Z") },
            { studentId: student1.id, subjectId: subjectMap["Физика"].id, type: "ДЗ", displayValue: "4", numericValue: 4, percent: 80, status: "neutral", term: "Неделя 11", recordedAt: new Date("2026-03-13T08:00:00Z") },
            { studentId: student1.id, subjectId: subjectMap["Биология"].id, type: "Классная", displayValue: "5", numericValue: 5, percent: 100, status: "good", term: "Неделя 11", recordedAt: new Date("2026-03-14T08:00:00Z") },
            { studentId: student1.id, subjectId: subjectMap["История"].id, type: "Отсутствие", displayValue: "Н", status: "bad", term: "Неделя 11", recordedAt: new Date("2026-03-15T08:00:00Z") },
            { studentId: student2.id, subjectId: subjectMap["Алгебра"].id, type: "СОР", displayValue: "99%", numericValue: 5, percent: 99, trend: "up", term: "3 четверть", recordedAt: new Date("2026-03-11T08:00:00Z") },
            { studentId: student2.id, subjectId: subjectMap["Физика"].id, type: "СОР", displayValue: "96%", numericValue: 4.8, percent: 96, trend: "up", term: "3 четверть", recordedAt: new Date("2026-03-11T08:00:00Z") },
            { studentId: student3.id, subjectId: subjectMap["Алгебра"].id, type: "СОР", displayValue: "93%", numericValue: 4.7, percent: 93, trend: "up", term: "3 четверть", recordedAt: new Date("2026-03-11T08:00:00Z") },
            { studentId: student3.id, subjectId: subjectMap["Физика"].id, type: "СОР", displayValue: "89%", numericValue: 4.3, percent: 89, trend: "down", term: "3 четверть", recordedAt: new Date("2026-03-11T08:00:00Z") },
        ],
    });

    await prisma.attendanceRecord.createMany({
        data: [
            { studentId: student1.id, subjectId: subjectMap["История"].id, status: AttendanceStatus.absent, note: "Пропуск урока", recordedAt: new Date("2026-03-04T08:00:00Z") },
            { studentId: student1.id, subjectId: subjectMap["История"].id, status: AttendanceStatus.absent, note: "Пропуск урока", recordedAt: new Date("2026-03-10T08:00:00Z") },
            { studentId: student2.id, subjectId: subjectMap["Физика"].id, status: AttendanceStatus.present, recordedAt: new Date("2026-03-10T08:00:00Z") },
            { studentId: student3.id, subjectId: subjectMap["Физика"].id, status: AttendanceStatus.late, note: "Опоздание", recordedAt: new Date("2026-03-10T08:00:00Z") },
        ],
    });

    await prisma.studentGoal.createMany({
        data: [
            { studentId: student1.id, title: "Сдать СОЧ по физике на 90+ баллов", daysLeft: 4 },
            { studentId: student2.id, title: "Подготовиться к городской олимпиаде по математике", daysLeft: 7 },
            { studentId: student3.id, title: "Улучшить результат по информатике до 95%", daysLeft: 10 },
        ],
    });

    await prisma.achievement.createMany({
        data: [
            { studentId: student1.id, title: "1 место по Математике", description: "Городская олимпиада, 2025", icon: "Medal", color: "bg-yellow-100" },
            { studentId: student1.id, title: "Кембриджский сертификат", description: "FCE, Уровень B2, 2024", icon: "BookOpen", color: "bg-blue-100" },
            { studentId: student1.id, title: "Спортивный разряд", description: "1-й юношеский, Легкая атлетика", icon: "Activity", color: "bg-green-100" },
        ],
    });

    await prisma.studentSkill.createMany({
        data: [
            { studentId: student1.id, name: "Программирование (Python)" },
            { studentId: student1.id, name: "Физика" },
            { studentId: student1.id, name: "Робототехника" },
            { studentId: student1.id, name: "Шахматы" },
            { studentId: student1.id, name: "Английский (B2)" },
        ],
    });

    await prisma.activityEntry.createMany({
        data: [
            { studentId: student1.id, title: "Создал проект 'Умная теплица' в кружке робототехники", color: "bg-primary", occurredAt: new Date("2026-03-15T08:00:00Z") },
            { studentId: student1.id, title: "Закончил 3 четверть на 'Отлично'", color: "bg-green-500", occurredAt: new Date("2026-02-28T08:00:00Z") },
            { studentId: student1.id, title: "Участник зимнего хакатона Aqbobek Lyceum", color: "bg-secondary-accent", occurredAt: new Date("2025-12-14T08:00:00Z") },
        ],
    });

    await prisma.riskAlert.createMany({
        data: [
            {
                studentId: student1.id,
                subjectId: subjectMap["Физика"].id,
                dropLabel: "-15%",
                reason: "Пробелы в теме «Электрическое поле», недосданные лабораторные работы",
                riskLevel: RiskLevel.high,
            },
            {
                studentId: student2.id,
                subjectId: subjectMap["Физика"].id,
                dropLabel: "-8%",
                reason: "Систематические ошибки в задачах на закон Фарадея",
                riskLevel: RiskLevel.medium,
            },
            {
                studentId: student3.id,
                subjectId: subjectMap["Физика"].id,
                dropLabel: "-12%",
                reason: "Резкое падение активности на уроке",
                riskLevel: RiskLevel.high,
            },
        ],
    });

    await prisma.teacherTask.createMany({
        data: [
            { teacherId: teacher1.id, title: 'Проверить СОЧ 10 "А"', note: "Остался 1 день до закрытия оценок", urgent: true },
            { teacherId: teacher1.id, title: "Загрузить конспект лекции", note: "Тема: Электромагнитная индукция" },
            { teacherId: teacher1.id, title: "Заполнить Кунделик", note: "За 14 Марта" },
        ],
    });

    const schedulePlan = await prisma.schedulePlan.create({
        data: {
            title: "Понедельник, 10 классы",
            dayOfWeek: 1,
            status: SchedulePlanStatus.published,
            generatedAt: new Date("2026-03-29T07:00:00Z"),
            publishedAt: new Date("2026-03-29T07:10:00Z"),
            createdById: userMap.admin.id,
        },
    });

    await prisma.scheduleSlot.createMany({
        data: [
            { schedulePlanId: schedulePlan.id, classId: classMap["10 А"].id, subjectId: subjectMap["Алгебра"].id, teacherId: teacher2.id, timeLabel: "08:30 - 09:15", room: "302" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 А"].id, subjectId: subjectMap["Физика"].id, teacherId: teacher1.id, timeLabel: "09:25 - 10:10", room: "Лаб. 3" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 А"].id, subjectId: subjectMap["Английский язык"].id, timeLabel: "10:30 - 11:15", room: "205, 206", split: true },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 А"].id, subjectId: subjectMap["История"].id, teacherId: teacher3.id, timeLabel: "11:25 - 12:10", room: "310" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 А"].id, subjectId: subjectMap["Физкультура"].id, timeLabel: "12:20 - 13:05", room: "Спортзал 1" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 Б"].id, subjectId: subjectMap["Геометрия"].id, teacherId: teacher2.id, timeLabel: "08:30 - 09:15", room: "304" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 Б"].id, subjectId: subjectMap["Физика"].id, teacherId: teacher1.id, timeLabel: "09:25 - 10:10", room: "Лаб. 3" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 Б"].id, subjectId: subjectMap["Английский язык"].id, timeLabel: "10:30 - 11:15", room: "205, 207", split: true },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 Б"].id, subjectId: subjectMap["Химия"].id, timeLabel: "11:25 - 12:10", room: "Лаб. 1" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 Б"].id, subjectId: subjectMap["Физкультура"].id, timeLabel: "12:20 - 13:05", room: "Стадион" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 В"].id, subjectId: subjectMap["Алгебра"].id, teacherId: teacher2.id, timeLabel: "08:30 - 09:15", room: "301" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 В"].id, subjectId: subjectMap["Биология"].id, timeLabel: "09:25 - 10:10", room: "204" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 В"].id, subjectId: subjectMap["Английский язык"].id, timeLabel: "10:30 - 11:15", room: "210" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 В"].id, subjectId: subjectMap["История"].id, teacherId: teacher3.id, timeLabel: "11:25 - 12:10", room: "310" },
            { schedulePlanId: schedulePlan.id, classId: classMap["10 В"].id, subjectId: subjectMap["Информатика"].id, timeLabel: "12:20 - 13:05", room: "Lab IT" },
        ],
    });

    await prisma.scheduleConflict.createMany({
        data: [
            { schedulePlanId: schedulePlan.id, title: "Физрук заболел", description: "ИИ объединил 10А и 10Б на стадионе со вторым учителем.", severity: "medium", resolved: true },
            { schedulePlanId: schedulePlan.id, title: "Ремонт зала", description: "Уроки переведены на альтернативные площадки согласно погоде.", severity: "low", resolved: true },
        ],
    });

    await prisma.leaderboardEntry.createMany({
        data: [
            { studentId: student2.id, category: "Общий рейтинг", points: 1450, rank: 1, trend: "up" },
            { studentId: student3.id, category: "Общий рейтинг", points: 1395, rank: 2, trend: "up" },
            { studentId: student1.id, category: "Общий рейтинг", points: 1280, rank: 4, trend: "up" },
            { studentId: student1.id, category: "Точные науки", points: 980, rank: 1, trend: "up" },
            { studentId: student2.id, category: "Точные науки", points: 965, rank: 2, trend: "up" },
            { studentId: student1.id, category: "Олимпиады", points: 600, rank: 2, trend: "up" },
            { studentId: student2.id, category: "Олимпиады", points: 590, rank: 3, trend: "up" },
        ],
    });

    await prisma.studentBadge.createMany({
        data: [
            { studentId: student1.id, name: "Эрудит", icon: "Brain", color: "text-purple-600", bgColor: "bg-purple-100" },
            { studentId: student1.id, name: "Скорость", icon: "Zap", color: "text-amber-500", bgColor: "bg-amber-100" },
            { studentId: student1.id, name: "Перфекционист", icon: "Star", color: "text-blue-500", bgColor: "bg-blue-100" },
            { studentId: student1.id, name: "Спорт", icon: "Medal", color: "text-green-600", bgColor: "bg-green-100" },
            { studentId: student1.id, name: "Староста", icon: "ShieldCheck", color: "text-foreground", bgColor: "bg-black/10" },
        ],
    });

    await prisma.newsItem.createMany({
        data: [
            {
                category: NewsCategory.announcement,
                title: "Открытие нового кампуса робототехники",
                description: "В среду состоится торжественное открытие лаборатории. Приглашаются старшеклассники и учителя IT направлений.",
                publishedAt: new Date("2026-03-12T09:00:00Z"),
                highlight: true,
                pinned: true,
                createdByUserId: userMap.admin.id,
            },
            {
                category: NewsCategory.olympiad,
                title: "Регистрация на турнир Кеңгуру",
                description: "Ученики 5-11 классов могут принять участие в математическом турнире.",
                publishedAt: new Date("2026-03-10T09:00:00Z"),
                createdByUserId: userMap.admin.id,
            },
            {
                category: NewsCategory.schedule,
                title: "Изменение расписания звонков",
                description: "В связи с сокращенным днем, звонки сдвинуты на 10 минут.",
                publishedAt: new Date("2026-03-09T09:00:00Z"),
                highlight: true,
                createdByUserId: userMap.admin.id,
            },
            {
                category: NewsCategory.courses,
                title: "Набор в группу подготовки к IELTS",
                description: "Учитель английского языка проводит бесплатные занятия для 11 классов по субботам.",
                publishedAt: new Date("2026-03-08T09:00:00Z"),
                createdByUserId: userMap.admin.id,
            },
            {
                category: NewsCategory.sports,
                title: "Победа в городском чемпионате по баскетболу",
                description: "Сборная школы заняла почетное 1 место в региональных играх.",
                publishedAt: new Date("2026-03-05T09:00:00Z"),
                createdByUserId: userMap.admin.id,
            },
            {
                category: NewsCategory.announcement,
                title: "Сдача СОЧ по физике",
                description: "Дедлайн: 16 Марта. Кабинет 302.",
                publishedAt: new Date("2026-03-15T09:00:00Z"),
                highlight: true,
                targetClassId: classMap["10 А"].id,
                targetRole: UserRole.student,
                createdByUserId: userMap.admin.id,
            },
            {
                category: NewsCategory.announcement,
                title: "Олимпиада по физике",
                description: "Тимур номинирован на участие в городской олимпиаде!",
                publishedAt: new Date("2026-03-17T09:00:00Z"),
                targetClassId: classMap["10 А"].id,
                targetRole: UserRole.parent,
                createdByUserId: userMap.admin.id,
            },
        ],
    });

    await prisma.broadcast.createMany({
        data: [
            {
                audienceType: BroadcastAudienceType.all,
                audienceLabel: "Все пользователи",
                text: "Напоминаем о совещании руководителей кафедр сегодня в 16:30.",
                createdByUserId: userMap.admin.id,
            },
            {
                audienceType: BroadcastAudienceType.role,
                audienceLabel: "Учителя",
                targetRole: UserRole.teacher,
                text: 'Черновик отчета по 10 "Б" обновлен. Нужна проверка до 18:00.',
                createdByUserId: userMap.admin.id,
            },
        ],
    });

    await prisma.approval.createMany({
        data: [
            { title: "Больничный: Жукенов М.Т.", meta: "Физика • 10-11 классы • 2 дня", priority: "Высокий", status: ApprovalStatus.pending },
            { title: "Закупка проекторов", meta: "IT блок • 4 кабинета • 1 280 000 ₸", priority: "Средний", status: ApprovalStatus.pending },
            { title: "Внеплановое собрание родителей", meta: "10 классы • Актовый зал • пятница 18:30", priority: "Средний", status: ApprovalStatus.pending },
        ],
    });

    await prisma.incident.createMany({
        data: [
            { title: "Жалоба на перегрузку расписания", location: "10 Б", ownerLabel: "Зам. директора", severity: "Средне", status: IncidentStatus.open },
            { title: "Не работает проектор", location: "Каб. 305", ownerLabel: "Техслужба", severity: "Критично", status: IncidentStatus.open },
            { title: "Конфликт замены учителя", location: "11 А", ownerLabel: "Учебная часть", severity: "Средне", status: IncidentStatus.open },
        ],
    });

    await prisma.eventLog.createMany({
        data: [
            { title: "Система стабильна", note: "Последний бекап: 2 часа назад", kind: EventLogKind.system, userId: userMap.admin.id },
            { title: "Уведомление отправлено", note: '"Собрание 10-х классов" (120 получателей)', kind: EventLogKind.mail, userId: userMap.admin.id },
            { title: "Модуль расписания активен", note: "Генератор расписания готов к использованию", kind: EventLogKind.system, userId: userMap.admin.id },
        ],
    });

    await prisma.kioskItem.createMany({
        data: [
            { type: KioskItemType.replacement, title: "Физкультура (10 А, 10 Б)", body: "Занятие на улице. Сбор на футбольном поле.", priority: 100 },
            { type: KioskItemType.replacement, title: "Биология (11 В)", body: "Кабинет изменен на 204 (Лаборатория).", priority: 90 },
            { type: KioskItemType.announcement, title: "Торжественная линейка старшеклассников", body: "Состоится во внутреннем дворе школы в 14:00. Присутствие всех участников городской олимпиады обязательно.", priority: 80 },
            { type: KioskItemType.spotlight, title: "Ученик дня", body: "Алиса Воронова (11 А)", priority: 70 },
            { type: KioskItemType.cafeteria, title: "Меню столовой", body: "Меню столовой обновлено", priority: 60 },
        ],
    });

    await prisma.chatMessage.createMany({
        data: [
            {
                userId: userMap.student1.id,
                role: ChatRole.assistant,
                text: "Здравствуйте! Я AI-Наставник AqbobekHub. Могу помочь с подготовкой к урокам, планом на неделю и разбором сложных тем.",
            },
        ],
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
