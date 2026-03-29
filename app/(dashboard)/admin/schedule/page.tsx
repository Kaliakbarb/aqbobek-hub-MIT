"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Wand2, Calendar as CalendarIcon,
    CheckCircle2, Users, RefreshCw,
} from "lucide-react";

type ScheduleClass = {
    id: string;
    name: string;
    slots: Array<{ id: string; time: string; subject: string; teacher: string; room: string; split?: boolean }>;
};

type SchedulePayload = {
    plan: { id: string; status: "draft" | "published"; published: boolean } | null;
    classes: ScheduleClass[];
    conflicts: Array<{ id: string; title: string; description: string; severity: string; resolved: boolean }>;
    quality: {
        overall_quality_score: number;
        quality_band_label: "low" | "medium" | "high";
        quality_band_label_ru: string;
        interpretation_ru: string;
        recommendation: string;
        metrics: {
            room_conflict_count: number;
            teacher_conflict_count: number;
            class_conflict_count: number;
            avg_teacher_gaps_per_week: number;
            schedule_balance_score: number;
            substitution_resilience_score: number;
        };
    } | null;
    substituteMatch: {
        absentTeacher: { teacherId: string; teacherName: string };
        lesson: { slotId: string; subjectName: string; className: string; timeLabel: string; room: string };
        candidates: Array<{
            candidate_teacher_id: string;
            teacherName: string;
            candidate_subject_specialization: string;
            candidate_secondary_specialization: string | null;
            predicted_substitute_fit_score: number;
            fit_label: "low" | "medium" | "high";
            fit_label_ru: string;
            explanation_ru: string;
            availability: boolean;
        }>;
    } | null;
};

