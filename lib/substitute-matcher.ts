import { spawn } from "node:child_process";
import path from "node:path";
import { TeacherAbsenceStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { DAY_CODE_MAP } from "./schedule-constants";

type LessonContext = {
    subject_name: string;
    grade_level: number;
    class_group_type: "regular" | "group" | "stream" | "lab" | "exam_prep";
    lesson_slot_index: number;
    day_of_week: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
    room_type_required: "standard" | "lab" | "computer" | "lecture";
    stream_complexity_level: number;
    original_teacher_experience_years: number;
};

type SubstituteCandidateInput = {
    candidate_teacher_id: string;
    candidate_subject_specialization: string;
    candidate_secondary_specialization: string | null;
    candidate_experience_years: number;
    candidate_has_taught_this_grade: 0 | 1;
    candidate_has_taught_this_class_before: 0 | 1;
    candidate_is_available: 0 | 1;
    candidate_current_daily_load: number;
    candidate_current_weekly_load: number;
    candidate_consecutive_lessons_today: number;
    candidate_gap_before_lesson: number;
    candidate_gap_after_lesson: number;
    candidate_room_distance_score: number;
    candidate_recent_substitutions_count: number;
    candidate_burnout_risk_score: number;
    candidate_schedule_disruption_score: number;
    candidate_prefers_grade_band: "middle" | "high";
};

export type SubstituteMatchPrediction = {
    candidate_teacher_id: string;
    candidate_subject_specialization: string;
    candidate_secondary_specialization: string | null;
    predicted_substitute_fit_score: number;
    fit_label: "low" | "medium" | "high";
    fit_label_ru: string;
    explanation_ru: string;
};

export type SubstituteMatchSummary = {
    absentTeacher: {
        teacherId: string;
        teacherName: string;
    };
    lesson: {
        slotId: string;
        subjectName: string;
        className: string;
        timeLabel: string;
        room: string;
    };
    candidates: Array<
        SubstituteMatchPrediction & {
            teacherName: string;
            availability: boolean;
        }
    >;
    source: "ml" | "fallback";
};

const SUBJECT_NORMALIZATION: Record<string, string> = {
    "Алгебра": "Математика",
    "Геометрия": "Математика",
    "История Казахстана": "История",
};

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function normalizeSubjectName(subjectName: string) {
    return SUBJECT_NORMALIZATION[subjectName] ?? subjectName;
}

function inferRoomTypeRequired(subjectName: string, roomName: string): LessonContext["room_type_required"] {
    const normalizedRoom = roomName.toLowerCase();
    const normalizedSubject = normalizeSubjectName(subjectName);
    if (normalizedRoom.includes("lab") || normalizedRoom.includes("лаб")) return "lab";
    if (normalizedRoom.includes("it") || normalizedRoom.includes("комп")) return "computer";
    if (normalizedRoom.includes("лек")) return "lecture";
    if (normalizedSubject === "Физика" || normalizedSubject === "Химия" || normalizedSubject === "Биология") return "lab";
    if (normalizedSubject === "Информатика") return "computer";
    return "standard";
}

function inferClassGroupType(split: boolean, roomType: LessonContext["room_type_required"]): LessonContext["class_group_type"] {
    if (split) return "stream";
    if (roomType === "lab") return "lab";
    return "regular";
}

function inferStreamComplexityLevel(split: boolean, roomType: LessonContext["room_type_required"], gradeLevel: number) {
    const base = split ? 4 : roomType === "lab" || roomType === "computer" ? 3 : 2;
    return clamp(base + (gradeLevel >= 10 ? 1 : 0), 1, 5);
}

function inferTeacherExperienceYears(assignmentCount: number) {
    return clamp(4 + assignmentCount * 2, 2, 25);
}

function computeLongestRun(indices: number[]) {
    if (indices.length === 0) return 0;
    const ordered = [...new Set(indices)].sort((left, right) => left - right);
    let current = 1;
    let longest = 1;
    for (let index = 1; index < ordered.length; index += 1) {
        if (ordered[index] === ordered[index - 1] + 1) {
            current += 1;
            longest = Math.max(longest, current);
        } else {
            current = 1;
        }
    }
    return longest;
}

function computeGaps(indices: number[], targetIndex: number) {
    const ordered = [...new Set(indices)].sort((left, right) => left - right);
    const before = ordered.filter((value) => value < targetIndex);
    const after = ordered.filter((value) => value > targetIndex);
    const previous = before.length > 0 ? before[before.length - 1] : null;
    const next = after.length > 0 ? after[0] : null;

    return {
        gapBefore: previous == null ? 2 : clamp(targetIndex - previous - 1, 0, 2),
        gapAfter: next == null ? 2 : clamp(next - targetIndex - 1, 0, 2),
    };
}

function inferRoomDistanceScore(requiredRoom: string, teacherRooms: string[]) {
    if (teacherRooms.length === 0) return 0.4;
    const normalizedRequired = requiredRoom.toLowerCase();
    const closest = teacherRooms.reduce((best, room) => {
        const normalized = room.toLowerCase();
        if (normalized === normalizedRequired) return 0.1;
        if ((normalized.includes("лаб") || normalized.includes("lab")) && (normalizedRequired.includes("лаб") || normalizedRequired.includes("lab"))) {
            return Math.min(best, 0.2);
        }
        if (normalized.charAt(0) === normalizedRequired.charAt(0)) {
            return Math.min(best, 0.35);
        }
        return best;
    }, 0.7);
    return clamp(closest, 0.1, 1);
}

async function runSubstituteMatcher(lessonContext: LessonContext, candidates: SubstituteCandidateInput[], topN = 5) {
    const scriptPath = path.join(process.cwd(), "substitute_matcher_model", "predict_substitute_match.py");

    return await new Promise<SubstituteMatchPrediction[]>((resolve, reject) => {
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
                reject(new Error(stderr.trim() || stdout.trim() || "Substitute matcher failed."));
                return;
            }

            try {
                resolve(JSON.parse(stdout) as SubstituteMatchPrediction[]);
            } catch (error) {
                reject(error);
            }
        });

        child.stdin.write(JSON.stringify({ lesson_context: lessonContext, candidates, top_n: topN }));
        child.stdin.end();
    });
}

