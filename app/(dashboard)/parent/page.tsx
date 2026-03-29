"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
    HeartPulse, Sparkles, AlertCircle, Calendar,
    Award, CheckCircle2, XCircle,
} from "lucide-react";

type ParentDashboardPayload = {
    parent: { fullName: string };
    child: { fullName: string; className: string; gpa: number; absences: number };
    grades: Array<{ id: string; name: string; grade: string; type: string; status: string }>;
    aiSummary: string;
    recommendation: string;
    news: Array<{ id: string; title: string; desc: string; date: string }>;
};

export default function ParentDashboard() {
    const [dashboard, setDashboard] = useState<ParentDashboardPayload | null>(null);
    const [note, setNote] = useState("Загружаем обзор успеваемости ребенка.");

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch("/api/parent/dashboard");
                const data = await response.json();
                if (!response.ok) throw new Error(data?.error || "Не удалось загрузить кабинет родителя.");
                setDashboard(data.dashboard);
                setNote("Данные родителя и ребенка синхронизированы с базой.");
            } catch (error) {
                setNote(error instanceof Error ? error.message : "Не удалось загрузить кабинет родителя.");
            }
        };

        void load();
    }, []);

    const child = dashboard?.child;
    const grades = dashboard?.grades ?? [];

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Кабинет родителя</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        {child ? `Обзор успеваемости: ${child.fullName} (${child.className} класс)` : "Загружаем привязанного ученика..."}
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {child?.fullName?.slice(0, 1) ?? "?"}
                    </div>
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-foreground">{note}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-[#f8f5ff] to-white border border-primary/20 p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <HeartPulse className="w-48 h-48 text-primary" />
                        </div>
                        <div className="flex items-center gap-3 mb-5 relative z-10">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Сводка за неделю от ИИ-Наставника</h2>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <p className="text-sm font-medium text-foreground/80 leading-relaxed bg-white/60 p-4 rounded-xl border border-white/50">
                                {dashboard?.aiSummary ?? "Готовим персональную сводку за неделю..."}
                            </p>

                            <button
                                onClick={() => setNote(`Рекомендация сохранена: ${dashboard?.recommendation ?? "обсудить прогресс и режим подготовки."}`)}
                                className="w-full bg-white/60 border border-border/50 rounded-xl p-4 text-left hover:border-primary/30"
                            >
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Рекомендация для вас:</h4>
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                        {dashboard?.recommendation ?? "Рекомендация будет доступна после загрузки аналитики."}
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-sora font-bold text-foreground">Оценки за неделю</h2>
                            <button onClick={() => setNote("Открыта расширенная история оценок за последние недели.")} className="text-xs font-semibold text-primary">Подробнее</button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {grades.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setNote(`Открыта карточка: ${item.name} • ${item.type} • результат ${item.grade}.`)}
                                    className="bg-black/5 p-4 rounded-2xl flex flex-col justify-between text-left"
                                >
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{item.type}</span>
                                        <p className="text-sm font-semibold text-foreground mt-1">{item.name}</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className={`text-2xl font-sora font-bold ${item.status === "bad" ? "text-red-500" : item.status === "good" ? "text-green-500" : "text-blue-500"}`}>{item.grade}</span>
                                        {item.status === "good" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                        {item.status === "bad" && <XCircle className="w-5 h-5 text-red-500" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="liquid-glass p-5 rounded-2xl">
                            <p className="text-xs text-muted-foreground font-semibold mb-1">Средний балл</p>
                            <p className="text-2xl font-sora font-bold">{child?.gpa.toFixed(1) ?? "0.0"}</p>
                        </div>
                        <div className="liquid-glass p-5 rounded-2xl bg-orange-50/50 border-orange-100">
                            <p className="text-xs text-orange-800/60 font-semibold mb-1">Пропуски</p>
                            <p className="text-2xl font-sora font-bold text-orange-700">{child?.absences ?? 0}<span className="text-sm font-medium"> ур.</span></p>
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Объявления школы</h2>
                        <div className="space-y-4">
                            {dashboard?.news.map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={() => setNote(`Открыта новость: ${item.title}.`)}
                                    className="w-full bg-white/50 p-4 rounded-xl border border-border flex items-start gap-3 text-left"
                                >
                                    {index === 0 ? <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" /> : <Award className="w-5 h-5 text-secondary-accent shrink-0 mt-0.5" />}
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <Link href="/news" className="w-full mt-4 text-sm font-semibold text-primary flex items-center justify-center gap-1 hover:underline">
                            Все новости
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
