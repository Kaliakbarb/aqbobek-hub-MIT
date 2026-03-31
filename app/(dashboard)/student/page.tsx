"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
    TrendingUp, TrendingDown, BookOpen, AlertTriangle,
    Target, GraduationCap, Award, Calendar, Lightbulb, ChevronRight, Activity, Sparkles, CheckCircle2, BellRing,
} from "lucide-react";

type StudentDashboardPayload = {
    student: {
        fullName: string;
        firstName: string;
        className: string;
        gpa: number;
        homeworkPct: number;
        rank: number | null;
        rankTotal: number | null;
    };
    subjects: Array<{ name: string; grade: string; trend: string; progress: number; color: string }>;
    lessons: Array<{ id: string; time: string; title: string; room: string; highlight?: boolean }>;
    scheduleMeta: { weekLabel: string | null; pushAlertsEnabled: boolean; currentDayOfWeek: number; maxSlotsPerDay: number };
    scheduleDays: Array<{
        dayOfWeek: number;
        dayLabel: string;
        shortLabel: string;
        lessonCount: number;
        slots: Array<{ id: string; slotIndex: number; durationSlots: number; time: string; title: string; teacher: string; room: string; sourceType: string; isChanged: boolean; statusLabel: string; statusTone: string; homework: string; focusNote: string }>;
    }>;
    notices: Array<{ id: string; text: string; audience: string; createdAt: string }>;
    goal: { id: string; title: string; daysLeft: number | null } | null;
    insights: {
        primaryRisk: { title: string; probability: number; reason: string } | null;
        topSubject: { title: string; text: string } | null;
    };
    topicWeakness: Array<{
        subjectName: string;
        topicName: string;
        weak_topic_probability: number;
        risk_level: "strong" | "medium" | "weak";
        risk_level_ru: string;
        reason: string;
    }>;
    resourceRecommendations: Array<{
        resource_id: string;
        title_ru: string;
        subject_name: string;
        topic_name: string;
        content_type: string;
        language: string;
        estimated_minutes: number;
        predicted_relevance_score: number;
        relevance_label_ru: string;
    }>;
    news: Array<{ id: string; title: string; date: string }>;
};

