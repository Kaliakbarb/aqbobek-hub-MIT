import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import {
    ApprovalStatus,
    AttendanceStatus,
    AvailabilityStatus,
    BroadcastAudienceType,
    ChatRole,
    EventLogKind,
    HomeworkSubmissionStatus,
    IncidentStatus,
    KioskItemType,
    NewsCategory,
    PrismaClient,
    RoomType,
    RiskLevel,
    ScheduleItemType,
    SchedulePlanStatus,
    TeacherAbsenceStatus,
    UserRole,
} from "@prisma/client";
import { generateSmartSchedule } from "../lib/smart-schedule";

const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./dev.db" }),
});

const EXTRA_STUDENTS_PER_CLASS = 20;
const EXTRA_FIRST_NAMES = [
    "Арман", "Диас", "Аяулым", "Нурасыл", "Мадина", "Санжар", "Алина", "Ерасыл", "Аружан", "Ислам",
    "Мирас", "Томирис", "Еркежан", "Бекзат", "Жанель", "Адиль", "Сезим", "Расул", "Адель", "Нурсултан",
];
const EXTRA_LAST_NAMES = [
    "Сатыбалдиев", "Омарова", "Тлеубергенов", "Ибраева", "Касымов", "Сагындык", "Нурпеисова", "Муратов", "Елубаева", "Калибеков",
    "Абдрахманов", "Жумабекова", "Сағынтаев", "Турсынова", "Кудайберген", "Мусина", "Бекенов", "Даулетова", "Сулейменов", "Шарипова",
];

function round(value: number, digits = 1) {
    return Number(value.toFixed(digits));
}

