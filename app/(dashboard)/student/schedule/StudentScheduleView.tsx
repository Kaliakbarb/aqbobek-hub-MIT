"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CalendarDays, Clock3, MapPin, Sparkles, UserSquare2, BookMarked, ChevronRight } from "lucide-react";

type ScheduleSlot = {
    id: string;
    slotIndex: number;
    durationSlots: number;
    time: string;
    title: string;
    teacher: string;
    room: string;
    sourceType: string;
    isChanged: boolean;
    statusLabel: string;
    statusTone: string;
    homework: string;
    focusNote: string;
};

type StudentSchedulePayload = {
    student: {
        firstName: string;
        className: string;
    };
    scheduleMeta: { weekLabel: string | null; pushAlertsEnabled: boolean; currentDayOfWeek: number; maxSlotsPerDay: number };
    scheduleDays: Array<{
        dayOfWeek: number;
        dayLabel: string;
        shortLabel: string;
        lessonCount: number;
        slots: ScheduleSlot[];
    }>;
    notices: Array<{ id: string; text: string; audience: string; createdAt: string }>;
};

function getToneClasses(tone: string) {
    if (tone === "red") return "bg-red-100 text-red-700 border-red-200";
    if (tone === "amber") return "bg-amber-100 text-amber-700 border-amber-200";
    if (tone === "blue") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-green-100 text-green-700 border-green-200";
}

