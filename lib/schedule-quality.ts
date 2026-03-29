import { spawn } from "node:child_process";
import path from "node:path";
import { prisma } from "./prisma";

type ScheduleQualityModelInput = {
    total_classes: number;
    total_teachers: number;
    total_rooms: number;
    total_subject_blocks: number;
    total_group_lessons: number;
    total_parallel_streams: number;
    total_events: number;
    avg_teacher_gaps_per_week: number;
    max_teacher_gaps: number;
    avg_teacher_consecutive_lessons: number;
    max_teacher_consecutive_lessons: number;
    avg_student_consecutive_hard_lessons: number;
    max_student_consecutive_hard_lessons: number;
    avg_student_daily_load: number;
    max_student_daily_load: number;
    room_utilization_rate: number;
    room_conflict_count: number;
    teacher_conflict_count: number;
    class_conflict_count: number;
    substitution_resilience_score: number;
    schedule_balance_score: number;
    hard_subject_clustering_score: number;
    teacher_workload_std: number;
    class_workload_std: number;
    friday_overload_score: number;
    monday_underload_score: number;
    lunch_break_violation_count: number;
    late_slot_usage_rate: number;
    early_slot_usage_rate: number;
    stream_complexity_score: number;
    event_disruption_score: number;
    reoptimization_needed_flag: 0 | 1;
};

export type ScheduleQualityPrediction = {
    overall_quality_score: number;
    quality_band_label: "low" | "medium" | "high";
    quality_band_label_ru: string;
    interpretation_ru: string;
};

export type ScheduleQualitySummary = ScheduleQualityPrediction & {
    metrics: ScheduleQualityModelInput;
    recommendation: string;
    source: "ml" | "fallback";
};

type LoadedPlan = Awaited<ReturnType<typeof loadSchedulePlan>>;

const HARD_SUBJECTS = new Set(["Алгебра", "Геометрия", "Физика", "Химия", "Информатика"]);

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function average(values: number[]) {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, digits = 2) {
    return Number(value.toFixed(digits));
}

function stdDev(values: number[]) {
    if (values.length <= 1) return 0;
    const mean = average(values);
    const variance = average(values.map((value) => (value - mean) ** 2));
    return Math.sqrt(variance);
}

function parseStartMinutes(timeLabel: string) {
    const match = timeLabel.match(/(\d{1,2}):(\d{2})/);
    if (!match) return Number.MAX_SAFE_INTEGER;
    return Number(match[1]) * 60 + Number(match[2]);
}

function computeGapStats(indices: number[]) {
    if (indices.length === 0) {
        return { gaps: 0, longestRun: 0 };
    }

    let gaps = 0;
    let currentRun = 1;
    let longestRun = 1;

    for (let index = 1; index < indices.length; index += 1) {
        const diff = indices[index] - indices[index - 1];
        if (diff > 1) {
            gaps += diff - 1;
            currentRun = 1;
        } else {
            currentRun += 1;
            longestRun = Math.max(longestRun, currentRun);
        }
    }

    return { gaps, longestRun };
}

async function runScheduleQualityPrediction(metrics: ScheduleQualityModelInput) {
    const scriptPath = path.join(process.cwd(), "schedule_quality_model", "predict_schedule_quality.py");

    return await new Promise<ScheduleQualityPrediction>((resolve, reject) => {
        const child = spawn("python3", [scriptPath], {
            cwd: process.cwd(),
            stdio: ["pipe", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", reject);
        child.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(stderr.trim() || stdout.trim() || "Schedule quality prediction failed."));
                return;
            }

            try {
                resolve(JSON.parse(stdout) as ScheduleQualityPrediction);
            } catch (error) {
                reject(error);
            }
        });

        child.stdin.write(JSON.stringify(metrics));
        child.stdin.end();
    });
}

