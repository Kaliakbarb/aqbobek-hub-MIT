import { NextResponse } from "next/server";
import { EventLogKind, UserRole } from "@prisma/client";
import { handleRouteError, jsonError } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";
import { createAdminEventLog, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";

async function ensureTeacherTask(input: {
    teacherId: string;
    title: string;
    note: string;
    urgent?: boolean;
}) {
    const existing = await prisma.teacherTask.findFirst({
        where: {
            teacherId: input.teacherId,
            title: input.title,
            done: false,
        },
    });

    if (existing) {
        return { task: existing, created: false };
    }

    const task = await prisma.teacherTask.create({
        data: {
            teacherId: input.teacherId,
            title: input.title,
            note: input.note,
            urgent: input.urgent ?? false,
        },
    });

    return { task, created: true };
}

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.teacher]);

        if (!user.teacher) {
            return jsonError("Профиль учителя не найден.", 404);
        }

        const body = await request.json();
        const action = typeof body?.action === "string" ? body.action : "";

        if (!action) {
            return jsonError("Действие не указано.");
        }

        let message = "Действие выполнено.";
        let title = "Коммуникация учителя";
        let note = `${user.fullName}: ${action}`;

        if (action === "notify-parents") {
            const result = await ensureTeacherTask({
                teacherId: user.teacher.id,
                title: "Уведомить родителей по группе риска",
                note: "Подготовить короткое сообщение родителям по ученикам и классам, где AI видит риск снижения результата.",
                urgent: true,
            });
            title = "Подготовлено уведомление родителям";
            note = result.task.title;
            message = result.created
                ? "Черновик уведомления для родителей добавлен в задачи учителя."
                : "Черновик уведомления уже есть в открытых задачах.";
        } else if (action === "generate-test") {
            const result = await ensureTeacherTask({
                teacherId: user.teacher.id,
                title: "Собрать диагностический тест на 10 минут",
                note: "Подготовить короткий тест по ближайшей теме риска и выдать на следующем уроке.",
                urgent: true,
            });
            title = "Создана задача на диагностический тест";
            note = result.task.title;
            message = result.created
                ? "Диагностический тест поставлен в рабочие задачи учителя."
                : "Задача на диагностический тест уже есть в работе.";
        } else if (action === "support-plan") {
            const result = await ensureTeacherTask({
                teacherId: user.teacher.id,
                title: "Сформировать план поддержки по ученикам риска",
                note: "Собрать короткий персональный план: повторение темы, мини-тест, сообщение родителям и домашняя практика.",
                urgent: true,
            });
            title = "Запланирована персональная поддержка";
            note = result.task.title;
            message = result.created
                ? "План поддержки добавлен в задачи и отражен в ленте действий."
                : "План поддержки уже есть среди открытых задач.";
        } else if (action === "attendance-report") {
            const result = await ensureTeacherTask({
                teacherId: user.teacher.id,
                title: "Собрать список пропусков по текущей неделе",
                note: "Проверить отсутствующих по классам и подготовить короткий follow-up для родителей и куратора.",
                urgent: false,
            });
            title = "Сформирован запрос на отчет по пропускам";
            note = result.task.title;
            message = result.created
                ? "Задача на обзор пропусков добавлена в рабочий список."
                : "Отчет по пропускам уже стоит в работе.";
        } else if (action.startsWith("open-journal:")) {
            const slotId = action.replace("open-journal:", "");
            const slot = await prisma.scheduleSlot.findUnique({
                where: { id: slotId },
                include: {
                    schoolClass: true,
                    subject: true,
                    room: true,
                },
            });

            if (!slot) {
                return jsonError("Урок не найден.", 404);
            }

            const lessonTitle = slot.title ?? slot.subject?.name ?? "Урок";
            const result = await ensureTeacherTask({
                teacherId: user.teacher.id,
                title: `Журнал урока: ${lessonTitle} / ${slot.schoolClass.name}`,
                note: `${slot.timeLabel} • ${slot.schoolClass.name} • ${slot.room?.name ?? "Кабинет уточняется"}`,
                urgent: false,
            });
            title = "Открыт журнал урока";
            note = result.task.title;
            message = result.created
                ? "Журнал урока добавлен в задачи. Можно отметить тему, посещаемость и комментарий."
                : "Журнал этого урока уже есть в открытых задачах.";
        } else if (action.startsWith("mark-attendance:")) {
            const slotId = action.replace("mark-attendance:", "");
            const slot = await prisma.scheduleSlot.findUnique({
                where: { id: slotId },
                include: {
                    schoolClass: true,
                    subject: true,
                },
            });

            if (!slot) {
                return jsonError("Урок не найден.", 404);
            }

            const lessonTitle = slot.title ?? slot.subject?.name ?? "Урок";
            const result = await ensureTeacherTask({
                teacherId: user.teacher.id,
                title: `Посещаемость: ${lessonTitle} / ${slot.schoolClass.name}`,
                note: `Отметить присутствие учеников на уроке ${slot.timeLabel}.`,
                urgent: false,
            });
            title = "Открыта посещаемость урока";
            note = result.task.title;
            message = result.created
                ? "Черновик посещаемости добавлен в задачи учителя."
                : "Посещаемость по этому уроку уже есть в задачах.";
        } else if (action.startsWith("assign-homework:")) {
            const className = action.replace("assign-homework:", "");
            const result = await ensureTeacherTask({
                teacherId: user.teacher.id,
                title: `Домашнее задание для ${className}`,
                note: "Подготовить задание, дедлайн и короткое пояснение для учеников.",
                urgent: false,
            });
            title = "Подготовка домашнего задания";
            note = result.task.title;
            message = result.created
                ? `Черновик ДЗ для ${className} добавлен в задачи.`
                : `Задача на ДЗ для ${className} уже есть в работе.`;
        } else if (action.startsWith("message-class:")) {
            const classId = action.replace("message-class:", "");
            const schoolClass = await prisma.schoolClass.findUnique({
                where: { id: classId },
            });

            if (!schoolClass) {
                return jsonError("Класс не найден.", 404);
            }

            const result = await ensureTeacherTask({
                teacherId: user.teacher.id,
                title: `Сообщение классу ${schoolClass.name}`,
                note: "Подготовить короткое сообщение ученикам: напоминание, дедлайн или изменение по учебной неделе.",
                urgent: false,
            });
            title = "Подготовлено сообщение классу";
            note = result.task.title;
            message = result.created
                ? `Шаблон сообщения для ${schoolClass.name} добавлен в задачи.`
                : `Шаблон сообщения для ${schoolClass.name} уже есть в открытых задачах.`;
        } else if (action.startsWith("review-student:")) {
            const studentName = action.replace("review-student:", "");
            const result = await ensureTeacherTask({
                teacherId: user.teacher.id,
                title: `Разбор прогресса: ${studentName}`,
                note: "Проверить причины риска, подготовить короткую персональную работу и связаться с семьей при необходимости.",
                urgent: true,
            });
            title = "Добавлен разбор ученика";
            note = result.task.title;
            message = result.created
                ? `Карточка персональной работы по ученику ${studentName} добавлена в задачи.`
                : `Разбор по ученику ${studentName} уже есть в работе.`;
        } else if (action.startsWith("broadcast:")) {
            title = "Просмотрено сообщение администрации";
            note = `${user.fullName} открыл сообщение ${action.replace("broadcast:", "")}`;
            message = "Сообщение администрации отмечено как просмотренное и занесено в ленту действий.";
        }

        await createAdminEventLog({
            title,
            note,
            kind: EventLogKind.mail,
            userId: user.id,
        });

        return NextResponse.json({ ok: true, message });
    } catch (error) {
        return handleRouteError(error);
    }
}