export default function SmartSchedule() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [schedule, setSchedule] = useState<SchedulePayload | null>(null);
    const [selectedClass, setSelectedClass] = useState<string>("10 А");
    const [published, setPublished] = useState(false);

    const load = useCallback(async () => {
        const response = await fetch("/api/admin/schedule");
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Не удалось загрузить расписание.");
        setSchedule(data.schedule);
        setGenerated(Boolean(data.schedule.plan));
        setPublished(Boolean(data.schedule.plan?.published));
        if (data.schedule.classes.length > 0 && !data.schedule.classes.some((item: ScheduleClass) => item.name === selectedClass)) {
            setSelectedClass(data.schedule.classes[0].name);
        }
    }, [selectedClass]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleGenerate = async () => {
        setPublished(false);
        setIsGenerating(true);
        setTimeout(async () => {
            try {
                const response = await fetch("/api/admin/schedule/generate", { method: "POST" });
                const data = await response.json();
                if (!response.ok) throw new Error(data?.error || "Не удалось сгенерировать расписание.");
                await load();
            } finally {
                setIsGenerating(false);
                setGenerated(true);
            }
        }, 1800);
    };

    const publishSchedule = async () => {
        if (!schedule?.plan?.id) return;
        const response = await fetch("/api/admin/schedule/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId: schedule.plan.id }),
        });
        await response.json();
        if (response.ok) {
            setPublished(true);
            await load();
        }
    };

    const selectedSchedule = useMemo(
        () => schedule?.classes.find((item) => item.name === selectedClass)?.slots ?? [],
        [schedule, selectedClass],
    );
    const quality = schedule?.quality ?? null;
    const substituteMatch = schedule?.substituteMatch ?? null;
    const qualityTone = quality?.quality_band_label === "high"
        ? "text-green-700 bg-green-500/10 border-green-200"
        : quality?.quality_band_label === "medium"
            ? "text-amber-700 bg-amber-500/10 border-amber-200"
            : "text-red-700 bg-red-500/10 border-red-200";

    return (
        <div className="space-y-6 animate-fadeUp h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shadow-sm pb-4 border-b border-border">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Умное расписание</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Генерация и публикация расписания через базу данных</p>
                </div>
                <button
                    onClick={() => void handleGenerate()}
                    disabled={isGenerating}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm ${isGenerating ? "bg-muted text-muted-foreground cursor-not-allowed" : generated ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5"}`}
                >
                    {isGenerating ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Вычисляем матрицу...</>
                    ) : generated ? (
                        <><CheckCircle2 className="w-4 h-4" /> Оптимально сгенерировано</>
                    ) : (
                        <><Wand2 className="w-4 h-4" /> Сгенерировать расписание</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="font-sora font-bold text-foreground">Вводные данные</h2>

                    <div className="liquid-glass p-4 rounded-2xl bg-white/50 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Преподаватели</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-black/5 rounded-lg border border-border">
                                <span>Доступно:</span> <span className="text-green-600 font-bold">82/84</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-orange-50 rounded-lg border border-orange-100 text-orange-800">
                                <span>Отсутствуют:</span> <span>2 (Больничный)</span>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass p-4 rounded-2xl bg-white/50 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Кабинетный фонд</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-black/5 rounded-lg border border-border">
                                <span>Обычные классы:</span> <span className="font-bold text-foreground">40</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-black/5 rounded-lg border border-border">
                                <span>Лаборатории:</span> <span className="font-bold text-foreground">6</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-red-50 rounded-lg border border-red-100 text-red-800">
                                <span>Недоступно:</span> <span>Спортзал 2 (Ремонт)</span>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass p-4 rounded-2xl bg-white/50 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ленты (Группы)</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-blue-50/50 rounded-lg border border-blue-100 text-blue-900 justify-start gap-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span>Английский: 10кл (3 группы)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 liquid-glass rounded-[2rem] p-6 flex flex-col relative overflow-hidden">
                    {!generated && !isGenerating && (
                        <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="bg-white/90 p-6 rounded-2xl shadow-xl border border-primary/20 text-center max-w-sm">
                                <Wand2 className="w-10 h-10 text-primary mx-auto mb-3 opacity-50" />
                                <h3 className="font-sora font-bold text-lg text-foreground mb-2">Нажмите «Сгенерировать»</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">Система создаст новый черновик расписания и сохранит его в SQLite.</p>
                            </div>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
                                <p className="font-sora font-semibold text-lg text-primary">Оптимизация графа расписания...</p>
                                <div className="text-xs text-muted-foreground font-mono bg-black/5 p-3 rounded-lg text-left max-w-xs mx-auto">
                                    &gt; resolving node overlap...<br />
                                    &gt; placing English_group_3...<br />
                                    &gt; mitigating PE_Hall clash...<br />
                                    &gt; persisting schedule draft...
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-sora font-bold text-foreground">Сетка: {selectedClass} (Понедельник)</h2>
                        <div className="flex gap-2">
                            {schedule?.classes.map((classItem) => (
                                <button
                                    key={classItem.id}
                                    onClick={() => setSelectedClass(classItem.name)}
                                    className={`text-xs font-bold px-3 py-1 rounded-lg ${selectedClass === classItem.name ? "bg-black/5 text-foreground" : "bg-transparent border border-border text-muted-foreground"}`}
                                >
                                    {classItem.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto pr-2">
                        <div className="space-y-3 min-w-[400px]">
                            {selectedSchedule.map((slot) => (
                                <div key={slot.id} className={`p-4 rounded-xl border ${slot.split ? "bg-blue-50/50 border-blue-200" : "bg-white/60 border-border/50"} flex items-center transition-all ${generated ? "opacity-100" : "opacity-30 blur-sm"}`}>
                                    <div className="w-32 shrink-0">
                                        <span className="text-xs font-bold text-muted-foreground">{slot.time}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-foreground">{slot.subject}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{slot.teacher}</p>
                                    </div>
                                    <div className="w-24 text-right">
                                        <span className="text-xs font-semibold px-2 py-1 bg-black/5 rounded-md text-foreground">{slot.room}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <h2 className="font-sora font-bold text-foreground">Анализ коллизий</h2>

                    <div className="liquid-glass p-5 rounded-2xl bg-white/50 border border-primary/10">
                        {generated ? (
                            <div className="space-y-4">
                                {quality && (
                                    <>
                                        <div className={`rounded-2xl border p-4 ${qualityTone}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider opacity-80">Schedule Quality Predictor</p>
                                                    <h3 className="text-3xl font-sora font-bold mt-2">{quality.overall_quality_score}</h3>
                                                </div>
                                                <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold">
                                                    {quality.quality_band_label_ru}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-3 leading-relaxed">{quality.interpretation_ru}</p>
                                            <p className="text-xs mt-3 font-medium opacity-90">{quality.recommendation}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-xl border border-border bg-black/5 p-3">
                                                <p className="text-muted-foreground">Баланс</p>
                                                <p className="font-bold text-foreground mt-1">{Math.round(quality.metrics.schedule_balance_score * 100)}%</p>
                                            </div>
                                            <div className="rounded-xl border border-border bg-black/5 p-3">
                                                <p className="text-muted-foreground">Устойчивость</p>
                                                <p className="font-bold text-foreground mt-1">{Math.round(quality.metrics.substitution_resilience_score * 100)}%</p>
                                            </div>
                                            <div className="rounded-xl border border-border bg-black/5 p-3">
                                                <p className="text-muted-foreground">Окна учителей</p>
                                                <p className="font-bold text-foreground mt-1">{quality.metrics.avg_teacher_gaps_per_week}</p>
                                            </div>
                                            <div className="rounded-xl border border-border bg-black/5 p-3">
                                                <p className="text-muted-foreground">Конфликты</p>
                                                <p className="font-bold text-foreground mt-1">
                                                    {quality.metrics.room_conflict_count + quality.metrics.teacher_conflict_count + quality.metrics.class_conflict_count}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                    <p className="text-sm font-medium text-green-900 leading-snug">
                                        {schedule?.conflicts.every((item) => item.resolved) ? "0 накладок. Все классы укомплектованы на 100%." : "Обнаружены активные коллизии."}
                                    </p>
                                </div>

                                <div className="h-[1px] w-full bg-border"></div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase">Решенные проблемы:</h4>
                                    {schedule?.conflicts.map((item) => (
                                        <div key={item.id} className={`${item.severity === "medium" ? "bg-orange-50 border-orange-100 text-orange-800" : "bg-blue-50 border-blue-100 text-blue-900"} border p-2 rounded-lg text-xs flex flex-col gap-1`}>
                                            <span className="font-bold">{item.title}</span>
                                            <span>{item.description}</span>
                                        </div>
                                    ))}
                                </div>

                                {substituteMatch && (
                                    <>
                                        <div className="h-[1px] w-full bg-border"></div>

                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase">Smart Substitute Teacher Matcher</h4>
                                            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-950">
                                                <p className="font-bold">Отсутствует: {substituteMatch.absentTeacher.teacherName}</p>
                                                <p className="mt-1">
                                                    Нужно заменить урок {substituteMatch.lesson.subjectName} у {substituteMatch.lesson.className}
                                                    {" "}в {substituteMatch.lesson.timeLabel}, кабинет {substituteMatch.lesson.room}.
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                {substituteMatch.candidates.map((candidate) => (
                                                    <div key={candidate.candidate_teacher_id} className="rounded-xl border border-border bg-white/70 p-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-foreground">{candidate.teacherName}</p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {candidate.candidate_subject_specialization}
                                                                    {candidate.candidate_secondary_specialization ? ` • ${candidate.candidate_secondary_specialization}` : ""}
                                                                </p>
                                                            </div>
                                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                                candidate.fit_label === "high"
                                                                    ? "bg-green-500/10 text-green-700"
                                                                    : candidate.fit_label === "medium"
                                                                        ? "bg-amber-500/10 text-amber-700"
                                                                        : "bg-red-500/10 text-red-700"
                                                            }`}>
                                                                {candidate.fit_label_ru}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                                            <span className="rounded-full bg-black/5 px-2 py-1">
                                                                fit {Math.round(candidate.predicted_substitute_fit_score * 100)}%
                                                            </span>
                                                            <span className={`rounded-full px-2 py-1 ${candidate.availability ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"}`}>
                                                                {candidate.availability ? "свободен" : "занят"}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{candidate.explanation_ru}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <button
                                    onClick={() => void publishSchedule()}
                                    className={`w-full py-2 rounded-xl text-xs font-bold transition-colors mt-2 ${published ? "bg-green-500 text-white" : quality?.quality_band_label === "low" ? "bg-red-500 text-white hover:bg-red-600" : "bg-black/5 hover:bg-black/10 text-foreground"}`}
                                >
                                    {published ? "Опубликовано для всех ролей" : quality?.quality_band_label === "low" ? "Лучше пересобрать расписание" : "Опубликовать для всех"}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium opacity-50 flex-col py-6 text-center">
                                <CalendarIcon className="w-8 h-8" />
                                <span>Отчет появится после генерации</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