function fallbackPrediction(metrics: ScheduleQualityModelInput): ScheduleQualityPrediction {
    const score = clamp(
        100
            - metrics.room_conflict_count * 10
            - metrics.teacher_conflict_count * 12
            - metrics.class_conflict_count * 14
            - metrics.avg_teacher_gaps_per_week * 6
            - metrics.hard_subject_clustering_score * 18
            - metrics.friday_overload_score * 10
            - metrics.lunch_break_violation_count * 6
            + metrics.substitution_resilience_score * 10
            + metrics.schedule_balance_score * 14,
        0,
        100,
    );

    if (score < 50) {
        return {
            overall_quality_score: round(score, 2),
            quality_band_label: "low",
            quality_band_label_ru: "низкое качество",
            interpretation_ru: "Расписание перегружено конфликтами и требует серьезной переработки.",
        };
    }
    if (score < 75) {
        return {
            overall_quality_score: round(score, 2),
            quality_band_label: "medium",
            quality_band_label_ru: "среднее качество",
            interpretation_ru: "Расписание работоспособно, но есть заметные точки для оптимизации.",
        };
    }
    return {
        overall_quality_score: round(score, 2),
        quality_band_label: "high",
        quality_band_label_ru: "высокое качество",
        interpretation_ru: "Расписание хорошо сбалансировано и устойчиво к изменениям.",
    };
}

function buildRecommendation(prediction: ScheduleQualityPrediction) {
    if (prediction.quality_band_label === "low") {
        return "Нужно пересобрать расписание: модель видит высокий риск неудобной сетки и нестабильности к заменам.";
    }
    if (prediction.quality_band_label === "medium") {
        return "Можно публиковать после проверки, но лучше ещё раз оптимизировать окна, нагрузку и устойчивость к заменам.";
    }
    return "Расписание можно публиковать: баланс и устойчивость находятся в хорошем диапазоне.";
}

async function loadSchedulePlan(planId?: string) {
    return prisma.schedulePlan.findFirst({
        where: planId ? { id: planId } : undefined,
        orderBy: planId ? undefined : [{ status: "desc" }, { updatedAt: "desc" }],
        include: {
            slots: {
                include: {
                    schoolClass: true,
                    subject: true,
                    teacher: true,
                },
            },
            conflicts: true,
        },
    });
}