export default function StudentDashboard() {
    const [dashboard, setDashboard] = useState<StudentDashboardPayload | null>(null);
    const [message, setMessage] = useState("Загружаем личную аналитику и расписание.");
    const [completedTasks, setCompletedTasks] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch("/api/student/dashboard");
                const data = await response.json();
                if (!response.ok) throw new Error(data?.error || "Не удалось загрузить кабинет ученика.");
                setDashboard(data.dashboard);
                setMessage("Данные синхронизированы с базой. Все действия сохраняются в профиле.");
            } catch (error) {
                setMessage(error instanceof Error ? error.message : "Не удалось загрузить кабинет ученика.");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    const recordAction = async (text: string, delta = 0, color = "bg-primary") => {
        setMessage(text);
        setCompletedTasks((current) => current + delta);

        try {
            await fetch("/api/student/activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: text, color }),
            });
        } catch {}
    };

    const student = dashboard?.student;
    const subjects = dashboard?.subjects ?? [];
    const lessons = dashboard?.lessons ?? [];
    const scheduleDays = dashboard?.scheduleDays ?? [];
    const notices = dashboard?.notices ?? [];
    const topicWeakness = dashboard?.topicWeakness ?? [];
    const resourceRecommendations = dashboard?.resourceRecommendations ?? [];
    const news = dashboard?.news ?? [];

    const riskTone = (level: "strong" | "medium" | "weak") => {
        if (level === "weak") {
            return {
                badge: "bg-red-500/10 text-red-700",
                progress: "bg-red-500",
                card: "border-red-200 bg-red-50/70",
            };
        }
        if (level === "medium") {
            return {
                badge: "bg-amber-500/10 text-amber-700",
                progress: "bg-amber-500",
                card: "border-amber-200 bg-amber-50/70",
            };
        }
        return {
            badge: "bg-green-500/10 text-green-700",
            progress: "bg-green-500",
            card: "border-green-200 bg-green-50/70",
        };
    };

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Привет, {student?.firstName ?? "ученик"}! 👋</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        {student ? `Твоя успеваемость, ${student.className} класс` : "Загружаем данные из базы..."}
                    </p>
                </div>
                <div className="liquid-glass px-4 py-2 flex items-center gap-3 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-sm">
                        <Award className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Рейтинг</p>
                        <p className="text-sm font-sora font-bold">
                            {student?.rank && student?.rankTotal ? `${student.rank} место из ${student.rankTotal}` : "Нет данных"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-foreground">{message}</p>
                    <p className="text-xs text-muted-foreground mt-1">Завершено действий в этой сессии: {completedTasks}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="liquid-glass p-5 rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> +0.2
                        </span>
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Средний балл (GPA)</h3>
                    <p className="text-3xl font-sora font-bold text-foreground">
                        {student ? student.gpa.toFixed(1) : "0.0"} <span className="text-lg text-muted-foreground">/ 5.0</span>
                    </p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary-accent/20 flex items-center justify-center text-blue-600">
                            <BookOpen className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Выполнено ДЗ (за месяц)</h3>
                    <p className="text-3xl font-sora font-bold text-foreground">
                        {student ? Math.round(student.homeworkPct) : 0}
                        <span className="text-lg text-muted-foreground">%</span>
                    </p>
                    <div className="w-full bg-border rounded-full h-1.5 mt-3">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${student?.homeworkPct ?? 0}%` }}></div>
                    </div>
                </div>

                <div className="liquid-glass p-5 rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-highlight/20 flex items-center justify-center text-highlight">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Ближайшая цель</h3>
                    <p className="text-lg font-sora font-bold text-foreground leading-tight">
                        {dashboard?.goal?.title ?? "Активных целей пока нет"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                        {dashboard?.goal?.daysLeft != null ? `Осталось ${dashboard.goal.daysLeft} дня` : "Можно добавить новую цель в профиле"}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Link href="/student/schedule" className="liquid-glass p-5 rounded-3xl border border-primary/10 hover:border-primary/30 transition-colors">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Быстрый переход</p>
                    <p className="mt-2 text-lg font-sora font-bold text-foreground">Полное расписание</p>
                    <p className="mt-1 text-sm text-muted-foreground">Открыть неделю по дням, слотам и изменениям.</p>
                </Link>
                <Link href="/student/homework" className="liquid-glass p-5 rounded-3xl border border-border/60 hover:border-primary/30 transition-colors">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Домашка</p>
                    <p className="mt-2 text-lg font-sora font-bold text-foreground">Сдача заданий</p>
                    <p className="mt-1 text-sm text-muted-foreground">Загрузить файл, сохранить черновик и увидеть комментарий учителя.</p>
                </Link>
                <Link href="/student/profile" className="liquid-glass p-5 rounded-3xl border border-border/60 hover:border-primary/30 transition-colors">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Портфолио</p>
                    <p className="mt-2 text-lg font-sora font-bold text-foreground">Достижения и профиль</p>
                    <p className="mt-1 text-sm text-muted-foreground">Посмотреть сильные стороны, бейджи и прогресс.</p>
                </Link>
                <Link href="/leaderboard" className="liquid-glass p-5 rounded-3xl border border-border/60 hover:border-primary/30 transition-colors">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Рейтинг</p>
                    <p className="mt-2 text-lg font-sora font-bold text-foreground">Школьный leaderboard</p>
                    <p className="mt-1 text-sm text-muted-foreground">Понять своё место в общем рейтинге и сравнить динамику.</p>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-[#f8f5ff] to-white border border-primary/20 p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Activity className="w-48 h-48 text-primary" />
                        </div>
                        <div className="flex items-center gap-3 mb-5 relative z-10">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Аналитика AI-Наставника</h2>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {dashboard?.insights.primaryRisk && (
                                <div className="bg-white/60 backdrop-blur-md border border-orange-200 rounded-2xl p-4 flex gap-4 items-start">
                                    <div className="mt-1 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground mb-1">{dashboard.insights.primaryRisk.title}</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                            С вероятностью <span className="font-bold text-orange-600">{dashboard.insights.primaryRisk.probability}%</span> следующий результат может оказаться ниже нормы.
                                            Основная причина: <span className="font-semibold text-foreground">{dashboard.insights.primaryRisk.reason}</span>.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => void recordAction("Видеоурок добавлен в твой план на вечер. Напоминание придет за 20 минут до начала.", 1, "bg-orange-500")}
                                                className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90"
                                            >
                                                Смотреть видеоурок (12 мин)
                                            </button>
                                            <button
                                                onClick={() => void recordAction("2 адаптивные задачи открыты. После решения обновится прогноз по физике.", 1, "bg-orange-500")}
                                                className="text-xs font-semibold bg-white border border-border text-foreground px-3 py-1.5 rounded-lg hover:bg-black/5"
                                            >
                                                Пройти 2 задачи
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {dashboard?.insights.topSubject && (
                                <div className="bg-white/60 backdrop-blur-md border border-green-200 rounded-2xl p-4 flex gap-4 items-start">
                                    <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                        <Lightbulb className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground mb-1">{dashboard.insights.topSubject.title}</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {dashboard.insights.topSubject.text}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-5">Успеваемость по предметам</h2>
                        <div className="space-y-4">
                            {subjects.map((subject) => (
                                <button
                                    key={subject.name}
                                    onClick={() => void recordAction(`Открыт подробный прогресс по предмету «${subject.name}».`, 0, "bg-blue-500")}
                                    className="flex w-full items-center gap-4 text-left"
                                >
                                    <div className="w-1/4">
                                        <p className="text-sm font-semibold text-foreground">{subject.name}</p>
                                    </div>
                                    <div className="flex-1">
                                        <div className="w-full bg-border rounded-full h-2">
                                            <div className={`h-2 rounded-full ${subject.color}`} style={{ width: `${subject.progress}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="w-16 text-right flex items-center justify-end gap-1">
                                        <span className="text-sm font-bold">{subject.grade}</span>
                                        {subject.trend === "up" ? (
                                            <TrendingUp className="w-3 h-3 text-green-500" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3 text-red-500" />
                                        )}
                                    </div>
                                </button>
                            ))}
                            {!loading && subjects.length === 0 && <p className="text-sm text-muted-foreground">Оценки пока не загружены.</p>}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Слабые темы по ML-модели</h2>
                                <p className="text-xs text-muted-foreground mt-1">Точечная диагностика внутри предметов для рекомендаций и повтора.</p>
                            </div>
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                        </div>

                        <div className="space-y-4">
                            {topicWeakness.map((item) => {
                                const tone = riskTone(item.risk_level);
                                return (
                                    <div key={`${item.subjectName}-${item.topicName}`} className={`rounded-2xl border p-4 ${tone.card}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.subjectName}</p>
                                                <h3 className="text-base font-semibold text-foreground mt-1">{item.topicName}</h3>
                                            </div>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tone.badge}`}>
                                                {item.risk_level_ru}
                                            </span>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
                                                <span>Вероятность слабой темы</span>
                                                <span>{Math.round(item.weak_topic_probability * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-white/80 rounded-full h-2">
                                                <div className={`h-2 rounded-full ${tone.progress}`} style={{ width: `${Math.round(item.weak_topic_probability * 100)}%` }}></div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                                            {item.reason}
                                        </p>
                                    </div>
                                );
                            })}
                            {!loading && topicWeakness.length === 0 && <p className="text-sm text-muted-foreground">Для диагностики по темам пока недостаточно данных.</p>}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Рекомендованные материалы</h2>
                                <p className="text-xs text-muted-foreground mt-1">Подборка после weak topic detection с ранжированием по relevance score.</p>
                            </div>
                            <BookOpen className="w-5 h-5 text-primary" />
                        </div>

                        <div className="space-y-3">
                            {resourceRecommendations.map((resource) => (
                                <div key={resource.resource_id} className="rounded-2xl border border-primary/10 bg-white/60 p-4 backdrop-blur-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{resource.title_ru}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {resource.subject_name} • {resource.topic_name}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                                            {resource.relevance_label_ru}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span className="rounded-full bg-black/5 px-2.5 py-1">{resource.content_type}</span>
                                        <span className="rounded-full bg-black/5 px-2.5 py-1">{resource.language}</span>
                                        <span className="rounded-full bg-black/5 px-2.5 py-1">{resource.estimated_minutes} мин</span>
                                        <span className="rounded-full bg-black/5 px-2.5 py-1">
                                            relevance {Math.round(resource.predicted_relevance_score * 100)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {!loading && resourceRecommendations.length === 0 && <p className="text-sm text-muted-foreground">Подходящие материалы пока не найдены.</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Push и изменения</h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {dashboard?.scheduleMeta.pushAlertsEnabled
                                        ? "Адресные сообщения из Broadcast и обновления расписания."
                                        : "Push в профиле выключены, но события всё равно сохранены в системе."}
                                </p>
                            </div>
                            <BellRing className="w-5 h-5 text-primary" />
                        </div>

                        <div className="space-y-3">
                            {notices.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-primary/10 bg-white/60 p-4 backdrop-blur-sm">
                                    <p className="text-sm font-semibold text-foreground">{item.text}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{item.audience} • {item.createdAt}</p>
                                </div>
                            ))}
                            {!loading && notices.length === 0 && <p className="text-sm text-muted-foreground">Новых адресных уведомлений пока нет.</p>}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Расписание на ближайшие уроки</h2>
                                <p className="text-xs text-muted-foreground mt-1">{dashboard?.scheduleMeta.weekLabel ?? "Неделя пока не опубликована"}</p>
                            </div>
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                        </div>

                        <div className="relative border-l-2 border-border ml-2 pl-4 space-y-6">
                            {lessons.map((lesson) => (
                                <button
                                    key={lesson.id}
                                    onClick={() => void recordAction(`Открыт урок «${lesson.title}». Кабинет: ${lesson.room}.`, 0, "bg-secondary-accent")}
                                    className="relative block w-full text-left"
                                >
                                    <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ${lesson.highlight ? "bg-orange-500 ring-4 ring-orange-500/20" : "bg-border"}`}></div>
                                    <p className="text-xs font-bold text-muted-foreground mb-1">{lesson.time}</p>
                                    <div className={`p-3 rounded-xl ${lesson.highlight ? "bg-orange-50 border border-orange-100" : "bg-black/5"} flex justify-between items-center`}>
                                        <p className={`text-sm font-semibold ${lesson.highlight ? "text-orange-900" : "text-foreground"}`}>{lesson.title}</p>
                                        <p className={`text-xs font-medium ${lesson.highlight ? "text-orange-700" : "text-muted-foreground"}`}>{lesson.room}</p>
                                    </div>
                                </button>
                            ))}
                            {!loading && lessons.length === 0 && <p className="text-sm text-muted-foreground">Опубликованное расписание пока отсутствует.</p>}
                        </div>
                        <Link href="/student/schedule" className="w-full mt-6 text-sm font-semibold text-primary flex items-center justify-center gap-1 hover:text-primary/80 transition-colors">
                            Открыть полное расписание <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Обзор недели</h2>
                        <div className="space-y-3">
                            {scheduleDays.map((day) => (
                                <div key={day.dayOfWeek} className="rounded-2xl border border-border/60 bg-white/50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{day.dayLabel}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{day.lessonCount} уроков</p>
                                        </div>
                                        <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                                            {day.shortLabel}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {day.slots.slice(0, 3).map((slot) => (
                                            <span
                                                key={slot.id}
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${slot.isChanged ? "bg-orange-100 text-orange-700" : "bg-black/5 text-muted-foreground"}`}
                                            >
                                                {slot.time} • {slot.title}
                                            </span>
                                        ))}
                                    </div>
                                    <Link href="/student/schedule" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80">
                                        Смотреть день полностью <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            ))}
                            {!loading && scheduleDays.length === 0 && <p className="text-sm text-muted-foreground">Понедельная сетка ещё не опубликована.</p>}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Школьные события</h2>
                        <div className="space-y-3">
                            {news.map((item) => (
                                <Link key={item.id} href="/news" className="block p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                                    <p className="text-xs font-bold text-primary mb-1">{item.date}</p>
                                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                </Link>
                            ))}
                            {!loading && news.length === 0 && <p className="text-sm text-muted-foreground">Новостей для твоего профиля пока нет.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
