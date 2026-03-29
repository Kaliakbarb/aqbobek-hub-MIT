"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Users, AlertOctagon, TrendingDown, CheckSquare,
    FileText, ArrowUpRight, Sparkles, UserX, Activity, CheckCircle2, BellRing,
} from "lucide-react";

type TeacherDashboardPayload = {
    teacher: {
        fullName: string;
        subtitle: string;
    };
    adminMessages: Array<{ id: string; audience: string; text: string }>;
    stats: {
        totalStudents: number;
        avgGrade: number;
        riskCount: number;
        absences: number;
    };
    aiSummary: string;
    students: Array<{ id: string; name: string; class: string; drop: string; reason: string; risk: string }>;
    tasks: Array<{ id: string; title: string; note: string | null; done: boolean; urgent: boolean }>;
};

export default function TeacherDashboard() {
    const [dashboard, setDashboard] = useState<TeacherDashboardPayload | null>(null);
    const [status, setStatus] = useState("Загружаем кабинет учителя и аналитику классов.");
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const response = await fetch("/api/teacher/dashboard");
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Не удалось загрузить кабинет учителя.");
            setDashboard(data.dashboard);
            setStatus("Данные учителя синхронизированы с базой. Журнал и риски обновлены.");
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось загрузить кабинет учителя.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const riskCount = useMemo(() => dashboard?.students.filter((student) => student.risk === "Высокий").length ?? 0, [dashboard]);

    const runAction = async (url: string, options?: RequestInit) => {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Не удалось выполнить действие.");
        if (data?.message) setStatus(data.message);
        await load();
        return data;
    };

    const toggleTask = async (id: string, done: boolean) => {
        try {
            await runAction(`/api/teacher/tasks/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ done: !done }),
            });
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось обновить задачу.");
        }
    };

    const report = async () => {
        try {
            await runAction("/api/teacher/reports", { method: "POST" });
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось сформировать отчет.");
        }
    };

    const communication = async (action: string, fallback: string) => {
        try {
            await runAction("/api/teacher/communications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
        } catch (error) {
            setStatus(error instanceof Error ? error.message : fallback);
        }
    };

    const dashboardData = dashboard;

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Кабинет учителя</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">{dashboardData?.teacher.subtitle ?? "Загружаем назначенные предметы и классы..."}</p>
                </div>
                <button onClick={() => void report()} className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm">
                    <FileText className="w-4 h-4" />
                    Сгенерировать отчет
                </button>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-foreground">{status}</p>
            </div>

            {(dashboardData?.adminMessages?.length ?? 0) > 0 && (
                <div className="liquid-glass rounded-[2rem] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <BellRing className="w-5 h-5 text-primary" />
                        <h2 className="font-sora text-lg font-bold text-foreground">Сообщения администрации</h2>
                    </div>
                    <div className="space-y-3">
                        {dashboardData?.adminMessages.slice(0, 3).map((message) => (
                            <button
                                key={message.id}
                                onClick={() => void communication(`broadcast:${message.id}`, `Открыто сообщение администрации: ${message.text}`)}
                                className="w-full rounded-2xl border border-border bg-white/60 p-4 text-left hover:border-primary/30"
                            >
                                <p className="text-sm font-semibold text-foreground">{message.text}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Аудитория: {message.audience}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-3">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Всего учеников</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{dashboardData?.stats.totalStudents ?? 0}</p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 mb-3">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Средний балл классов</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{dashboardData?.stats.avgGrade.toFixed(1) ?? "0.0"}</p>
                </div>

                <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <AlertOctagon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">Внимание</span>
                    </div>
                    <h3 className="text-sm text-orange-900/60 font-medium mb-1">В зоне риска (СОЧ)</h3>
                    <p className="text-2xl font-sora font-bold text-orange-700">{riskCount} ученика</p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 mb-3">
                        <UserX className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Пропуски (неделя)</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{dashboardData?.stats.absences ?? 0}<span className="text-sm font-medium"> чел/часов</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-[#f8f5ff] to-white border border-primary/20 p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none">
                            <Activity className="w-64 h-64 text-primary" />
                        </div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Сводка AI-Аналитика</h2>
                        </div>
                        <div className="relative z-10 bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50">
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium">{dashboardData?.aiSummary ?? "Готовим аналитику..."}</p>
                            <div className="mt-4 flex gap-3">
                                <button onClick={() => void communication("generate-test", "Не удалось создать тест.")} className="text-xs font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90">
                                    Сгенерировать тест (10 мин)
                                </button>
                                <button onClick={() => void communication("notify-parents", "Не удалось подготовить уведомление.")} className="text-xs font-semibold bg-white border border-border text-foreground px-4 py-2 rounded-xl hover:bg-black/5">
                                    Уведомить родителей 10 &quot;Б&quot;
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-1">Система раннего предупреждения</h2>
                        <p className="text-sm text-muted-foreground mb-5">Студенты с высоким риском неуспеваемости по прогнозам ИИ</p>

                        <div className="space-y-4">
                            {dashboardData?.students.map((student) => (
                                <div key={student.id} className="bg-white/40 border border-border/60 p-4 rounded-2xl flex items-center justify-between hover:border-orange-300 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                                            {student.name[0]}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h4 className="font-bold text-foreground">{student.name}</h4>
                                                <span className="text-xs px-2 py-0.5 rounded border border-border bg-black/5 font-medium">{student.class}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${student.risk === "Высокий" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                                                    {student.risk} риск
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{student.reason}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <span className="flex items-center gap-1 text-sm font-bold text-red-600">
                                            <TrendingDown className="w-4 h-4" /> {student.drop}
                                        </span>
                                        <button onClick={() => void communication(`review-student:${student.name}`, `Открыта карточка ученика: ${student.name}.`)} className="text-xs font-semibold text-primary hover:underline">Подробнее</button>
                                    </div>
                                </div>
                            ))}
                            {!loading && (dashboardData?.students.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Нет активных учеников в зоне риска.</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Журнал и Задачи</h2>
                        <ul className="space-y-3">
                            {dashboardData?.tasks.map((task) => (
                                <li
                                    key={task.id}
                                    onClick={() => void toggleTask(task.id, task.done)}
                                    className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 ${task.urgent ? "bg-red-50 border border-red-100 hover:bg-red-100/50" : "bg-white/50 border border-border/50 hover:border-primary/30"} ${task.done ? "opacity-60" : ""}`}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-foreground mb-1">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">{task.note}</p>
                                    </div>
                                    {task.done ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                                </li>
                            ))}
                            {!loading && (dashboardData?.tasks.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Задач пока нет.</p>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