function fallbackRankCandidates(lessonContext: LessonContext, candidates: SubstituteCandidateInput[]) {
    return candidates
        .map((candidate) => {
            const specializationMatch =
                candidate.candidate_subject_specialization === lessonContext.subject_name
                    ? 1
                    : candidate.candidate_secondary_specialization === lessonContext.subject_name
                        ? 0.8
                        : 0.2;
            const continuity =
                candidate.candidate_has_taught_this_class_before === 1
                    ? 1
                    : candidate.candidate_has_taught_this_grade === 1
                        ? 0.5
                        : 0;
            const score = clamp(
                candidate.candidate_is_available * 0.35 +
                    specializationMatch * 0.3 +
                    continuity * 0.15 +
                    (1 - candidate.candidate_burnout_risk_score) * 0.1 +
                    (1 - candidate.candidate_schedule_disruption_score) * 0.1,
                0,
                1,
            );

            const fitLabel: SubstituteMatchPrediction["fit_label"] = score >= 0.7 ? "high" : score >= 0.4 ? "medium" : "low";
            const fitLabelRu =
                fitLabel === "high" ? "отличная замена" : fitLabel === "medium" ? "допустимая замена" : "нежелательная замена";
            const explanationRu =
                fitLabel === "high"
                    ? "Свободен, хорошо подходит по специализации и минимально нарушает текущее расписание."
                    : fitLabel === "medium"
                        ? "Может заменить, но есть оговорки по нагрузке или специализации."
                        : "Кандидат недоступен, перегружен или не обладает нужной квалификацией.";

            return {
                candidate_teacher_id: candidate.candidate_teacher_id,
                candidate_subject_specialization: candidate.candidate_subject_specialization,
                candidate_secondary_specialization: candidate.candidate_secondary_specialization,
                predicted_substitute_fit_score: Number(score.toFixed(4)),
                fit_label: fitLabel,
                fit_label_ru: fitLabelRu,
                explanation_ru: explanationRu,
            };
        })
        .sort((left, right) => right.predicted_substitute_fit_score - left.predicted_substitute_fit_score);
}