async function main() {
    const passwordHash = await bcrypt.hash("12345", 10);
    const hiddenStudentPasswordHash = await bcrypt.hash("seed-only-hidden-students-2026", 10);

    await prisma.chatMessage.deleteMany();
    await prisma.kioskItem.deleteMany();
    await prisma.eventLog.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.approval.deleteMany();
    await prisma.broadcast.deleteMany();
    await prisma.newsItem.deleteMany();
    await prisma.studentBadge.deleteMany();
    await prisma.leaderboardEntry.deleteMany();
    await prisma.teacherAbsence.deleteMany();
    await prisma.scheduleConflict.deleteMany();
    await prisma.scheduleSlot.deleteMany();
    await prisma.schedulePlan.deleteMany();
    await prisma.scheduleRequirement.deleteMany();
    await prisma.scheduleBandMember.deleteMany();
    await prisma.scheduleBand.deleteMany();
    await prisma.roomAvailability.deleteMany();
    await prisma.teacherAvailability.deleteMany();
    await prisma.room.deleteMany();
    await prisma.homeworkSubmission.deleteMany();
    await prisma.homeworkAssignment.deleteMany();
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
    const classProfileMap = {
        "10 А": "Физико-математическое направление",
        "10 Б": "Физико-математическое направление",
        "10 В": "STEM",
    } as const;

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
                username: "teacher4",
                passwordHash,
                role: UserRole.teacher,
                firstName: "А.Н.",
                lastName: "Ким",
                fullName: "Ким А.Н.",
                email: "teacher4@aqbobek.kz",
                homePath: "/teacher",
                settings: { create: {} },
            },
        }),
        prisma.user.create({
            data: {
                username: "teacher5",
                passwordHash,
                role: UserRole.teacher,
                firstName: "Е.В.",
                lastName: "Петрова",
                fullName: "Петрова Е.В.",
                email: "teacher5@aqbobek.kz",
                homePath: "/teacher",
                settings: { create: {} },
            },
        }),
        prisma.user.create({
            data: {
                username: "teacher6",
                passwordHash,
                role: UserRole.teacher,
                firstName: "Ж.К.",
                lastName: "Серикова",
                fullName: "Серикова Ж.К.",
                email: "teacher6@aqbobek.kz",
                homePath: "/teacher",
                settings: { create: {} },
            },
        }),
        prisma.user.create({
            data: {
                username: "teacher7",
                passwordHash,
                role: UserRole.teacher,
                firstName: "И.А.",
                lastName: "Орлов",
                fullName: "Орлов И.А.",
                email: "teacher7@aqbobek.kz",
                homePath: "/teacher",
                settings: { create: {} },
            },
        }),
        prisma.user.create({
            data: {
                username: "teacher8",
                passwordHash,
                role: UserRole.teacher,
                firstName: "Л.С.",
                lastName: "Баймуханова",
                fullName: "Баймуханова Л.С.",
                email: "teacher8@aqbobek.kz",
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
    const extraStudentSpecs = (["10 А", "10 Б", "10 В"] as const).flatMap((className, classIndex) =>
        Array.from({ length: EXTRA_STUDENTS_PER_CLASS }, (_, index) => {
            const serial = classIndex * EXTRA_STUDENTS_PER_CLASS + index;
            const firstName = EXTRA_FIRST_NAMES[serial % EXTRA_FIRST_NAMES.length];
            const lastName = EXTRA_LAST_NAMES[(serial * 3) % EXTRA_LAST_NAMES.length];
            const username = `background_${classIndex + 1}_${String(index + 1).padStart(2, "0")}`;
            const gpa = round(3.5 + ((serial * 7) % 13) * 0.09, 1);
            const homeworkPct = 70 + ((serial * 11) % 28);
            const streakDays = 2 + ((serial * 5) % 19);

            return {
                username,
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`,
                email: `${username}@aqbobek.kz`,
                className,
                profileDirection: classProfileMap[className],
                gpa,
                homeworkPct,
                streakDays,
                overallPoints: 1080 + classIndex * 18 + (EXTRA_STUDENTS_PER_CLASS - index) * 10 + (serial % 4) * 7,
                stemPoints: 760 + classIndex * 22 + (EXTRA_STUDENTS_PER_CLASS - index) * 8 + (serial % 5) * 6,
                olympiadPoints: 430 + classIndex * 16 + (EXTRA_STUDENTS_PER_CLASS - index) * 5 + (serial % 6) * 4,
            };
        }),
    );

    const extraUsers = await Promise.all(
        extraStudentSpecs.map((spec) =>
            prisma.user.create({
                data: {
                    username: spec.username,
                    passwordHash: hiddenStudentPasswordHash,
                    role: UserRole.student,
                    firstName: spec.firstName,
                    lastName: spec.lastName,
                    fullName: spec.fullName,
                    email: spec.email,
                    homePath: "/student",
                    settings: {
                        create: {
                            pushAlerts: false,
                            emailAlerts: false,
                        },
                    },
                },
            }),
        ),
    );

    const [student1, student2, student3] = await Promise.all([
        prisma.student.create({
            data: {
                userId: userMap.student1.id,
                classId: classMap["10 А"].id,
                profileDirection: "Физико-математическое направление",
                gpa: 4.8,
                homeworkPct: 94,
                rank: null,
                rankTotal: null,
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
                rank: null,
                rankTotal: null,
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
                rank: null,
                rankTotal: null,
                streakDays: 10,
            },
        }),
    ]);

    const extraStudents = await Promise.all(
        extraUsers.map((user, index) =>
            prisma.student.create({
                data: {
                    userId: user.id,
                    classId: classMap[extraStudentSpecs[index].className].id,
                    profileDirection: extraStudentSpecs[index].profileDirection,
                    gpa: extraStudentSpecs[index].gpa,
                    homeworkPct: extraStudentSpecs[index].homeworkPct,
                    rank: null,
                    rankTotal: null,
                    streakDays: extraStudentSpecs[index].streakDays,
                },
            }),
        ),
    );

    const [teacher1, teacher2, teacher3, teacher4, teacher5, teacher6, teacher7, teacher8] = await Promise.all([
        prisma.teacher.create({ data: { userId: userMap.teacher1.id, bio: "Физика, 10-11 классы" } }),
        prisma.teacher.create({ data: { userId: userMap.teacher2.id, bio: "Алгебра и геометрия" } }),
        prisma.teacher.create({ data: { userId: userMap.teacher3.id, bio: "История Казахстана" } }),
        prisma.teacher.create({ data: { userId: userMap.teacher4.id, bio: "Английский язык, разговорные группы" } }),
        prisma.teacher.create({ data: { userId: userMap.teacher5.id, bio: "Английский язык, профильные потоки" } }),
        prisma.teacher.create({ data: { userId: userMap.teacher6.id, bio: "Химия и биология" } }),
        prisma.teacher.create({ data: { userId: userMap.teacher7.id, bio: "Информатика" } }),
        prisma.teacher.create({ data: { userId: userMap.teacher8.id, bio: "Физика и физкультура" } }),
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
            { teacherId: teacher2.id, subjectId: subjectMap["Геометрия"].id, classId: classMap["10 А"].id },
            { teacherId: teacher7.id, subjectId: subjectMap["Информатика"].id, classId: classMap["10 А"].id },
            { teacherId: teacher6.id, subjectId: subjectMap["Биология"].id, classId: classMap["10 А"].id },
            { teacherId: teacher6.id, subjectId: subjectMap["Химия"].id, classId: classMap["10 А"].id },
            { teacherId: teacher2.id, subjectId: subjectMap["Геометрия"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher2.id, subjectId: subjectMap["Алгебра"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher2.id, subjectId: subjectMap["Алгебра"].id, classId: classMap["10 В"].id },
            { teacherId: teacher2.id, subjectId: subjectMap["Геометрия"].id, classId: classMap["10 В"].id },
            { teacherId: teacher1.id, subjectId: subjectMap["Физика"].id, classId: classMap["10 А"].id },
            { teacherId: teacher1.id, subjectId: subjectMap["Физика"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher8.id, subjectId: subjectMap["Физика"].id, classId: classMap["10 В"].id },
            { teacherId: teacher3.id, subjectId: subjectMap["История"].id, classId: classMap["10 А"].id },
            { teacherId: teacher3.id, subjectId: subjectMap["История Казахстана"].id, classId: classMap["10 А"].id },
            { teacherId: teacher3.id, subjectId: subjectMap["История"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher3.id, subjectId: subjectMap["История Казахстана"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher3.id, subjectId: subjectMap["История"].id, classId: classMap["10 В"].id },
            { teacherId: teacher3.id, subjectId: subjectMap["История Казахстана"].id, classId: classMap["10 В"].id },
            { teacherId: teacher4.id, subjectId: subjectMap["Английский язык"].id, classId: classMap["10 А"].id },
            { teacherId: teacher5.id, subjectId: subjectMap["Английский язык"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher4.id, subjectId: subjectMap["Английский язык"].id, classId: classMap["10 В"].id },
            { teacherId: teacher6.id, subjectId: subjectMap["Химия"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher6.id, subjectId: subjectMap["Биология"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher6.id, subjectId: subjectMap["Биология"].id, classId: classMap["10 В"].id },
            { teacherId: teacher6.id, subjectId: subjectMap["Химия"].id, classId: classMap["10 В"].id },
            { teacherId: teacher7.id, subjectId: subjectMap["Информатика"].id, classId: classMap["10 В"].id },
            { teacherId: teacher7.id, subjectId: subjectMap["Информатика"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher8.id, subjectId: subjectMap["Физкультура"].id, classId: classMap["10 А"].id },
            { teacherId: teacher8.id, subjectId: subjectMap["Физкультура"].id, classId: classMap["10 Б"].id },
            { teacherId: teacher8.id, subjectId: subjectMap["Физкультура"].id, classId: classMap["10 В"].id },
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

    const [homeworkAlgebra10A, homeworkPhysics10A, homeworkInformatics10V, homeworkHistory10A] = await Promise.all([
        prisma.homeworkAssignment.create({
            data: {
                classId: classMap["10 А"].id,
                subjectId: subjectMap["Алгебра"].id,
                teacherId: teacher2.id,
                title: "Алгебра: квадратные уравнения",
                description: "Решить №12-18, оформить полное решение и отметить один самый сложный пример.",
                dueAt: new Date("2026-04-01T14:00:00Z"),
            },
        }),
        prisma.homeworkAssignment.create({
            data: {
                classId: classMap["10 А"].id,
                subjectId: subjectMap["Физика"].id,
                teacherId: teacher1.id,
                title: "Физика: электрическое поле",
                description: "Подготовить конспект по теме и загрузить фото тетради с разбором 2 задач.",
                dueAt: new Date("2026-04-02T14:00:00Z"),
            },
        }),
        prisma.homeworkAssignment.create({
            data: {
                classId: classMap["10 В"].id,
                subjectId: subjectMap["Информатика"].id,
                teacherId: teacher7.id,
                title: "Информатика: Python mini-project",
                description: "Собрать маленькую консольную программу и приложить `.py` файл или архив с проектом.",
                dueAt: new Date("2026-04-03T14:00:00Z"),
            },
        }),
        prisma.homeworkAssignment.create({
            data: {
                classId: classMap["10 А"].id,
                subjectId: subjectMap["История"].id,
                teacherId: teacher3.id,
                title: "История: карточки по реформам",
                description: "Сделать 10 карточек с датами и короткими пояснениями, загрузить PDF или фото.",
                dueAt: new Date("2026-04-04T14:00:00Z"),
            },
        }),
    ]);

    await prisma.homeworkSubmission.createMany({
        data: [
            {
                assignmentId: homeworkAlgebra10A.id,
                studentId: student1.id,
                status: HomeworkSubmissionStatus.reviewed,
                note: "Загрузил полное решение и отметил сложный номер 18.",
                fileName: "algebra-10a-timur.pdf",
                fileUrl: "/uploads/homework/demo/algebra-10a-timur.pdf",
                submittedAt: new Date("2026-03-31T11:20:00Z"),
                reviewedAt: new Date("2026-03-31T16:10:00Z"),
                teacherFeedback: "Хорошее решение, но в №18 проверь дискриминант.",
            },
            {
                assignmentId: homeworkPhysics10A.id,
                studentId: student1.id,
                status: HomeworkSubmissionStatus.draft,
                note: "Черновик почти готов, осталось добавить фото второй задачи.",
            },
            {
                assignmentId: homeworkPhysics10A.id,
                studentId: student2.id,
                status: HomeworkSubmissionStatus.submitted,
                note: "Конспект и задачи приложены одним PDF.",
                fileName: "physics-field-alisa.pdf",
                fileUrl: "/uploads/homework/demo/physics-field-alisa.pdf",
                submittedAt: new Date("2026-03-31T13:45:00Z"),
            },
            {
                assignmentId: homeworkInformatics10V.id,
                studentId: student3.id,
                status: HomeworkSubmissionStatus.submitted,
                note: "Сдала архив с python-проектом и README.",
                fileName: "python-mini-project-damir.zip",
                fileUrl: "/uploads/homework/demo/python-mini-project-damir.zip",
                submittedAt: new Date("2026-03-31T12:15:00Z"),
            },
            {
                assignmentId: homeworkHistory10A.id,
                studentId: student2.id,
                status: HomeworkSubmissionStatus.draft,
                note: "Карточки готовы, осталось объединить фото в один файл.",
            },
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

    const rooms = await Promise.all([
        prisma.room.create({ data: { name: "301", type: RoomType.standard, capacity: 28 } }),
        prisma.room.create({ data: { name: "302", type: RoomType.standard, capacity: 28 } }),
        prisma.room.create({ data: { name: "304", type: RoomType.standard, capacity: 28 } }),
        prisma.room.create({ data: { name: "205", type: RoomType.standard, capacity: 18 } }),
        prisma.room.create({ data: { name: "206", type: RoomType.standard, capacity: 18 } }),
        prisma.room.create({ data: { name: "210", type: RoomType.standard, capacity: 18 } }),
        prisma.room.create({ data: { name: "Лаб. 1", type: RoomType.lab, capacity: 20 } }),
        prisma.room.create({ data: { name: "Лаб. 3", type: RoomType.lab, capacity: 20 } }),
        prisma.room.create({ data: { name: "Lab IT", type: RoomType.computer, capacity: 22 } }),
        prisma.room.create({ data: { name: "Спортзал 1", type: RoomType.gym, capacity: 35 } }),
        prisma.room.create({ data: { name: "Стадион", type: RoomType.outdoor, capacity: 60 } }),
        prisma.room.create({ data: { name: "Актовый зал", type: RoomType.hall, capacity: 90 } }),
    ]);
    const roomMap = Object.fromEntries(rooms.map((room) => [room.name, room]));

    await prisma.teacherAvailability.createMany({
        data: [
            { teacherId: teacher1.id, dayOfWeek: 3, slotIndex: 6, status: AvailabilityStatus.unavailable },
            { teacherId: teacher2.id, dayOfWeek: 5, slotIndex: 1, status: AvailabilityStatus.unavailable },
            { teacherId: teacher4.id, dayOfWeek: 2, slotIndex: 6, status: AvailabilityStatus.unavailable },
            { teacherId: teacher5.id, dayOfWeek: 4, slotIndex: 1, status: AvailabilityStatus.unavailable },
            { teacherId: teacher6.id, dayOfWeek: 1, slotIndex: 6, status: AvailabilityStatus.unavailable },
            { teacherId: teacher7.id, dayOfWeek: 5, slotIndex: 6, status: AvailabilityStatus.unavailable },
            { teacherId: teacher8.id, dayOfWeek: 3, slotIndex: 1, status: AvailabilityStatus.unavailable },
        ],
    });

    await prisma.roomAvailability.createMany({
        data: [
            { roomId: roomMap["Актовый зал"].id, dayOfWeek: 4, slotIndex: 4, status: AvailabilityStatus.unavailable },
            { roomId: roomMap["Стадион"].id, dayOfWeek: 2, slotIndex: 5, status: AvailabilityStatus.unavailable },
            { roomId: roomMap["Лаб. 1"].id, dayOfWeek: 1, slotIndex: 6, status: AvailabilityStatus.unavailable },
        ],
    });

    const englishBand = await prisma.scheduleBand.create({
        data: {
            title: "Английский поток 10А/10Б",
            unitsPerWeek: 2,
            durationSlots: 1,
            itemType: ScheduleItemType.band,
            members: {
                create: [
                    {
                        classId: classMap["10 А"].id,
                        subjectId: subjectMap["Английский язык"].id,
                        teacherId: teacher4.id,
                        roomId: roomMap["205"].id,
                        label: "10А • Group A",
                    },
                    {
                        classId: classMap["10 Б"].id,
                        subjectId: subjectMap["Английский язык"].id,
                        teacherId: teacher5.id,
                        roomId: roomMap["206"].id,
                        label: "10Б • Group B",
                    },
                ],
            },
        },
    });

    await prisma.scheduleRequirement.createMany({
        data: [
            { classId: classMap["10 А"].id, subjectId: subjectMap["Алгебра"].id, teacherId: teacher2.id, unitsPerWeek: 3, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 5 },
            { classId: classMap["10 А"].id, subjectId: subjectMap["Геометрия"].id, teacherId: teacher2.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 4 },
            { classId: classMap["10 А"].id, subjectId: subjectMap["Физика"].id, teacherId: teacher1.id, unitsPerWeek: 1, durationSlots: 2, itemType: ScheduleItemType.pair, roomTypeRequired: RoomType.lab, difficulty: 5 },
            { classId: classMap["10 А"].id, subjectId: subjectMap["История"].id, teacherId: teacher3.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 3 },
            { classId: classMap["10 А"].id, subjectId: subjectMap["История Казахстана"].id, teacherId: teacher3.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 2 },
            { classId: classMap["10 А"].id, subjectId: subjectMap["Информатика"].id, teacherId: teacher7.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.computer, difficulty: 4 },
            { classId: classMap["10 А"].id, subjectId: subjectMap["Биология"].id, teacherId: teacher6.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.lab, difficulty: 3 },
            { classId: classMap["10 А"].id, subjectId: subjectMap["Химия"].id, teacherId: teacher6.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.lab, difficulty: 3 },
            { classId: classMap["10 А"].id, subjectId: subjectMap["Физкультура"].id, teacherId: teacher8.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.gym, difficulty: 1 },
            { classId: classMap["10 А"].id, title: "Классный час", teacherId: teacher3.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.academicHour, roomTypeRequired: RoomType.standard, difficulty: 1, lockedDayOfWeek: 5, lockedSlotIndex: 5 },
            { classId: classMap["10 А"].id, title: "Проектная мастерская", teacherId: teacher7.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.academicHour, roomTypeRequired: RoomType.computer, difficulty: 2 },

            { classId: classMap["10 Б"].id, subjectId: subjectMap["Алгебра"].id, teacherId: teacher2.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 5 },
            { classId: classMap["10 Б"].id, subjectId: subjectMap["Геометрия"].id, teacherId: teacher2.id, unitsPerWeek: 3, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 4 },
            { classId: classMap["10 Б"].id, subjectId: subjectMap["Физика"].id, teacherId: teacher1.id, unitsPerWeek: 1, durationSlots: 2, itemType: ScheduleItemType.pair, roomTypeRequired: RoomType.lab, difficulty: 5 },
            { classId: classMap["10 Б"].id, subjectId: subjectMap["Химия"].id, teacherId: teacher6.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.lab, difficulty: 4 },
            { classId: classMap["10 Б"].id, subjectId: subjectMap["Биология"].id, teacherId: teacher6.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.lab, difficulty: 3 },
            { classId: classMap["10 Б"].id, subjectId: subjectMap["История"].id, teacherId: teacher3.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 2 },
            { classId: classMap["10 Б"].id, subjectId: subjectMap["История Казахстана"].id, teacherId: teacher3.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 2 },
            { classId: classMap["10 Б"].id, subjectId: subjectMap["Информатика"].id, teacherId: teacher7.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.computer, difficulty: 3 },
            { classId: classMap["10 Б"].id, subjectId: subjectMap["Физкультура"].id, teacherId: teacher8.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.outdoor, difficulty: 1 },
            { classId: classMap["10 Б"].id, title: "Классный час", teacherId: teacher3.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.academicHour, roomTypeRequired: RoomType.standard, difficulty: 1, lockedDayOfWeek: 5, lockedSlotIndex: 6 },
            { classId: classMap["10 Б"].id, title: "Практикум по STEM", teacherId: teacher7.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.academicHour, roomTypeRequired: RoomType.computer, difficulty: 2 },

            { classId: classMap["10 В"].id, subjectId: subjectMap["Алгебра"].id, teacherId: teacher2.id, unitsPerWeek: 3, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 4 },
            { classId: classMap["10 В"].id, subjectId: subjectMap["Геометрия"].id, teacherId: teacher2.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 4 },
            { classId: classMap["10 В"].id, subjectId: subjectMap["Английский язык"].id, teacherId: teacher4.id, unitsPerWeek: 3, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 2 },
            { classId: classMap["10 В"].id, subjectId: subjectMap["Биология"].id, teacherId: teacher6.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.lab, difficulty: 3 },
            { classId: classMap["10 В"].id, subjectId: subjectMap["Информатика"].id, teacherId: teacher7.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.computer, difficulty: 4 },
            { classId: classMap["10 В"].id, subjectId: subjectMap["Физика"].id, teacherId: teacher8.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.lab, difficulty: 4 },
            { classId: classMap["10 В"].id, subjectId: subjectMap["Химия"].id, teacherId: teacher6.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.lab, difficulty: 3 },
            { classId: classMap["10 В"].id, subjectId: subjectMap["История"].id, teacherId: teacher3.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 2 },
            { classId: classMap["10 В"].id, subjectId: subjectMap["История Казахстана"].id, teacherId: teacher3.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.standard, difficulty: 2 },
            { classId: classMap["10 В"].id, subjectId: subjectMap["Физкультура"].id, teacherId: teacher8.id, unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.lesson, roomTypeRequired: RoomType.gym, difficulty: 1 },
            { classId: classMap["10 В"].id, title: "Классный час", teacherId: teacher3.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.academicHour, roomTypeRequired: RoomType.standard, difficulty: 1, lockedDayOfWeek: 5, lockedSlotIndex: 5 },
            { classId: classMap["10 В"].id, title: "STEM Assembly", unitsPerWeek: 1, durationSlots: 2, itemType: ScheduleItemType.event, roomTypeRequired: RoomType.hall, difficulty: 1, lockedDayOfWeek: 4, lockedSlotIndex: 3 },
            { classId: classMap["10 В"].id, title: "Проектная мастерская", teacherId: teacher7.id, unitsPerWeek: 1, durationSlots: 1, itemType: ScheduleItemType.academicHour, roomTypeRequired: RoomType.computer, difficulty: 2 },

            { classId: classMap["10 А"].id, bandId: englishBand.id, title: "Английский поток 10А/10Б", unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.band, difficulty: 2 },
            { classId: classMap["10 Б"].id, bandId: englishBand.id, title: "Английский поток 10А/10Б", unitsPerWeek: 2, durationSlots: 1, itemType: ScheduleItemType.band, difficulty: 2 },
        ],
    });

    const generated = await generateSmartSchedule({
        weekStartDate: new Date("2026-03-30T00:00:00Z"),
        createdById: userMap.admin.id,
    });

    await prisma.schedulePlan.update({
        where: { id: generated.planId },
        data: {
            status: SchedulePlanStatus.published,
            publishedAt: new Date("2026-03-29T07:10:00Z"),
        },
    });

    await prisma.teacherAbsence.create({
        data: {
            teacherId: teacher1.id,
            startsAt: new Date("2026-03-30T00:00:00Z"),
            endsAt: new Date("2026-03-31T23:59:59Z"),
            reason: "Больничный",
            status: TeacherAbsenceStatus.active,
        },
    });

    const leaderboardProfiles = [
        {
            studentId: student1.id,
            scores: {
                "Общий рейтинг": 1280,
                "Точные науки": 980,
                "Олимпиады": 600,
            },
        },
        {
            studentId: student2.id,
            scores: {
                "Общий рейтинг": 1450,
                "Точные науки": 965,
                "Олимпиады": 590,
            },
        },
        {
            studentId: student3.id,
            scores: {
                "Общий рейтинг": 1395,
                "Точные науки": 942,
                "Олимпиады": 575,
            },
        },
        ...extraStudents.map((student, index) => ({
            studentId: student.id,
            scores: {
                "Общий рейтинг": extraStudentSpecs[index].overallPoints,
                "Точные науки": extraStudentSpecs[index].stemPoints,
                "Олимпиады": extraStudentSpecs[index].olympiadPoints,
            },
        })),
    ];

    const leaderboardCategories = ["Общий рейтинг", "Точные науки", "Олимпиады"] as const;
    const leaderboardEntries = leaderboardCategories.flatMap((category) => {
        const sorted = [...leaderboardProfiles]
            .sort((left, right) => right.scores[category] - left.scores[category])
            .map((profile, index) => ({
                studentId: profile.studentId,
                category,
                points: profile.scores[category],
                rank: index + 1,
                trend: index < 10 ? "up" : index < 30 ? "same" : "down",
            }));

        return sorted;
    });

    await prisma.leaderboardEntry.createMany({
        data: leaderboardEntries,
    });

    const overallEntries = leaderboardEntries.filter((entry) => entry.category === "Общий рейтинг");
    await Promise.all(
        overallEntries.map((entry) =>
            prisma.student.update({
                where: { id: entry.studentId },
                data: {
                    rank: entry.rank,
                    rankTotal: overallEntries.length,
                },
            }),
        ),
    );

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
