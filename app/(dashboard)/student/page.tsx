"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
    TrendingUp, TrendingDown, BookOpen, AlertTriangle,
    Target, GraduationCap, Award, Calendar, Lightbulb, ChevronRight, Activity, Sparkles, CheckCircle2
} from "lucide-react";

const subjects = [
    { name: "Алгебра", grade: "98%", trend: "up", progress: 98, color: "bg-green-500" },
    { name: "Геометрия", grade: "92%", trend: "up", progress: 92, color: "bg-blue-500" },
    { name: "Физика", grade: "74%", trend: "down", progress: 74, color: "bg-orange-500" },
    { name: "История Казахстана", grade: "88%", trend: "up", progress: 88, color: "bg-primary" },
];

const lessons = [
    { time: "08:30 - 09:15", title: "Алгебра", room: "Каб. 302" },
    { time: "09:25 - 10:10", title: "Физика (СОР)", room: "Каб. 210", highlight: true },
    { time: "10:30 - 11:15", title: "Английский язык", room: "Каб. 105" },
    { time: "11:25 - 12:10", title: "Биология", room: "Каб. 401" },
];

export default function StudentDashboard() {
    const [message, setMessage] = useState("Нажми на действие, и я покажу результат прямо в интерфейсе.");
    const [completedTasks, setCompletedTasks] = useState(0);

    const markAction = (text: string, delta = 0) => {
        setMessage(text);
        setCompletedTasks((current) => current + delta);
    };

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Привет, Тимур! 👋</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Твоя успеваемость за 3 четверть, 10 "А" класс</p>
                </div>
                <div className="liquid-glass px-4 py-2 flex items-center gap-3 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-sm">
                        <Award className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Рейтинг</p>
                        <p className="text-sm font-sora font-bold">4 место из 120</p>
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
                    <p className="text-3xl font-sora font-bold text-foreground">4.8 <span className="text-lg text-muted-foreground">/ 5.0</span></p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary-accent/20 flex items-center justify-center text-blue-600">
                            <BookOpen className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Выполнено ДЗ (за месяц)</h3>
                    <p className="text-3xl font-sora font-bold text-foreground">94<span className="text-lg text-muted-foreground">%</span></p>
                    <div className="w-full bg-border rounded-full h-1.5 mt-3">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "94%" }}></div>
                    </div>
                </div>

                <div className="liquid-glass p-5 rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-highlight/20 flex items-center justify-center text-highlight">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Ближайшая цель</h3>
                    <p className="text-lg font-sora font-bold text-foreground leading-tight">Сдать СОЧ по физике на 90+ баллов</p>
                    <p className="text-xs text-muted-foreground mt-2 font-medium">Осталось 4 дня</p>
                </div>
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
                            <div className="bg-white/60 backdrop-blur-md border border-orange-200 rounded-2xl p-4 flex gap-4 items-start">
                                <div className="mt-1 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground mb-1">Зона риска: Физика (СОЧ)</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                        С вероятностью <span className="font-bold text-orange-600">82%</span> ты можешь написать следующий СОЧ ниже своей нормы из-за недавних пробелов в теме <span className="font-semibold text-foreground">«Электрическое поле»</span>.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => markAction("Видеоурок добавлен в твой план на вечер. Напоминание придет за 20 минут до начала.", 1)}
                                            className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90"
                                        >
                                            Смотреть видеоурок (12 мин)
                                        </button>
                                        <button
                                            onClick={() => markAction("2 адаптивные задачи открыты. После решения обновится прогноз по физике.", 1)}
                                            className="text-xs font-semibold bg-white border border-border text-foreground px-3 py-1.5 rounded-lg hover:bg-black/5"
                                        >
                                            Пройти 2 задачи
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-md border border-green-200 rounded-2xl p-4 flex gap-4 items-start">
                                <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                    <Lightbulb className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground mb-1">Сильная динамика: Алгебра</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Отличная работа над логарифмами! Ты решил 15 задач подряд без ошибок. Так держать, ты готов к олимпиаде.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-5">Успеваемость по предметам</h2>
                        <div className="space-y-4">
                            {subjects.map((subject) => (
                                <button
                                    key={subject.name}
                                    onClick={() => markAction(`Открыт подробный прогресс по предмету «${subject.name}».`, 0)}
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
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-sora font-bold text-foreground">Завтра, 14 Марта</h2>
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                        </div>

                        <div className="relative border-l-2 border-border ml-2 pl-4 space-y-6">
                            {lessons.map((lesson, i) => (
                                <button
                                    key={i}
                                    onClick={() => markAction(`Открыт урок «${lesson.title}». Кабинет: ${lesson.room}.`, 0)}
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
                        </div>
                        <Link href="/admin/schedule" className="w-full mt-6 text-sm font-semibold text-primary flex items-center justify-center gap-1 hover:text-primary/80 transition-colors">
                            Полное расписание <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Школьные события</h2>
                        <div className="space-y-3">
                            <Link href="/news" className="block p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                                <p className="text-xs font-bold text-primary mb-1">15 Марта</p>
                                <p className="text-sm font-semibold text-foreground">Городская олимпиада по математике</p>
                            </Link>
                            <Link href="/news" className="block p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                                <p className="text-xs font-bold text-secondary-accent mb-1">18 Марта</p>
                                <p className="text-sm font-semibold text-foreground">Открытый урок по робототехнике</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