export async function rankSubstituteCandidates(
    lessonContext: LessonContext,
    candidates: SubstituteCandidateInput[],
    topN = 5,
) {
    try {
        const ranked = await runSubstituteMatcher(lessonContext, candidates, topN);
        return { ranked, source: "ml" as const };
    } catch {
        return { ranked: fallbackRankCandidates(lessonContext, candidates).slice(0, topN), source: "fallback" as const };
    }
}

export async function buildSubstituteMatchSummary(input: { planId?: string; slotId?: string; teacherId?: string }) {
    const plan = await prisma.schedulePlan.findFirst({
        where: input.planId ? { id: input.planId } : { status: "published" },
        orderBy: input.planId ? undefined : { publishedAt: "desc" },
        include: {
            slots: {
                include: {
                    schoolClass: true,
                    subject: true,
                    room: true,
                    teacher: {
                        include: {
                            user: true,
                            assignments: {
                                include: {
                                    subject: true,
                                    schoolClass: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!plan) return null;

    const targetSlot = input.slotId
        ? plan.slots.find((slot) => slot.id === input.slotId) ?? null
        : plan.slots.find((slot) => slot.teacherId === input.teacherId) ?? null;

    if (!targetSlot?.teacher || !targetSlot.subject) return null;

    const teachers = await prisma.teacher.findMany({
        include: {
            user: true,
            assignments: {
                include: {
                    subject: true,
                    schoolClass: true,
                },
            },
            scheduleSlots: {
                where: { schedulePlanId: plan.id },
                include: {
                    room: true,
                },
            },
        },
    });

    const roomName = targetSlot.room?.name ?? "Без кабинета";
    const roomTypeRequired = inferRoomTypeRequired(targetSlot.subject.name, roomName);
    const lessonContext: LessonContext = {
        subject_name: normalizeSubjectName(targetSlot.subject.name),
        grade_level: targetSlot.schoolClass.grade,
        class_group_type: inferClassGroupType(targetSlot.split, roomTypeRequired),
        lesson_slot_index: targetSlot.slotIndex,
        day_of_week: DAY_CODE_MAP[targetSlot.dayOfWeek] ?? "Mon",
        room_type_required: roomTypeRequired,
        stream_complexity_level: inferStreamComplexityLevel(targetSlot.split, roomTypeRequired, targetSlot.schoolClass.grade),
        original_teacher_experience_years: inferTeacherExperienceYears(targetSlot.teacher.assignments.length),
    };

    const candidates = teachers
        .filter((teacher) => teacher.id !== targetSlot.teacherId)
        .map((teacher): SubstituteCandidateInput => {
            const assignmentsBySubject = [...teacher.assignments]
                .map((assignment) => normalizeSubjectName(assignment.subject.name))
                .reduce<Map<string, number>>((map, subjectName) => {
                    map.set(subjectName, (map.get(subjectName) ?? 0) + 1);
                    return map;
                }, new Map());

            const specializations = [...assignmentsBySubject.entries()].sort((left, right) => right[1] - left[1]).map(([subjectName]) => subjectName);
            const teacherSlots = teacher.scheduleSlots.filter((slot) => slot.dayOfWeek === targetSlot.dayOfWeek);
            const teacherTimeIndices = teacherSlots.map((slot) => slot.slotIndex);
            const isAvailable = !teacherSlots.some((slot) =>
                slot.slotIndex === targetSlot.slotIndex && slot.durationSlots === targetSlot.durationSlots,
            );
            const { gapBefore, gapAfter } = computeGaps(teacherTimeIndices, targetSlot.slotIndex);
            const dailyLoad = teacherSlots.length;
            const weeklyLoad = teacher.assignments.length * 5 + teacher.scheduleSlots.length;
            const consecutiveLessonsToday = computeLongestRun(teacherTimeIndices);
            const roomDistanceScore = inferRoomDistanceScore(roomName, teacherSlots.map((slot) => slot.room?.name ?? ""));
            const recentSubstitutionsCount = clamp(Math.max(0, dailyLoad - 2), 0, 5);
            const burnoutRiskScore = clamp(dailyLoad / 8 * 0.4 + weeklyLoad / 30 * 0.35 + consecutiveLessonsToday / 5 * 0.25, 0.1, 0.95);
            const scheduleDisruptionScore = clamp(
                (isAvailable ? 0.1 : 0.9) +
                    roomDistanceScore * 0.25 +
                    (gapBefore === 0 && gapAfter === 0 ? 0.2 : 0.05) +
                    dailyLoad / 10 * 0.2,
                0,
                1,
            );
            const prefersGradeBand = teacher.assignments.some((assignment) => assignment.schoolClass.grade >= 10) ? "high" : "middle";

            return {
                candidate_teacher_id: teacher.id,
                candidate_subject_specialization: specializations[0] ?? "None",
                candidate_secondary_specialization: specializations[1] ?? null,
                candidate_experience_years: inferTeacherExperienceYears(teacher.assignments.length),
                candidate_has_taught_this_grade: teacher.assignments.some((assignment) => assignment.schoolClass.grade === targetSlot.schoolClass.grade) ? 1 : 0,
                candidate_has_taught_this_class_before: teacher.assignments.some((assignment) => assignment.classId === targetSlot.classId) ? 1 : 0,
                candidate_is_available: isAvailable ? 1 : 0,
                candidate_current_daily_load: dailyLoad,
                candidate_current_weekly_load: weeklyLoad,
                candidate_consecutive_lessons_today: consecutiveLessonsToday,
                candidate_gap_before_lesson: gapBefore,
                candidate_gap_after_lesson: gapAfter,
                candidate_room_distance_score: Number(roomDistanceScore.toFixed(2)),
                candidate_recent_substitutions_count: recentSubstitutionsCount,
                candidate_burnout_risk_score: Number(burnoutRiskScore.toFixed(2)),
                candidate_schedule_disruption_score: Number(scheduleDisruptionScore.toFixed(2)),
                candidate_prefers_grade_band: prefersGradeBand,
            };
        });

    if (candidates.length === 0) return null;

    const { ranked, source } = await rankSubstituteCandidates(lessonContext, candidates, 5);
    const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher.user.fullName]));

    return {
        absentTeacher: {
            teacherId: targetSlot.teacher.id,
            teacherName: targetSlot.teacher.user.fullName,
        },
        lesson: {
            slotId: targetSlot.id,
            subjectName: targetSlot.subject.name,
            className: targetSlot.schoolClass.name,
            timeLabel: targetSlot.timeLabel,
            room: roomName,
        },
        candidates: ranked.map((candidate) => ({
            ...candidate,
            teacherName: teacherMap.get(candidate.candidate_teacher_id) ?? candidate.candidate_teacher_id,
            availability: (candidates.find((item) => item.candidate_teacher_id === candidate.candidate_teacher_id)?.candidate_is_available ?? 0) === 1,
        })),
        source,
    } satisfies SubstituteMatchSummary;
}

export async function getScheduleSubstituteMatches(planId?: string): Promise<SubstituteMatchSummary | null> {
    const activeAbsence = await prisma.teacherAbsence.findFirst({
        where: { status: TeacherAbsenceStatus.active },
        orderBy: { startsAt: "asc" },
    });
    if (!activeAbsence) return null;

    return buildSubstituteMatchSummary({
        planId,
        teacherId: activeAbsence.teacherId,
    });
}
