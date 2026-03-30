"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Filter, TrendingDown, Users } from "lucide-react";
import { TeacherDashboardPayload } from "./types";
import { useTeacherOperations } from "./useTeacherOperations";

type RiskFilter = "all" | "high";

export function TeacherClassesView({ dashboard }: { dashboard: TeacherDashboardPayload | null }) {
    const { status, communication } = useTeacherOperations("Раздел классов открыт. Здесь проще работать по группам и ученикам риска.");
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

    const filteredClasses = useMemo(() => {
        const classes = dashboard?.classSummaries ?? [];
        if (selectedClass === "all") return classes;
        return classes.filter((item) => item.name === selectedClass);
    }, [dashboard, selectedClass]);

    const filteredStudents = useMemo(() => {
        const students = dashboard?.students ?? [];
        return students.filter((student) => {
            if (selectedClass !== "all" && student.class !== selectedClass) return false;
            if (riskFilter === "high" && student.risk !== "Высокий") return false;
            return true;
        });
    }, [dashboard, riskFilter, selectedClass]);

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Классы и ученики</h1>
                    <p className="text-sm text-muted-foreground mt-2">Работа по группам, сообщения классам и фокус на учениках риска.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/teacher" className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-black/5">
                        Назад в кабинет
                    </Link>
                    <Link href="/teacher/workbench" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                        Открыть рабочий центр
                    </Link>
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-foreground">{status}</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-white/60 px-3 py-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} className="bg-transparent text-sm font-semibold text-foreground outline-none">
                        <option value="all">Все классы</option>
                        {dashboard?.classSummaries.map((item) => (
                            <option key={item.id} value={item.name}>{item.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setRiskFilter("all")} className={`rounded-xl px-4 py-2 text-xs font-semibold ${riskFilter === "all" ? "bg-primary text-white" : "bg-black/5 text-muted-foreground hover:bg-black/10"}`}>
                        Все ученики риска
                    </button>
                    <button onClick={() => setRiskFilter("high")} className={`rounded-xl px-4 py-2 text-xs font-semibold ${riskFilter === "high" ? "bg-primary text-white" : "bg-black/5 text-muted-foreground hover:bg-black/10"}`}>
                        Только высокий риск
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
                <div className="liquid-glass p-6 rounded-[2rem]">
                    <div className="flex items-center gap-2 mb-5">
                        <Users className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-sora font-bold text-foreground">Классы под вашим контуром</h2>
                    </div>
                    <div className="space-y-4">
                        {filteredClasses.map((item) => (
                            <div key={item.id} className="rounded-[1.5rem] border border-border/60 bg-white/50 p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-lg font-sora font-bold text-foreground">{item.name}</h3>
                                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.riskCount > 0 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                                                {item.focusLabel}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">{item.subjects.join(" • ")}</p>
                                    </div>
                                    <button onClick={() => void communication(`message-class:${item.id}`, `Не удалось подготовить сообщение для ${item.name}.`)} className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-black/10">
                                        Написать классу
                                    </button>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-xl bg-black/5 px-3 py-2">
                                        <p className="text-xs text-muted-foreground">Ученики</p>
                                        <p className="mt-1 font-semibold text-foreground">{item.studentCount}</p>
                                    </div>
                                    <div className="rounded-xl bg-black/5 px-3 py-2">
                                        <p className="text-xs text-muted-foreground">Средний GPA</p>
                                        <p className="mt-1 font-semibold text-foreground">{item.avgGrade.toFixed(1)}</p>
                                    </div>
                                    <div className="rounded-xl bg-orange-50 px-3 py-2">
                                        <p className="text-xs text-orange-700/70">Риски</p>
                                        <p className="mt-1 font-semibold text-orange-700">{item.riskCount}</p>
                                    </div>
                                    <div className="rounded-xl bg-red-50 px-3 py-2">
                                        <p className="text-xs text-red-700/70">Пропуски</p>
                                        <p className="mt-1 font-semibold text-red-700">{item.absences}</p>
                                    </div>
                                </div>
                                <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Что важно сейчас</p>
                                    <p className="mt-1 text-sm text-foreground/85">{item.topRiskReason}</p>
                                </div>
                            </div>
                        ))}
                        {filteredClasses.length === 0 && <p className="text-sm text-muted-foreground">Под выбранный фильтр классов нет.</p>}
                    </div>
                </div>

                <div className="liquid-glass p-6 rounded-[2rem]">
                    <div className="flex items-center gap-2 mb-5">
                        <TrendingDown className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-sora font-bold text-foreground">Ученики в зоне внимания</h2>
                    </div>
                    <div className="space-y-4">
                        {filteredStudents.map((student) => (
                            <div key={student.id} className="rounded-2xl border border-border/60 bg-white/40 p-4">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                                            {student.name[0]}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h4 className="font-bold text-foreground">{student.name}</h4>
                                                <span className="rounded border border-border bg-black/5 px-2 py-0.5 text-xs font-medium">{student.class}</span>
                                                <span className="rounded border border-border bg-black/5 px-2 py-0.5 text-xs font-medium">{student.subject}</span>
                                                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${student.risk === "Высокий" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                                                    {student.risk} риск
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{student.reason}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-bold text-red-600">{student.drop}</span>
                                        <button onClick={() => void communication(`review-student:${student.name}`, `Не удалось открыть план по ученику ${student.name}.`)} className="text-xs font-semibold text-primary hover:underline">
                                            Подробнее и план действий
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredStudents.length === 0 && <p className="text-sm text-muted-foreground">Под выбранные фильтры учеников риска нет.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
