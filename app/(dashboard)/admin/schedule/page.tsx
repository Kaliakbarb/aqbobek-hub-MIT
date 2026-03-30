"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Calendar as CalendarIcon,
    Clock3,
    RefreshCw,
    Save,
    Send,
} from "lucide-react";

type ScheduleDay = {
    dayOfWeek: number;
    dayLabel: string;
    slots: Array<{
        id: string;
        time: string;
        slotIndex: number;
        durationSlots: number;
        subject: string;
        teacher: string;
        room: string;
        split?: boolean;
        itemType: string;
        sourceType: string;
        locked: boolean;
    }>;
};

type SchedulePayload = {
    plan: {
        id: string;
        status: "draft" | "published";
        published: boolean;
        weekStartDate: string;
        generationMode: "initial" | "reoptimized";
        regenerationReason: string | null;
    } | null;
    summary: string;
    classes: Array<{
        id: string;
        name: string;
        days: ScheduleDay[];
    }>;
    conflicts: Array<{ id: string; title: string; description: string; severity: string; resolved: boolean; needsAttention?: boolean }>;
    constraints: {
        summary: {
            roomCount: number;
            unavailableRoomCells: number;
            teacherCount: number;
            unavailableTeacherCells: number;
            requirementCount: number;
            bandCount: number;
            activeAbsenceCount: number;
        };
        teachers: Array<{
            id: string;
            user: { fullName: string };
            availabilities: Array<{ dayOfWeek: number; slotIndex: number; status: "available" | "unavailable" }>;
        }>;
        rooms: Array<{
            id: string;
            name: string;
            type: string;
            capacity: number;
            active: boolean;
            availabilities: Array<{ dayOfWeek: number; slotIndex: number; status: "available" | "unavailable" }>;
        }>;
        requirements: unknown[];
        bands: unknown[];
        absences: Array<{
            id: string;
            startsAt: string;
            endsAt: string;
            reason: string;
            teacher: { user: { fullName: string } };
        }>;
    };
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

const dayOrder = [1, 2, 3, 4, 5];
const slotLabels = [
    "08:30 - 09:15",
    "09:25 - 10:10",
    "10:30 - 11:15",
    "11:25 - 12:10",
    "12:20 - 13:05",
    "13:15 - 14:00",
];

export default function SmartSchedule() {
    const [schedule, setSchedule] = useState<SchedulePayload | null>(null);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [status, setStatus] = useState("Подключаем weekly planner и ограничения.");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isSavingConstraints, setIsSavingConstraints] = useState(false);
    const [isSubmittingAbsence, setIsSubmittingAbsence] = useState(false);
    const [roomEditor, setRoomEditor] = useState("[]");
    const [teacherAvailabilityEditor, setTeacherAvailabilityEditor] = useState("[]");
    const [roomAvailabilityEditor, setRoomAvailabilityEditor] = useState("[]");
    const [requirementEditor, setRequirementEditor] = useState("[]");
    const [bandEditor, setBandEditor] = useState("[]");
    const [absenceTeacherId, setAbsenceTeacherId] = useState("");
    const [absenceStartsAt, setAbsenceStartsAt] = useState(new Date().toISOString().slice(0, 10));
    const [absenceEndsAt, setAbsenceEndsAt] = useState(new Date().toISOString().slice(0, 10));
    const [absenceReason, setAbsenceReason] = useState("Больничный");

    const load = useCallback(async () => {
        const response = await fetch("/api/admin/schedule");
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Не удалось загрузить smart schedule.");

        const nextSchedule = data.schedule as SchedulePayload;
        setSchedule(nextSchedule);
        setStatus(nextSchedule.plan ? "Weekly plan и ограничения синхронизированы." : "Ограничения загружены. Можно запускать генерацию.");
        if (nextSchedule.classes.length > 0 && !nextSchedule.classes.some((item) => item.name === selectedClass)) {
            setSelectedClass(nextSchedule.classes[0].name);
        }
        setRoomEditor(JSON.stringify(nextSchedule.constraints.rooms.map((room) => ({
            id: room.id,
            name: room.name,
            type: room.type,
            capacity: room.capacity,
            active: room.active,
        })), null, 2));
        setTeacherAvailabilityEditor(JSON.stringify(nextSchedule.constraints.teachers.flatMap((teacher) =>
            teacher.availabilities.map((availability) => ({
                teacherId: teacher.id,
                dayOfWeek: availability.dayOfWeek,
                slotIndex: availability.slotIndex,
                status: availability.status,
            })),
        ), null, 2));
        setRoomAvailabilityEditor(JSON.stringify(nextSchedule.constraints.rooms.flatMap((room) =>
            room.availabilities.map((availability) => ({
                roomId: room.id,
                dayOfWeek: availability.dayOfWeek,
                slotIndex: availability.slotIndex,
                status: availability.status,
            })),
        ), null, 2));
        setRequirementEditor(JSON.stringify(nextSchedule.constraints.requirements, null, 2));
        setBandEditor(JSON.stringify(nextSchedule.constraints.bands, null, 2));
        if (!absenceTeacherId && nextSchedule.constraints.teachers.length > 0) {
            setAbsenceTeacherId(nextSchedule.constraints.teachers[0].id);
        }
    }, [absenceTeacherId, selectedClass]);

    useEffect(() => {
        void load().catch((error) => {
            setStatus(error instanceof Error ? error.message : "Не удалось загрузить smart schedule.");
        });
    }, [load]);

    const selectedSchedule = useMemo(() => {
        const classItem = schedule?.classes.find((item) => item.name === selectedClass);
        return classItem?.days.find((day) => day.dayOfWeek === selectedDay) ?? null;
    }, [schedule, selectedClass, selectedDay]);

    const selectedScheduleRows = useMemo(() => {
        if (!selectedSchedule) return [];
        return selectedSchedule.slots.flatMap((slot) =>
            Array.from({ length: slot.durationSlots }, (_, offset) => ({
                ...slot,
                rowId: `${slot.id}:${offset}`,
                periodIndex: slot.slotIndex + offset,
                time: slotLabels[slot.slotIndex + offset - 1] ?? slot.time,
                pairSegment: slot.durationSlots > 1 ? `${offset + 1}/${slot.durationSlots}` : null,
            })),
        );
    }, [selectedSchedule]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setStatus("Генератор строит недельную сетку по ограничениям.");
        try {
            const response = await fetch("/api/admin/schedule/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weekStartDate: schedule?.plan?.weekStartDate }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Не удалось сгенерировать weekly draft.");
            setStatus(`Создан weekly draft: ${data.placedUnits} блоков размещено, конфликтов: ${data.conflictCount}.`);
            await load();
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось сгенерировать weekly draft.");
        } finally {
            setIsGenerating(false);
        }
    };

    const publishSchedule = async () => {
        if (!schedule?.plan?.id) return;
        setIsPublishing(true);
        try {
            const response = await fetch("/api/admin/schedule/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId: schedule.plan.id }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Не удалось опубликовать план.");
            setStatus("Weekly draft опубликован и доступен всем ролям.");
            await load();
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось опубликовать weekly draft.");
        } finally {
            setIsPublishing(false);
        }
    };

    const saveConstraints = async () => {
        setIsSavingConstraints(true);
        setStatus("Сохраняем rooms, availability, requirements и bands.");
        try {
            const response = await fetch("/api/admin/schedule/constraints", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rooms: JSON.parse(roomEditor),
                    teacherAvailability: JSON.parse(teacherAvailabilityEditor),
                    roomAvailability: JSON.parse(roomAvailabilityEditor),
                    requirements: JSON.parse(requirementEditor),
                    bands: JSON.parse(bandEditor),
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Не удалось сохранить ограничения.");
            setStatus("Ограничения сохранены. Можно пересобирать сетку.");
            await load();
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось сохранить ограничения.");
        } finally {
            setIsSavingConstraints(false);
        }
    };

    const submitAbsence = async () => {
        if (!absenceTeacherId || !absenceStartsAt) return;
        setIsSubmittingAbsence(true);
        setStatus("Отмечаем отсутствие и запускаем локальную перестройку недели.");
        try {
            const response = await fetch("/api/admin/schedule/absences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacherId: absenceTeacherId,
                    startsAt: absenceStartsAt,
                    endsAt: absenceEndsAt,
                    reason: absenceReason,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Не удалось перестроить расписание.");
            setStatus(`Автоперестройка завершена. Затронуто слотов: ${data.affectedSlots}, нерешенных конфликтов: ${data.unresolvedCount}.`);
            await load();
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось перестроить расписание.");
        } finally {
            setIsSubmittingAbsence(false);
        }
    };

    const qualityTone = schedule?.quality?.quality_band_label === "high"
        ? "text-green-700 bg-green-500/10 border-green-200"
        : schedule?.quality?.quality_band_label === "medium"
            ? "text-amber-700 bg-amber-500/10 border-amber-200"
            : "text-red-700 bg-red-500/10 border-red-200";

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Smart Schedule</h1>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">{schedule?.summary ?? "Weekly planner, reoptimization и in-app push."}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => void handleGenerate()}
                        disabled={isGenerating}
                        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-muted"
                    >
                        {isGenerating ? "Генерируем..." : "Сгенерировать неделю"}
                    </button>
                    <button
                        onClick={() => void publishSchedule()}
                        disabled={!schedule?.plan?.id || isPublishing}
                        className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPublishing ? "Публикуем..." : schedule?.plan?.published ? "Перепубликовать" : "Опубликовать"}
                    </button>
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4">
                <p className="text-sm font-semibold text-foreground">{status}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <div className="liquid-glass rounded-3xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Кабинеты</p>
                    <p className="mt-2 text-2xl font-sora font-bold text-foreground">{schedule?.constraints.summary.roomCount ?? 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Недоступных ячеек: {schedule?.constraints.summary.unavailableRoomCells ?? 0}</p>
                </div>
                <div className="liquid-glass rounded-3xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Учителя</p>
                    <p className="mt-2 text-2xl font-sora font-bold text-foreground">{schedule?.constraints.summary.teacherCount ?? 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Недоступных ячеек: {schedule?.constraints.summary.unavailableTeacherCells ?? 0}</p>
                </div>
                <div className="liquid-glass rounded-3xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Требования</p>
                    <p className="mt-2 text-2xl font-sora font-bold text-foreground">{schedule?.constraints.summary.requirementCount ?? 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Учебные блоки на неделю</p>
                </div>
                <div className="liquid-glass rounded-3xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ленты</p>
                    <p className="mt-2 text-2xl font-sora font-bold text-foreground">{schedule?.constraints.summary.bandCount ?? 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Параллельные группы</p>
                </div>
                <div className="rounded-3xl border border-orange-100 bg-orange-50/70 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Активные absences</p>
                    <p className="mt-2 text-2xl font-sora font-bold text-orange-900">{schedule?.constraints.summary.activeAbsenceCount ?? 0}</p>
                    <p className="mt-1 text-xs text-orange-800">Автоперестройка включена</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    <div className="liquid-glass rounded-[2rem] p-6">
                        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Weekly Grid</h2>
                                <p className="text-sm text-muted-foreground">
                                    {schedule?.plan?.weekStartDate ? `Неделя от ${schedule.plan.weekStartDate.slice(0, 10)}` : "Черновик ещё не создан"}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {schedule?.classes.map((classItem) => (
                                    <button
                                        key={classItem.id}
                                        onClick={() => setSelectedClass(classItem.name)}
                                        className={`rounded-lg px-3 py-1 text-xs font-bold ${
                                            selectedClass === classItem.name ? "bg-black/10 text-foreground" : "border border-border text-muted-foreground"
                                        }`}
                                    >
                                        {classItem.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-5 flex flex-wrap gap-2">
                            {dayOrder.map((dayOfWeek) => (
                                <button
                                    key={dayOfWeek}
                                    onClick={() => setSelectedDay(dayOfWeek)}
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                        selectedDay === dayOfWeek ? "bg-primary text-white" : "border border-border text-foreground"
                                    }`}
                                >
                                    {selectedSchedule?.dayOfWeek === dayOfWeek ? selectedSchedule.dayLabel : schedule?.classes[0]?.days.find((item) => item.dayOfWeek === dayOfWeek)?.dayLabel ?? dayOfWeek}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3">
                            {selectedScheduleRows.map((slot) => (
                                <div
                                    key={slot.rowId}
                                    className={`rounded-2xl border p-4 ${
                                        slot.split ? "border-blue-200 bg-blue-50/60" : "border-border bg-white/60"
                                    }`}
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{slot.time}</p>
                                            <p className="mt-1 text-sm font-bold text-foreground">{slot.subject}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{slot.teacher}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                            {slot.pairSegment && (
                                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">пара {slot.pairSegment}</span>
                                            )}
                                            <span className="rounded-full bg-black/5 px-2.5 py-1 text-foreground">{slot.room}</span>
                                            <span className="rounded-full bg-white px-2.5 py-1 text-muted-foreground">{slot.itemType}</span>
                                            <span className="rounded-full bg-white px-2.5 py-1 text-muted-foreground">{slot.sourceType}</span>
                                            {slot.locked && <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-green-700">locked</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!selectedScheduleRows.length && (
                                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                    На выбранный день уроки ещё не размещены.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="liquid-glass rounded-[2rem] p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <Clock3 className="h-5 w-5 text-primary" />
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Constraint Editor</h2>
                                <p className="text-sm text-muted-foreground">Редактируем входные данные weekly planner через JSON-представление.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            <EditorBlock title="Rooms" value={roomEditor} onChange={setRoomEditor} />
                            <EditorBlock title="Teacher Availability" value={teacherAvailabilityEditor} onChange={setTeacherAvailabilityEditor} />
                            <EditorBlock title="Room Availability" value={roomAvailabilityEditor} onChange={setRoomAvailabilityEditor} />
                            <EditorBlock title="Requirements" value={requirementEditor} onChange={setRequirementEditor} />
                            <div className="xl:col-span-2">
                                <EditorBlock title="Bands" value={bandEditor} onChange={setBandEditor} />
                            </div>
                        </div>
                        <button
                            onClick={() => void saveConstraints()}
                            disabled={isSavingConstraints}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-60"
                        >
                            {isSavingConstraints ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Сохранить ограничения
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass rounded-[2rem] p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Teacher Absence</h2>
                                <p className="text-sm text-muted-foreground">Отметка больничного запускает reoptimization и in-app push.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <select
                                value={absenceTeacherId}
                                onChange={(event) => setAbsenceTeacherId(event.target.value)}
                                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                            >
                                {schedule?.constraints.teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.user.fullName}
                                    </option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="date"
                                    value={absenceStartsAt}
                                    onChange={(event) => setAbsenceStartsAt(event.target.value)}
                                    className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                                />
                                <input
                                    type="date"
                                    value={absenceEndsAt}
                                    onChange={(event) => setAbsenceEndsAt(event.target.value)}
                                    className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                                />
                            </div>
                            <input
                                value={absenceReason}
                                onChange={(event) => setAbsenceReason(event.target.value)}
                                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                                placeholder="Причина"
                            />
                            <button
                                onClick={() => void submitAbsence()}
                                disabled={isSubmittingAbsence}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {isSubmittingAbsence ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Запустить перестройку
                            </button>
                        </div>
                        <div className="mt-5 space-y-2">
                            {schedule?.constraints.absences.map((absence) => (
                                <div key={absence.id} className="rounded-2xl border border-orange-100 bg-orange-50/70 p-3 text-sm text-orange-950">
                                    <p className="font-semibold">{absence.teacher.user.fullName}</p>
                                    <p className="mt-1 text-xs">{absence.startsAt.slice(0, 10)} - {absence.endsAt.slice(0, 10)} • {absence.reason}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`rounded-[2rem] border p-6 ${qualityTone}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider opacity-80">Schedule Quality Predictor</p>
                                <p className="mt-2 text-3xl font-sora font-bold">{schedule?.quality?.overall_quality_score ?? "-"}</p>
                            </div>
                            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">{schedule?.quality?.quality_band_label_ru ?? "n/a"}</span>
                        </div>
                        <p className="mt-3 text-sm">{schedule?.quality?.interpretation_ru ?? "Качество появится после генерации."}</p>
                        <p className="mt-3 text-xs font-medium">{schedule?.quality?.recommendation ?? "Сначала соберите weekly draft."}</p>
                        {schedule?.quality && (
                            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                <MetricCard label="Баланс" value={`${Math.round(schedule.quality.metrics.schedule_balance_score * 100)}%`} />
                                <MetricCard label="Устойчивость" value={`${Math.round(schedule.quality.metrics.substitution_resilience_score * 100)}%`} />
                                <MetricCard label="Окна учителей" value={`${schedule.quality.metrics.avg_teacher_gaps_per_week}`} />
                                <MetricCard
                                    label="Конфликты"
                                    value={`${schedule.quality.metrics.room_conflict_count + schedule.quality.metrics.teacher_conflict_count + schedule.quality.metrics.class_conflict_count}`}
                                />
                            </div>
                        )}
                    </div>

                    <div className="liquid-glass rounded-[2rem] p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Conflicts & Suggestions</h2>
                                <p className="text-sm text-muted-foreground">Нерешенные коллизии и лучшие замены.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {schedule?.conflicts.map((conflict) => (
                                <div
                                    key={conflict.id}
                                    className={`rounded-2xl border p-3 text-sm ${
                                        conflict.needsAttention || !conflict.resolved
                                            ? "border-red-100 bg-red-50/70 text-red-900"
                                            : "border-blue-100 bg-blue-50/70 text-blue-950"
                                    }`}
                                >
                                    <p className="font-semibold">{conflict.title}</p>
                                    <p className="mt-1 text-xs">{conflict.description}</p>
                                </div>
                            ))}
                            {!schedule?.conflicts.length && <p className="text-sm text-muted-foreground">Активных конфликтов нет.</p>}
                        </div>

                        {schedule?.substituteMatch && (
                            <div className="mt-6 space-y-3 border-t border-border pt-5">
                                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-950">
                                    <p className="font-semibold">Отсутствует: {schedule.substituteMatch.absentTeacher.teacherName}</p>
                                    <p className="mt-1 text-xs">
                                        {schedule.substituteMatch.lesson.subjectName} • {schedule.substituteMatch.lesson.className} • {schedule.substituteMatch.lesson.timeLabel} • {schedule.substituteMatch.lesson.room}
                                    </p>
                                </div>
                                {schedule.substituteMatch.candidates.map((candidate) => (
                                    <div key={candidate.candidate_teacher_id} className="rounded-2xl border border-border bg-white/70 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{candidate.teacherName}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {candidate.candidate_subject_specialization}
                                                    {candidate.candidate_secondary_specialization ? ` • ${candidate.candidate_secondary_specialization}` : ""}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-bold text-foreground">
                                                {candidate.fit_label_ru}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">{candidate.explanation_ru}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border bg-white/60 p-3">
            <p className="text-muted-foreground">{label}</p>
            <p className="mt-1 font-bold text-foreground">{value}</p>
        </div>
    );
}

function EditorBlock({
    title,
    value,
    onChange,
}: {
    title: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-foreground">{title}</span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-[180px] w-full rounded-2xl border border-border bg-white/70 p-3 font-mono text-xs text-foreground"
            />
        </label>
    );
}
