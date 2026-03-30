"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, CheckSquare, ClipboardList, MessageSquare, Sparkles, UserX } from "lucide-react";
import { TeacherDashboardPayload } from "./types";
import { useTeacherOperations } from "./useTeacherOperations";

type TaskFilter = "all" | "open" | "done";

function getTodayInputValue() {
    return new Date().toISOString().slice(0, 10);
}

function getDefaultEndInputValue() {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().slice(0, 10);
}

export function TeacherWorkbenchView({ dashboard }: { dashboard: TeacherDashboardPayload | null }) {
    const { status, communication, toggleTask, report, submitSickLeave } = useTeacherOperations("Рабочий центр открыт. Здесь собраны задачи, сообщения, больничный и все быстрые teacher actions.");
    const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
    const [absenceForm, setAbsenceForm] = useState({
        startsAt: dashboard?.activeAbsence?.startsAtIso ?? getTodayInputValue(),
        endsAt: dashboard?.activeAbsence?.endsAtIso ?? getDefaultEndInputValue(),
        reason: dashboard?.activeAbsence?.reason ?? "Больничный",
    });

    const filteredTasks = useMemo(() => {
        const tasks = dashboard?.tasks ?? [];
        if (taskFilter === "open") return tasks.filter((task) => !task.done);
        if (taskFilter === "done") return tasks.filter((task) => task.done);
        return tasks;
    }, [dashboard, taskFilter]);

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Рабочий центр учителя</h1>
                    <p className="text-sm text-muted-foreground mt-2">Все операционные действия: задачи, сообщения, больничный и teacher tools.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/teacher" className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-black/5">
                        Назад в кабинет
                    </Link>
                    <button onClick={() => void report()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                        Сформировать отчет
                    </button>
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-foreground">{status}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1fr] gap-6">
                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-[#f8f5ff] to-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Быстрые действия</h2>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-foreground/85">{dashboard?.aiSummary ?? "Готовим аналитику..."}</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button onClick={() => void communication("generate-test", "Не удалось создать тест.")} className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90">
                                Сгенерировать тест
                            </button>
                            <button onClick={() => void communication("support-plan", "Не удалось собрать план поддержки.")} className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-black/5">
                                План поддержки
                            </button>
                            <button onClick={() => void communication("notify-parents", "Не удалось подготовить уведомление.")} className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-black/5">
                                Уведомить родителей
                            </button>
                            <button onClick={() => void communication("attendance-report", "Не удалось поставить задачу по пропускам.")} className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-black/5">
                                Список пропусков
                            </button>
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Задачи и журнал</h2>
                                <p className="text-xs text-muted-foreground mt-1">Любое действие с уроком или учеником попадает сюда как рабочая задача.</p>
                            </div>
                            <CheckSquare className="w-5 h-5 text-primary" />
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                                { key: "all", label: `Все (${dashboard?.tasks.length ?? 0})` },
                                { key: "open", label: `Открытые (${dashboard?.focusBoard.openTaskCount ?? 0})` },
                                { key: "done", label: `Выполнено (${dashboard?.focusBoard.completedTaskCount ?? 0})` },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => setTaskFilter(item.key as TaskFilter)}
                                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${taskFilter === item.key ? "bg-primary text-white" : "bg-black/5 text-muted-foreground hover:bg-black/10"}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <ul className="space-y-3">
                            {filteredTasks.map((task) => (
                                <li
                                    key={task.id}
                                    onClick={() => void toggleTask(task.id, task.done)}
                                    className={`cursor-pointer rounded-xl border p-3 transition-colors flex items-center justify-between gap-3 ${task.urgent ? "border-red-100 bg-red-50 hover:bg-red-100/50" : "border-border/50 bg-white/50 hover:border-primary/30"} ${task.done ? "opacity-60" : ""}`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-semibold text-foreground">{task.title}</p>
                                            {task.urgent && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">Срочно</span>}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">{task.note ?? "Без дополнительной заметки"}</p>
                                    </div>
                                    {task.done ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <ClipboardList className="w-4 h-4 text-muted-foreground shrink-0" />}
                                </li>
                            ))}
                            {filteredTasks.length === 0 && <p className="text-sm text-muted-foreground">Под выбранный фильтр задач нет.</p>}
                        </ul>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Больничный</h2>
                                <p className="text-xs text-muted-foreground mt-1">Система сразу перестроит неделю и отправит нужные уведомления.</p>
                            </div>
                            <UserX className="w-5 h-5 text-red-500" />
                        </div>

                        {dashboard?.activeAbsence && (
                            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/70 p-4">
                                <p className="text-sm font-semibold text-foreground">Активный больничный</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {dashboard.activeAbsence.startsAt} - {dashboard.activeAbsence.endsAt} • {dashboard.activeAbsence.reason}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Начало</span>
                                <input type="date" value={absenceForm.startsAt} onChange={(event) => setAbsenceForm((current) => ({ ...current, startsAt: event.target.value }))} className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Окончание</span>
                                <input type="date" value={absenceForm.endsAt} onChange={(event) => setAbsenceForm((current) => ({ ...current, endsAt: event.target.value }))} className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Причина</span>
                                <textarea value={absenceForm.reason} onChange={(event) => setAbsenceForm((current) => ({ ...current, reason: event.target.value }))} rows={3} className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
                            </label>
                            <button onClick={() => void submitSickLeave(absenceForm)} className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                                Отметить больничный и перестроить неделю
                            </button>
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Сообщения администрации</h2>
                        </div>
                        <div className="space-y-3">
                            {dashboard?.adminMessages.map((message) => (
                                <button
                                    key={message.id}
                                    onClick={() => void communication(`broadcast:${message.id}`, `Открыто сообщение администрации: ${message.text}`)}
                                    className="w-full rounded-2xl border border-border bg-white/60 p-4 text-left hover:border-primary/30"
                                >
                                    <p className="text-sm font-semibold text-foreground">{message.text}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{message.createdAt}</p>
                                </button>
                            ))}
                            {(dashboard?.adminMessages.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Новых сообщений нет.</p>}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-4">
                            <BellRing className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Лента действий</h2>
                        </div>
                        <div className="space-y-3">
                            {dashboard?.recentActions.map((action) => (
                                <div key={action.id} className="rounded-2xl border border-border/60 bg-white/50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{action.title}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{action.note}</p>
                                        </div>
                                        <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {action.createdAt}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {(dashboard?.recentActions.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Действия появятся здесь после использования кнопок и задач.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
