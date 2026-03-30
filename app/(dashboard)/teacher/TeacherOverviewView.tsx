"use client";

import Link from "next/link";
import {
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    MessageSquare,
    Sparkles,
    TrendingDown,
    UserX,
    Users,
} from "lucide-react";
import { TeacherDashboardPayload } from "./types";
import { useTeacherOperations } from "./useTeacherOperations";

export function TeacherOverviewView({ dashboard }: { dashboard: TeacherDashboardPayload | null }) {
    const { status, communication, report } = useTeacherOperations("Главная страница учителя готова. Все разделы вынесены в отдельные рабочие страницы.");

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary/70">Teacher cockpit</p>
                    <h1 className="mt-2 text-3xl font-sora font-bold text-foreground">
                        {dashboard ? `${dashboard.teacher.firstName}, рабочий центр недели` : "Кабинет учителя"}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">
                        {dashboard?.teacher.subtitle ?? "Загружаем ваш недельный контур и рабочие действия..."}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="liquid-glass rounded-2xl px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Неделя</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{dashboard?.scheduleMeta.weekLabel ?? "Нет публикации"}</p>
                    </div>
                    <button onClick={() => void report()} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">
                        Сформировать отчет
                    </button>
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{status}</p>
                    <p className="text-xs text-muted-foreground">
                        Push-уведомления {dashboard?.scheduleMeta.pushAlertsEnabled ? "включены" : "выключены"} • уроков на неделю: {dashboard?.scheduleMeta.totalLessons ?? 0}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-3">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Классы и ученики</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">
                        {dashboard?.focusBoard.classCount ?? 0} / {dashboard?.stats.totalStudents ?? 0}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">Классов под вашим контуром: {dashboard?.focusBoard.classCount ?? 0}</p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Изменения недели</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{dashboard?.scheduleMeta.replacementCount ?? 0}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Следующий урок уже выделен в расписании.</p>
                </div>

                <div className="bg-orange-50/60 border border-orange-100 p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-3">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-orange-900/60 font-medium mb-1">Риски и внимание</h3>
                    <p className="text-2xl font-sora font-bold text-orange-700">{dashboard?.stats.riskCount ?? 0}</p>
                    <p className="mt-2 text-xs text-orange-800/70">Учеников в зоне высокого риска.</p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 mb-3">
                        <UserX className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Больничный и доступность</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{dashboard?.activeAbsence ? "Да" : "Нет"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        {dashboard?.activeAbsence ? `${dashboard.activeAbsence.startsAt} - ${dashboard.activeAbsence.endsAt}` : "Активных ограничений нет"}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-6">
                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Быстрые разделы</h2>
                                <p className="text-sm text-muted-foreground mt-1">Разделили teacher-кабинет на отдельные страницы, чтобы работать было легче.</p>
                            </div>
                            <ClipboardList className="w-5 h-5 text-primary" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link href="/teacher/schedule" className="rounded-[1.5rem] border border-primary/10 bg-primary/5 p-5 hover:border-primary/30">
                                <CalendarDays className="w-6 h-6 text-primary" />
                                <p className="mt-4 text-lg font-sora font-bold text-foreground">Расписание</p>
                                <p className="mt-2 text-sm text-muted-foreground">Полная недельная сетка учителя, уроки, изменения и действия по каждому слоту.</p>
                            </Link>
                            <Link href="/teacher/classes" className="rounded-[1.5rem] border border-border/60 bg-white/50 p-5 hover:border-primary/30">
                                <Users className="w-6 h-6 text-primary" />
                                <p className="mt-4 text-lg font-sora font-bold text-foreground">Классы</p>
                                <p className="mt-2 text-sm text-muted-foreground">Группы, ученики риска, focus по каждому классу и связка с коммуникациями.</p>
                            </Link>
                            <Link href="/teacher/workbench" className="rounded-[1.5rem] border border-border/60 bg-white/50 p-5 hover:border-primary/30">
                                <ClipboardList className="w-6 h-6 text-primary" />
                                <p className="mt-4 text-lg font-sora font-bold text-foreground">Рабочий центр</p>
                                <p className="mt-2 text-sm text-muted-foreground">Задачи, лента действий, больничный, сообщения и быстрые teacher operations.</p>
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-[#f8f5ff] to-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">AI-фокус недели</h2>
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
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Следующий урок</h2>
                        {dashboard?.focusBoard.nextLesson ? (
                            <div className="rounded-[1.5rem] border border-primary/15 bg-primary/5 p-5">
                                <p className="text-lg font-sora font-bold text-foreground">{dashboard.focusBoard.nextLesson.title}</p>
                                <p className="mt-2 text-sm text-muted-foreground">{dashboard.focusBoard.nextLesson.time}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{dashboard.focusBoard.nextLesson.className} • {dashboard.focusBoard.nextLesson.room}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button onClick={() => void communication(`open-journal:${dashboard.focusBoard.nextLesson?.id}`, "Не удалось открыть журнал урока.")} className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90">
                                        Открыть журнал
                                    </button>
                                    <Link href="/teacher/schedule" className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-black/5">
                                        Открыть расписание
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Опубликованных уроков на неделю пока нет.</p>
                        )}
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Что важно сейчас</h2>
                        <div className="space-y-3">
                            <div className="rounded-2xl border border-border/60 bg-white/50 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Открытых задач</p>
                                <p className="mt-2 text-2xl font-sora font-bold text-foreground">{dashboard?.focusBoard.openTaskCount ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-white/50 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Срочных задач</p>
                                <p className="mt-2 text-2xl font-sora font-bold text-orange-700">{dashboard?.focusBoard.urgentTaskCount ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-white/50 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Недавние действия</p>
                                <p className="mt-2 text-sm font-semibold text-foreground">
                                    {dashboard?.recentActions[0]?.title ?? "Пока без новых действий"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Последние сообщения</h2>
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
                            {(dashboard?.adminMessages.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Сообщений пока нет.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