function deriveMetricsFromPlan(
    plan: NonNullable<LoadedPlan>,
    totalClassCount: number,
    totalTeacherCount: number,
): ScheduleQualityModelInput {
    const slots = plan.slots;
    const uniqueTimes = [...new Set(slots.map((slot) => slot.timeLabel))].sort((left, right) => parseStartMinutes(left) - parseStartMinutes(right));
    const timeIndexMap = new Map(uniqueTimes.map((timeLabel, index) => [timeLabel, index]));
    const uniqueRooms = [...new Set(slots.map((slot) => slot.room.trim()))];

    const teacherSlots = new Map<string, number[]>();
    const classSlots = new Map<string, typeof slots>();
    const roomTimeCounts = new Map<string, number>();
    const teacherTimeCounts = new Map<string, number>();
    const classTimeCounts = new Map<string, number>();
    const subjectTimeCounts = new Map<string, number>();

    for (const slot of slots) {
        const timeIndex = timeIndexMap.get(slot.timeLabel) ?? 0;
        if (slot.teacherId) {
            const teacherIndices = teacherSlots.get(slot.teacherId) ?? [];
            teacherIndices.push(timeIndex);
            teacherSlots.set(slot.teacherId, teacherIndices);
        }

        const classEntries = classSlots.get(slot.classId) ?? [];
        classEntries.push(slot);
        classSlots.set(slot.classId, classEntries);

        const roomKey = `${slot.room}__${slot.timeLabel}`;
        roomTimeCounts.set(roomKey, (roomTimeCounts.get(roomKey) ?? 0) + 1);

        if (slot.teacherId) {
            const teacherKey = `${slot.teacherId}__${slot.timeLabel}`;
            teacherTimeCounts.set(teacherKey, (teacherTimeCounts.get(teacherKey) ?? 0) + 1);
        }

        const classKey = `${slot.classId}__${slot.timeLabel}`;
        classTimeCounts.set(classKey, (classTimeCounts.get(classKey) ?? 0) + 1);

        const subjectTimeKey = `${slot.subjectId}__${slot.timeLabel}`;
        subjectTimeCounts.set(subjectTimeKey, (subjectTimeCounts.get(subjectTimeKey) ?? 0) + 1);
    }

    const teacherGapStats = [...teacherSlots.values()].map((indices) => {
        const uniqueIndices = [...new Set(indices)].sort((left, right) => left - right);
        return computeGapStats(uniqueIndices);
    });

    const classHardRuns = [...classSlots.values()].map((classSchedule) => {
        const ordered = [...classSchedule].sort((left, right) => (timeIndexMap.get(left.timeLabel) ?? 0) - (timeIndexMap.get(right.timeLabel) ?? 0));
        let currentRun = 0;
        let longestRun = 0;
        for (const slot of ordered) {
            if (HARD_SUBJECTS.has(slot.subject.name)) {
                currentRun += 1;
                longestRun = Math.max(longestRun, currentRun);
            } else {
                currentRun = 0;
            }
        }
        return longestRun;
    });

    const classLoads = [...classSlots.values()].map((classSchedule) => classSchedule.length);
    const teacherLoads = [...teacherSlots.values()].map((indices) => indices.length);
    const roomConflictCount = [...roomTimeCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    const teacherConflictCount = [...teacherTimeCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    const classConflictCount = [...classTimeCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    const occupiedRoomTime = roomTimeCounts.size;
    const roomUtilizationRate = uniqueRooms.length > 0 && uniqueTimes.length > 0
        ? clamp(occupiedRoomTime / (uniqueRooms.length * uniqueTimes.length), 0, 1)
        : 0;

    const avgTeacherGaps = average(teacherGapStats.map((item) => item.gaps));
    const maxTeacherGaps = Math.max(0, ...teacherGapStats.map((item) => item.gaps));
    const avgTeacherConsecutive = average(teacherGapStats.map((item) => item.longestRun));
    const maxTeacherConsecutive = Math.max(0, ...teacherGapStats.map((item) => item.longestRun));
    const avgStudentHardConsecutive = average(classHardRuns);
    const maxStudentHardConsecutive = Math.max(0, ...classHardRuns);
    const avgStudentDailyLoad = average(classLoads);
    const maxStudentDailyLoad = Math.max(0, ...classLoads);
    const teacherWorkloadStd = stdDev(teacherLoads);
    const classWorkloadStd = stdDev(classLoads);
    const scheduleBalanceScore = clamp(1 - classWorkloadStd / 4.5, 0, 1);
    const hardSubjectClusteringScore = clamp(avgStudentHardConsecutive / 4, 0, 1);
    const lateThreshold = Math.max(0, uniqueTimes.length - Math.ceil(uniqueTimes.length / 4));
    const earlyThreshold = Math.max(1, Math.ceil(uniqueTimes.length / 4));
    const lateSlotUsageRate = slots.length > 0
        ? clamp(slots.filter((slot) => (timeIndexMap.get(slot.timeLabel) ?? 0) >= lateThreshold).length / slots.length, 0, 1)
        : 0;
    const earlySlotUsageRate = slots.length > 0
        ? clamp(slots.filter((slot) => (timeIndexMap.get(slot.timeLabel) ?? 0) < earlyThreshold).length / slots.length, 0, 1)
        : 0;
    const totalParallelStreams = [...subjectTimeCounts.values()].filter((count) => count > 1).length;
    const lunchBreakViolationCount = classLoads.filter((load) => load > 4).length;
    const streamComplexityScore = clamp(
        (slots.length > 0 ? slots.filter((slot) => slot.split).length / slots.length : 0) * 0.5 +
        clamp(totalParallelStreams / Math.max(uniqueTimes.length, 1), 0, 1) * 0.5,
        0,
        1,
    );
    const eventDisruptionScore = clamp(
        average(plan.conflicts.map((conflict) => {
            if (conflict.severity === "high") return 0.9;
            if (conflict.severity === "medium") return 0.5;
            return 0.2;
        })) + plan.conflicts.filter((conflict) => !conflict.resolved).length * 0.2,
        0,
        1,
    );
    const substitutionResilienceScore = clamp(
        1
        - roomConflictCount * 0.08
        - teacherConflictCount * 0.1
        - classConflictCount * 0.12
        - clamp(avgTeacherGaps / 6, 0, 1) * 0.2
        - clamp(roomUtilizationRate - 0.85, 0, 0.15) * 1.2
        + clamp((uniqueRooms.length - teacherLoads.length) / Math.max(uniqueRooms.length, 1), -0.2, 0.2),
        0.1,
        1,
    );
    const fridayOverloadScore = plan.dayOfWeek === 5 ? clamp(avgStudentDailyLoad / 8, 0, 1) : 0;
    const mondayUnderloadScore = plan.dayOfWeek === 1 ? clamp((5 - avgStudentDailyLoad) / 5, 0, 1) : 0;
    const reoptimizationNeededFlag: 0 | 1 =
        roomConflictCount > 0 ||
        teacherConflictCount > 0 ||
        classConflictCount > 0 ||
        lunchBreakViolationCount > 0 ||
        maxTeacherGaps > 4 ||
        maxStudentHardConsecutive > 3 ||
        plan.conflicts.some((conflict) => !conflict.resolved)
            ? 1
            : 0;

    return {
        total_classes: totalClassCount,
        total_teachers: totalTeacherCount,
        total_rooms: uniqueRooms.length,
        total_subject_blocks: slots.length,
        total_group_lessons: slots.filter((slot) => slot.split).length,
        total_parallel_streams: totalParallelStreams,
        total_events: plan.conflicts.length,
        avg_teacher_gaps_per_week: round(avgTeacherGaps),
        max_teacher_gaps: maxTeacherGaps,
        avg_teacher_consecutive_lessons: round(avgTeacherConsecutive),
        max_teacher_consecutive_lessons: maxTeacherConsecutive,
        avg_student_consecutive_hard_lessons: round(avgStudentHardConsecutive),
        max_student_consecutive_hard_lessons: maxStudentHardConsecutive,
        avg_student_daily_load: round(avgStudentDailyLoad),
        max_student_daily_load: maxStudentDailyLoad,
        room_utilization_rate: round(roomUtilizationRate),
        room_conflict_count: roomConflictCount,
        teacher_conflict_count: teacherConflictCount,
        class_conflict_count: classConflictCount,
        substitution_resilience_score: round(substitutionResilienceScore),
        schedule_balance_score: round(scheduleBalanceScore),
        hard_subject_clustering_score: round(hardSubjectClusteringScore),
        teacher_workload_std: round(teacherWorkloadStd),
        class_workload_std: round(classWorkloadStd),
        friday_overload_score: round(fridayOverloadScore),
        monday_underload_score: round(mondayUnderloadScore),
        lunch_break_violation_count: lunchBreakViolationCount,
        late_slot_usage_rate: round(lateSlotUsageRate),
        early_slot_usage_rate: round(earlySlotUsageRate),
        stream_complexity_score: round(streamComplexityScore),
        event_disruption_score: round(eventDisruptionScore),
        reoptimization_needed_flag: reoptimizationNeededFlag,
    };
}

export async function predictScheduleQuality(metrics: ScheduleQualityModelInput) {
    return runScheduleQualityPrediction(metrics);
}

export async function predictScheduleQualitySafe(metrics: ScheduleQualityModelInput) {
    try {
        const prediction = await runScheduleQualityPrediction(metrics);
        return { prediction, source: "ml" as const };
    } catch {
        return { prediction: fallbackPrediction(metrics), source: "fallback" as const };
    }
}

export async function getScheduleQualitySummary(planId?: string): Promise<ScheduleQualitySummary | null> {
    const [plan, totalClassCount, totalTeacherCount] = await Promise.all([
        loadSchedulePlan(planId),
        prisma.schoolClass.count(),
        prisma.teacher.count(),
    ]);

    if (!plan) return null;

    const metrics = deriveMetricsFromPlan(plan, totalClassCount, totalTeacherCount);
    const { prediction, source } = await predictScheduleQualitySafe(metrics);

    return {
        ...prediction,
        metrics,
        recommendation: buildRecommendation(prediction),
        source,
    };
}