export function StudentScheduleView({ dashboard }: { dashboard: StudentSchedulePayload | null }) {
    const initialDay = dashboard?.scheduleDays.find((day) => day.dayOfWeek === dashboard.scheduleMeta.currentDayOfWeek)?.dayOfWeek
        ?? dashboard?.scheduleDays[0]?.dayOfWeek
        ?? 1;
    const [selectedDay, setSelectedDay] = useState(initialDay);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

    const currentDay = useMemo(
        () => dashboard?.scheduleDays.find((day) => day.dayOfWeek === selectedDay) ?? dashboard?.scheduleDays[0] ?? null,
        [dashboard, selectedDay],
    );

    const selectedSlot = useMemo(() => {
        if (!currentDay) return null;
        return currentDay.slots.find((slot) => slot.id === selectedSlotId) ?? currentDay.slots[0] ?? null;
    }, [currentDay, selectedSlotId]);

    const gridRows = useMemo(() => {
        const maxRows = dashboard?.scheduleMeta.maxSlotsPerDay ?? 6;
        return Array.from({ length: maxRows }, (_, index) => index + 1).map((slotIndex) => ({
            slotIndex,
            cells: dashboard?.scheduleDays.map((day) => {
                const slot = day.slots.find((item) => item.slotIndex === slotIndex) ?? null;
                const inheritedSlot = day.slots.find(
                    (item) => item.slotIndex < slotIndex && item.slotIndex + item.durationSlots - 1 >= slotIndex,
                ) ?? null;
                return { dayOfWeek: day.dayOfWeek, slot, inheritedSlot };
            }) ?? [],
        }));
    }, [dashboard]);

    const changedCount = dashboard?.scheduleDays.reduce((sum, day) => sum + day.slots.filter((slot) => slot.isChanged).length, 0) ?? 0;

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Мое расписание</h1>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                        {dashboard
                            ? `${dashboard.student.firstName}, ${dashboard.student.className} класс • ${dashboard.scheduleMeta.weekLabel ?? "неделя без публикации"}`
                            : "Загружаем опубликованную неделю..."}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="liquid-glass rounded-2xl px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Сегодня</p>
                        <p className="mt-1 text-base font-sora font-bold text-foreground">{currentDay?.dayLabel ?? "Нет данных"}</p>
                    </div>
                    <div className="liquid-glass rounded-2xl px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Изменений недели</p>
                        <p className="mt-1 text-2xl font-sora font-bold text-foreground">{changedCount}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Timetable Grid</h2>
                                <p className="text-sm text-muted-foreground mt-1">Вся неделя в одном экране: дни, слоты, изменения и продолжение пар.</p>
                            </div>
                            <CalendarDays className="w-5 h-5 text-primary" />
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-white/40">
                            <div className="min-w-[760px]">
                                <div className="grid grid-cols-[100px_repeat(5,minmax(120px,1fr))] border-b border-border/60 bg-white/60">
                                    <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Слот</div>
                                    {dashboard?.scheduleDays.map((day) => (
                                        <button
                                            key={day.dayOfWeek}
                                            onClick={() => {
                                                setSelectedDay(day.dayOfWeek);
                                                setSelectedSlotId(day.slots[0]?.id ?? null);
                                            }}
                                            className={`px-4 py-3 text-left transition-colors ${selectedDay === day.dayOfWeek ? "bg-primary text-white" : "hover:bg-black/5"}`}
                                        >
                                            <p className={`text-sm font-semibold ${selectedDay === day.dayOfWeek ? "text-white" : "text-foreground"}`}>{day.shortLabel}</p>
                                            <p className={`text-[11px] ${selectedDay === day.dayOfWeek ? "text-white/80" : "text-muted-foreground"}`}>{day.lessonCount} уроков</p>
                                        </button>
                                    ))}
                                </div>

                                {gridRows.map((row) => (
                                    <div key={row.slotIndex} className="grid grid-cols-[100px_repeat(5,minmax(120px,1fr))] border-b border-border/40 last:border-b-0">
                                        <div className="px-4 py-4 bg-white/50">
                                            <p className="text-sm font-semibold text-foreground">Урок {row.slotIndex}</p>
                                        </div>
                                        {row.cells.map((cell) => {
                                            if (cell.slot) {
                                                const tone = getToneClasses(cell.slot.statusTone);
                                                return (
                                                    <button
                                                        key={`${cell.dayOfWeek}-${row.slotIndex}`}
                                                        onClick={() => {
                                                            setSelectedDay(cell.dayOfWeek);
                                                            setSelectedSlotId(cell.slot?.id ?? null);
                                                        }}
                                                        className={`min-h-[110px] border-l border-border/40 px-3 py-3 text-left hover:bg-black/5 ${selectedSlot?.id === cell.slot.id ? "bg-primary/5" : ""}`}
                                                    >
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-sm font-semibold text-foreground">{cell.slot.title}</p>
                                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tone}`}>
                                                                {cell.slot.statusLabel}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-xs text-muted-foreground">{cell.slot.time}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{cell.slot.room}</p>
                                                        {cell.slot.durationSlots > 1 && (
                                                            <p className="mt-2 text-[11px] font-semibold text-primary">Пара на {cell.slot.durationSlots} слота</p>
                                                        )}
                                                    </button>
                                                );
                                            }

                                            if (cell.inheritedSlot) {
                                                return (
                                                    <div key={`${cell.dayOfWeek}-${row.slotIndex}`} className="min-h-[110px] border-l border-border/40 bg-primary/5 px-3 py-3">
                                                        <p className="text-xs font-semibold text-primary">Продолжение</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{cell.inheritedSlot.title}</p>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={`${cell.dayOfWeek}-${row.slotIndex}`} className="min-h-[110px] border-l border-border/40 bg-white/20 px-3 py-3">
                                                    <p className="text-xs text-muted-foreground">Нет урока</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">День подробно</h2>
                                <p className="text-sm text-muted-foreground mt-1">Выбери урок и смотри детали справа.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {dashboard?.scheduleDays.map((day) => (
                                    <button
                                        key={day.dayOfWeek}
                                        onClick={() => {
                                            setSelectedDay(day.dayOfWeek);
                                            setSelectedSlotId(day.slots[0]?.id ?? null);
                                        }}
                                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${selectedDay === day.dayOfWeek ? "bg-primary text-white" : "bg-black/5 text-muted-foreground hover:bg-black/10"}`}
                                    >
                                        {day.shortLabel}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {currentDay ? (
                            <div className="space-y-3">
                                {currentDay.slots.map((slot, index) => {
                                    const tone = getToneClasses(slot.statusTone);
                                    return (
                                        <button
                                            key={slot.id}
                                            onClick={() => setSelectedSlotId(slot.id)}
                                            className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedSlot?.id === slot.id ? "border-primary bg-primary/5" : slot.isChanged ? "border-orange-200 bg-orange-50/70" : "border-border/60 bg-white/50 hover:border-primary/30"}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${selectedSlot?.id === slot.id ? "bg-primary text-white" : "bg-black/5 text-foreground"}`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-base font-semibold text-foreground">{slot.title}</p>
                                                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${tone}`}>
                                                            {slot.statusLabel}
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                                        <span className="inline-flex items-center gap-1.5"><Clock3 className="w-4 h-4" />{slot.time}</span>
                                                        <span className="inline-flex items-center gap-1.5"><UserSquare2 className="w-4 h-4" />{slot.teacher}</span>
                                                        <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{slot.room}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Опубликованной недели пока нет.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-4">
                            <BookMarked className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Карточка урока</h2>
                        </div>
                        {selectedSlot ? (
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-primary/10 bg-white/60 p-4">
                                    <p className="text-lg font-sora font-bold text-foreground">{selectedSlot.title}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{currentDay?.dayLabel} • {selectedSlot.time}</p>
                                </div>
                                <div className="rounded-2xl bg-black/5 p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Учитель</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedSlot.teacher}</p>
                                </div>
                                <div className="rounded-2xl bg-black/5 p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Кабинет</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedSlot.room}</p>
                                </div>
                                <div className="rounded-2xl bg-primary/5 p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary/80">После урока</p>
                                    <p className="mt-1 text-sm text-foreground/85">{selectedSlot.homework}</p>
                                </div>
                                <div className="rounded-2xl bg-white/60 border border-border/60 p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Фокус</p>
                                    <p className="mt-1 text-sm text-foreground/85">{selectedSlot.focusNote}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Выбери урок из сетки недели.</p>
                        )}
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-4">
                            <BellRing className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Изменения и push</h2>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                            {dashboard?.scheduleMeta.pushAlertsEnabled
                                ? "Уведомления включены. Все изменения расписания попадают сюда сразу после публикации."
                                : "Push выключены, но история изменений всё равно сохраняется."}
                        </p>
                        <div className="space-y-3">
                            {dashboard?.notices.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-primary/10 bg-white/60 p-4">
                                    <p className="text-sm font-semibold text-foreground">{item.text}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{item.audience} • {item.createdAt}</p>
                                </div>
                            ))}
                            {(dashboard?.notices.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Пока всё стабильно, новых изменений нет.</p>}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem] bg-gradient-to-b from-white to-[#f8f5ff]">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Быстрые переходы</h2>
                        </div>
                        <div className="space-y-3">
                            <Link href="/student" className="flex items-center justify-between rounded-xl border border-border/60 bg-white/60 px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/30">
                                Вернуться в кабинет ученика <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </Link>
                            <Link href="/student/profile" className="flex items-center justify-between rounded-xl border border-border/60 bg-white/60 px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/30">
                                Открыть портфолио и достижения <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </Link>
                            <Link href="/leaderboard" className="flex items-center justify-between rounded-xl border border-border/60 bg-white/60 px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/30">
                                Посмотреть общий рейтинг школы <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
