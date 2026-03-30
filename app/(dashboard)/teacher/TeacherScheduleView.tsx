"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, CheckCircle2, Clock3, MapPin, UserSquare2 } from "lucide-react";
import { TeacherDashboardPayload } from "./types";
import { useTeacherOperations } from "./useTeacherOperations";

function getToneClasses(tone: string) {
    if (tone === "amber") return "border-orange-200 bg-orange-100 text-orange-700";
    if (tone === "blue") return "border-blue-200 bg-blue-100 text-blue-700";
    return "border-green-200 bg-green-100 text-green-700";
}

function getCurrentSchoolDay() {
    const day = new Date().getDay();
    if (day === 0) return 1;
    if (day === 6) return 5;
    return day;
}

export function TeacherScheduleView({ dashboard }: { dashboard: TeacherDashboardPayload | null }) {
    const { status, communication } = useTeacherOperations("Полная сетка недели открыта. Здесь удобнее работать с уроками и заменами.");
    const initialDay = dashboard?.scheduleDays.find((day) => day.dayOfWeek === getCurrentSchoolDay())?.dayOfWeek
        ?? dashboard?.scheduleDays[0]?.dayOfWeek
        ?? null;
    const [selectedDay, setSelectedDay] = useState<number | null>(initialDay);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

    const currentDay = dashboard?.scheduleDays.find((day) => day.dayOfWeek === selectedDay)
        ?? dashboard?.scheduleDays.find((day) => day.dayOfWeek === initialDay)
        ?? dashboard?.scheduleDays[0]
        ?? null;

    const selectedLesson = currentDay?.slots.find((slot) => slot.id === selectedLessonId) ?? currentDay?.slots[0] ?? null;

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Расписание учителя</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        {dashboard?.scheduleMeta.weekLabel ?? "Неделя пока не опубликована"} • уроков: {dashboard?.scheduleMeta.totalLessons ?? 0}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/teacher" className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-black/5">
                        Назад в кабинет
                    </Link>
                    <Link href="/teacher/workbench" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                        Рабочий центр
                    </Link>
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-foreground">{status}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-6">
                <div className="liquid-glass p-6 rounded-[2rem]">
                    <div className="flex items-center justify-between gap-3 mb-5">
                        <div>
                            <h2 className="text-lg font-sora font-bold text-foreground">Неделя по дням</h2>
                            <p className="text-sm text-muted-foreground mt-1">Выбирай день и работай с уроками без перегруза главной страницы.</p>
                        </div>
                        <CalendarDays className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-5">
                        {dashboard?.scheduleDays.map((day) => (
                            <button
                                key={day.dayOfWeek}
                                onClick={() => {
                                    setSelectedDay(day.dayOfWeek);
                                    setSelectedLessonId(day.slots[0]?.id ?? null);
                                }}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${selectedDay === day.dayOfWeek ? "bg-primary text-white" : "bg-black/5 text-muted-foreground hover:bg-black/10"}`}
                            >
                                {day.shortLabel}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {currentDay?.slots.map((slot) => (
                            <button
                                key={slot.id}
                                onClick={() => setSelectedLessonId(slot.id)}
                                className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedLesson?.id === slot.id ? "border-primary bg-primary/5" : slot.isReplacement ? "border-orange-200 bg-orange-50/70" : "border-border/60 bg-white/50 hover:border-primary/30"}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${selectedLesson?.id === slot.id ? "bg-primary text-white" : "bg-black/5 text-foreground"}`}>
                                            {slot.slotIndex}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-base font-semibold text-foreground">{slot.title}</p>
                                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getToneClasses(slot.statusTone)}`}>
                                                    {slot.statusLabel}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                                <span className="inline-flex items-center gap-1.5"><Clock3 className="w-4 h-4" />{slot.time}</span>
                                                <span className="inline-flex items-center gap-1.5"><UserSquare2 className="w-4 h-4" />{slot.className}</span>
                                                <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{slot.room}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {slot.durationSlots > 1 && <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">Пара x{slot.durationSlots}</span>}
                                </div>
                            </button>
                        ))}
                        {(currentDay?.slots.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Для выбранного дня уроков нет.</p>}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Карточка урока</h2>
                        </div>
                        {selectedLesson ? (
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                    <p className="text-lg font-sora font-bold text-foreground">{selectedLesson.title}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{currentDay?.dayLabel} • {selectedLesson.time}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-black/5 p-4">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Класс</p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">{selectedLesson.className}</p>
                                    </div>
                                    <div className="rounded-2xl bg-black/5 p-4">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Кабинет</p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">{selectedLesson.room}</p>
                                    </div>
                                </div>
                                <div className="rounded-2xl bg-white/70 p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Статус</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedLesson.statusLabel}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => void communication(`open-journal:${selectedLesson.id}`, "Не удалось открыть журнал урока.")} className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90">
                                        Открыть журнал
                                    </button>
                                    <button onClick={() => void communication(`mark-attendance:${selectedLesson.id}`, "Не удалось открыть посещаемость.")} className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-black/5">
                                        Посещаемость
                                    </button>
                                    <button onClick={() => void communication(`assign-homework:${selectedLesson.className}`, "Не удалось открыть ДЗ.")} className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-black/5">
                                        Задать ДЗ
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Выберите урок слева, чтобы открыть подробности.</p>
                        )}
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Замены и перестройка</h2>
                        <div className="space-y-3">
                            {dashboard?.replacementLessons.map((lesson) => (
                                <div key={lesson.id} className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
                                    <p className="text-sm font-semibold text-foreground">{lesson.title}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{lesson.time} • {lesson.className} • {lesson.room}</p>
                                </div>
                            ))}
                            {(dashboard?.replacementLessons.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">На этой неделе замены для вас не назначены.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
