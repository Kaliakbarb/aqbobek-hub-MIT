import {
    AvailabilityStatus,
    BroadcastAudienceType,
    EventLogKind,
    KioskItemType,
    Prisma,
    RoomType,
    ScheduleGenerationMode,
    ScheduleItemType,
    SchedulePlanStatus,
    ScheduleSlotSourceType,
    TeacherAbsenceStatus,
} from "@prisma/client";
import { prisma } from "./prisma";
import { DAY_LABELS, SCHEDULE_DAYS, SLOT_TEMPLATES, buildSlotDate, formatWeekLabel, getSlotTimeLabel, getWeekStartDate } from "./schedule-constants";

type RoomRecord = Awaited<ReturnType<typeof loadPlanningContext>>["rooms"][number];
type ScheduleRequirementRecord = Awaited<ReturnType<typeof loadPlanningContext>>["requirements"][number];
type ScheduleBandRecord = Awaited<ReturnType<typeof loadPlanningContext>>["bands"][number];
type ExistingPlan = Awaited<ReturnType<typeof loadExistingPlan>>;

type ConflictDraft = Prisma.ScheduleConflictUncheckedCreateWithoutSchedulePlanInput;
type SlotDraft = Prisma.ScheduleSlotUncheckedCreateWithoutSchedulePlanInput;

type PlacementCandidate = {
    dayOfWeek: number;
    slotIndex: number;
    score: number;
    slots: SlotDraft[];
};

type SolverUnit =
    | {
        kind: "requirement";
        key: string;
        classId: string;
        subjectId: string | null;
        preferredTeacherId: string | null;
        candidateTeacherIds: string[];
        title: string | null;
        durationSlots: number;
        itemType: ScheduleItemType;
        roomTypeRequired: RoomType | null;
        difficulty: number;
        lockedDayOfWeek: number | null;
        lockedSlotIndex: number | null;
        sourceType: ScheduleSlotSourceType;
        split: boolean;
        preferredRoomId: string | null;
        originalTeacherId: string | null;
    }
    | {
        kind: "band";
        key: string;
        bandId: string;
        title: string;
        durationSlots: number;
        itemType: ScheduleItemType;
        sourceType: ScheduleSlotSourceType;
        members: Array<{
            key: string;
            classId: string;
            subjectId: string | null;
            preferredTeacherId: string | null;
            candidateTeacherIds: string[];
            title: string | null;
            preferredRoomId: string | null;
            roomTypeRequired: RoomType | null;
            difficulty: number;
        }>;
    };

type SolverState = {
    slots: SlotDraft[];
    classOccupancy: Set<string>;
    teacherOccupancy: Set<string>;
    roomOccupancy: Set<string>;
    classDayLoad: Map<string, number>;
    teacherDayLoad: Map<string, number>;
    score: number;
    placedCount: number;
    conflicts: ConflictDraft[];
};

type ConstraintSummary = Awaited<ReturnType<typeof getScheduleConstraintBundle>>;
const MIN_CLASS_DAILY_SLOTS = 5;

function occupancyKey(type: "class" | "teacher" | "room", id: string, dayOfWeek: number, slotIndex: number) {
    return `${type}:${id}:${dayOfWeek}:${slotIndex}`;
}

function mapIncrement(map: Map<string, number>, key: string, delta = 1) {
    map.set(key, (map.get(key) ?? 0) + delta);
}

function cloneState(state: SolverState): SolverState {
    return {
        slots: [...state.slots],
        classOccupancy: new Set(state.classOccupancy),
        teacherOccupancy: new Set(state.teacherOccupancy),
        roomOccupancy: new Set(state.roomOccupancy),
        classDayLoad: new Map(state.classDayLoad),
        teacherDayLoad: new Map(state.teacherDayLoad),
        score: state.score,
        placedCount: state.placedCount,
        conflicts: [...state.conflicts],
    };
}

function getSeverityForDifficulty(difficulty: number): "low" | "medium" | "high" {
    if (difficulty >= 4) return "high";
    if (difficulty >= 2) return "medium";
    return "low";
}

function matchesRoomType(roomType: RoomType, required: RoomType | null) {
    if (!required) return true;
    if (required === RoomType.standard) {
        return roomType === RoomType.standard || roomType === RoomType.lecture;
    }
    return roomType === required;
}

async function loadPlanningContext(weekStartDate: Date) {
    const [classes, teachers, rooms, requirements, bands, activeAbsences] = await Promise.all([
        prisma.schoolClass.findMany({ orderBy: { name: "asc" } }),
        prisma.teacher.findMany({
            include: {
                user: true,
                assignments: true,
                availabilities: true,
            },
            orderBy: { user: { fullName: "asc" } },
        }),
        prisma.room.findMany({
            where: { active: true },
            include: { availabilities: true },
            orderBy: { name: "asc" },
        }),
        prisma.scheduleRequirement.findMany({
            include: {
                schoolClass: true,
                subject: true,
                teacher: {
                    include: { user: true, assignments: true },
                },
            },
            orderBy: [{ itemType: "asc" }, { classId: "asc" }],
        }),
        prisma.scheduleBand.findMany({
            include: {
                members: {
                    include: {
                        schoolClass: true,
                        subject: true,
                        teacher: {
                            include: { user: true, assignments: true },
                        },
                        room: true,
                    },
                    orderBy: [{ classId: "asc" }, { label: "asc" }],
                },
            },
            orderBy: { title: "asc" },
        }),
        prisma.teacherAbsence.findMany({
            where: {
                status: TeacherAbsenceStatus.active,
                startsAt: { lte: buildSlotDate(weekStartDate, 5) },
                endsAt: { gte: weekStartDate },
            },
        }),
    ]);

    return { classes, teachers, rooms, requirements, bands, activeAbsences, weekStartDate };
}

async function loadExistingPlan(planId?: string) {
    return prisma.schedulePlan.findFirst({
        where: planId ? { id: planId } : { status: SchedulePlanStatus.published },
        orderBy: planId ? undefined : { publishedAt: "desc" },
        include: {
            slots: {
                include: {
                    schoolClass: true,
                    subject: true,
                    teacher: { include: { user: true } },
                    room: true,
                    originalTeacher: { include: { user: true } },
                },
            },
            conflicts: true,
        },
    });
}

function buildExistingPlanIndex(existingPlan: ExistingPlan) {
    const index = new Set<string>();
    for (const slot of existingPlan?.slots ?? []) {
        const title = slot.title ?? slot.subject?.name ?? "slot";
        index.add(`${slot.classId}:${title}:${slot.dayOfWeek}:${slot.slotIndex}`);
    }
    return index;
}

function isTeacherAvailable(
    teacherId: string,
    dayOfWeek: number,
    slotIndex: number,
    durationSlots: number,
    context: Awaited<ReturnType<typeof loadPlanningContext>>,
) {
    const teacher = context.teachers.find((item) => item.id === teacherId);
    if (!teacher) return false;

    for (let offset = 0; offset < durationSlots; offset += 1) {
        const currentSlot = slotIndex + offset;
        const availability = teacher.availabilities.find((item) => item.dayOfWeek === dayOfWeek && item.slotIndex === currentSlot);
        if (availability?.status === AvailabilityStatus.unavailable) return false;
        const slotDate = buildSlotDate(context.weekStartDate, dayOfWeek);
        if (
            context.activeAbsences.some(
                (absence) =>
                    absence.teacherId === teacherId &&
                    absence.startsAt <= slotDate &&
                    absence.endsAt >= slotDate,
            )
        ) {
            return false;
        }
    }

    return true;
}

function isRoomAvailable(room: RoomRecord, dayOfWeek: number, slotIndex: number, durationSlots: number) {
    for (let offset = 0; offset < durationSlots; offset += 1) {
        const currentSlot = slotIndex + offset;
        const availability = room.availabilities.find((item) => item.dayOfWeek === dayOfWeek && item.slotIndex === currentSlot);
        if (availability?.status === AvailabilityStatus.unavailable) return false;
    }
    return true;
}

function buildTeacherCandidateIdsForRequirement(requirement: ScheduleRequirementRecord, context: Awaited<ReturnType<typeof loadPlanningContext>>) {
    if (requirement.teacherId) return [requirement.teacherId];
    if (!requirement.subjectId) return [];

    const direct = context.teachers
        .filter((teacher) => teacher.assignments.some((assignment) => assignment.classId === requirement.classId && assignment.subjectId === requirement.subjectId))
        .map((teacher) => teacher.id);
    if (direct.length > 0) return direct;

    return context.teachers
        .filter((teacher) => teacher.assignments.some((assignment) => assignment.subjectId === requirement.subjectId))
        .map((teacher) => teacher.id);
}

function buildTeacherCandidateIdsForBandMember(
    member: ScheduleBandRecord["members"][number],
    context: Awaited<ReturnType<typeof loadPlanningContext>>,
) {
    if (member.teacherId) return [member.teacherId];
    if (!member.subjectId) return [];
    const direct = context.teachers
        .filter((teacher) => teacher.assignments.some((assignment) => assignment.classId === member.classId && assignment.subjectId === member.subjectId))
        .map((teacher) => teacher.id);
    if (direct.length > 0) return direct;
    return context.teachers
        .filter((teacher) => teacher.assignments.some((assignment) => assignment.subjectId === member.subjectId))
        .map((teacher) => teacher.id);
}

function buildSolverUnits(
    context: Awaited<ReturnType<typeof loadPlanningContext>>,
    existingPlan: ExistingPlan,
    overrideUnits?: SolverUnit[],
) {
    if (overrideUnits) return overrideUnits;

    const units: SolverUnit[] = [];
    for (const requirement of context.requirements.filter((item) => !item.bandId)) {
        for (let index = 0; index < requirement.unitsPerWeek; index += 1) {
            units.push({
                kind: "requirement",
                key: `${requirement.id}:${index}`,
                classId: requirement.classId,
                subjectId: requirement.subjectId,
                preferredTeacherId: requirement.teacherId,
                candidateTeacherIds: buildTeacherCandidateIdsForRequirement(requirement, context),
                title: requirement.title ?? requirement.subject?.name ?? null,
                durationSlots: requirement.durationSlots,
                itemType: requirement.itemType,
                roomTypeRequired: requirement.roomTypeRequired,
                difficulty: requirement.difficulty,
                lockedDayOfWeek: requirement.lockedDayOfWeek,
                lockedSlotIndex: requirement.lockedSlotIndex,
                sourceType: ScheduleSlotSourceType.generated,
                split: false,
                preferredRoomId: null,
                originalTeacherId: requirement.teacherId,
            });
        }
    }

    for (const band of context.bands) {
        for (let index = 0; index < band.unitsPerWeek; index += 1) {
            units.push({
                kind: "band",
                key: `${band.id}:${index}`,
                bandId: band.id,
                title: band.title,
                durationSlots: band.durationSlots,
                itemType: band.itemType,
                sourceType: ScheduleSlotSourceType.generated,
                members: band.members.map((member) => ({
                    key: member.id,
                    classId: member.classId,
                    subjectId: member.subjectId,
                    preferredTeacherId: member.teacherId,
                    candidateTeacherIds: buildTeacherCandidateIdsForBandMember(member, context),
                    title: member.title ?? member.subject?.name ?? member.label ?? band.title,
                    preferredRoomId: member.roomId,
                    roomTypeRequired: member.room?.type ?? RoomType.standard,
                    difficulty: 3,
                })),
            });
        }
    }

    const existingIndex = buildExistingPlanIndex(existingPlan);
    return units.sort((left, right) => {
        const leftComplexity =
            (left.kind === "band" ? 100 : 0) +
            left.durationSlots * 10 +
            (left.kind === "band" ? left.members.length * 8 : left.difficulty * 3) +
            (left.kind === "requirement" && left.lockedDayOfWeek ? 20 : 0);
        const rightComplexity =
            (right.kind === "band" ? 100 : 0) +
            right.durationSlots * 10 +
            (right.kind === "band" ? right.members.length * 8 : right.difficulty * 3) +
            (right.kind === "requirement" && right.lockedDayOfWeek ? 20 : 0);
        if (leftComplexity !== rightComplexity) {
            return rightComplexity - leftComplexity;
        }
        const leftTitle = left.kind === "band" ? left.title : left.title ?? left.key;
        const rightTitle = right.kind === "band" ? right.title : right.title ?? right.key;
        const leftBoost = existingIndex.has(`${left.kind === "band" ? left.members[0]?.classId ?? left.key : left.classId}:${leftTitle}:1:1`) ? 1 : 0;
        const rightBoost = existingIndex.has(`${right.kind === "band" ? right.members[0]?.classId ?? right.key : right.classId}:${rightTitle}:1:1`) ? 1 : 0;
        if (leftBoost !== rightBoost) return rightBoost - leftBoost;
        return leftTitle.localeCompare(rightTitle, "ru");
    });
}

function getRoomCandidates(
    context: Awaited<ReturnType<typeof loadPlanningContext>>,
    preferredRoomId: string | null,
    roomTypeRequired: RoomType | null,
) {
    const rooms = context.rooms.filter((room) => matchesRoomType(room.type, roomTypeRequired));
    if (preferredRoomId) {
        const preferred = rooms.find((room) => room.id === preferredRoomId);
        if (preferred) {
            return [preferred, ...rooms.filter((room) => room.id !== preferredRoomId)];
        }
    }
    return rooms;
}

function scorePlacement(
    unit: SolverUnit,
    dayOfWeek: number,
    slotIndex: number,
    state: SolverState,
    existingPlan: ExistingPlan,
) {
    const existingIndex = buildExistingPlanIndex(existingPlan);
    let score = 0;
    const targetDailyLoad = 5;

    if (unit.kind === "requirement") {
        const title = unit.title ?? unit.key;
        if (existingIndex.has(`${unit.classId}:${title}:${dayOfWeek}:${slotIndex}`)) {
            score += 8;
        }
        const currentClassDayLoad = state.classDayLoad.get(`${unit.classId}:${dayOfWeek}`) ?? 0;
        score += Math.max(0, 5 - unit.difficulty);
        score -= dayOfWeek * 0.15;
        score -= slotIndex * 0.08;
        score += currentClassDayLoad < targetDailyLoad ? (targetDailyLoad - currentClassDayLoad) * 1.6 : -currentClassDayLoad * 0.5;
        if (unit.preferredTeacherId) {
            score -= (state.teacherDayLoad.get(`${unit.preferredTeacherId}:${dayOfWeek}`) ?? 0) * 0.5;
        }
        if (unit.itemType === ScheduleItemType.pair) score += 2;
    } else {
        score += 12;
        score -= dayOfWeek * 0.15;
        score -= slotIndex * 0.08;
        const uniqueClasses = new Set(unit.members.map((member) => member.classId));
        for (const classId of uniqueClasses) {
            const currentClassDayLoad = state.classDayLoad.get(`${classId}:${dayOfWeek}`) ?? 0;
            score += currentClassDayLoad < targetDailyLoad ? (targetDailyLoad - currentClassDayLoad) * 1.3 : -currentClassDayLoad * 0.35;
        }
    }

    return score;
}

function tryPlaceRequirement(
    unit: Extract<SolverUnit, { kind: "requirement" }>,
    dayOfWeek: number,
    slotIndex: number,
    state: SolverState,
    context: Awaited<ReturnType<typeof loadPlanningContext>>,
    existingPlan: ExistingPlan,
): PlacementCandidate | null {
    if (slotIndex + unit.durationSlots - 1 > SLOT_TEMPLATES.length) return null;

    for (let offset = 0; offset < unit.durationSlots; offset += 1) {
        const currentSlot = slotIndex + offset;
        if (state.classOccupancy.has(occupancyKey("class", unit.classId, dayOfWeek, currentSlot))) {
            return null;
        }
    }

    let assignedTeacherId: string | null = unit.preferredTeacherId;
    if (unit.candidateTeacherIds.length > 0) {
        const teacherCandidates = unit.candidateTeacherIds
            .filter((teacherId) => isTeacherAvailable(teacherId, dayOfWeek, slotIndex, unit.durationSlots, context))
            .filter((teacherId) =>
                Array.from({ length: unit.durationSlots }).every((_, offset) => !state.teacherOccupancy.has(occupancyKey("teacher", teacherId, dayOfWeek, slotIndex + offset))),
            )
            .sort((left, right) => {
                const leftLoad = state.teacherDayLoad.get(`${left}:${dayOfWeek}`) ?? 0;
                const rightLoad = state.teacherDayLoad.get(`${right}:${dayOfWeek}`) ?? 0;
                if (left === unit.preferredTeacherId) return -1;
                if (right === unit.preferredTeacherId) return 1;
                return leftLoad - rightLoad;
            });
        assignedTeacherId = teacherCandidates[0] ?? null;
        if (!assignedTeacherId) return null;
    }

    const room = getRoomCandidates(context, unit.preferredRoomId, unit.roomTypeRequired)
        .filter((candidate) => isRoomAvailable(candidate, dayOfWeek, slotIndex, unit.durationSlots))
        .find((candidate) =>
            Array.from({ length: unit.durationSlots }).every((_, offset) => !state.roomOccupancy.has(occupancyKey("room", candidate.id, dayOfWeek, slotIndex + offset))),
        );

    if (!room) return null;

    const slot: SlotDraft = {
        classId: unit.classId,
        subjectId: unit.subjectId,
        teacherId: assignedTeacherId,
        originalTeacherId: unit.originalTeacherId ?? assignedTeacherId,
        roomId: room.id,
        dayOfWeek,
        slotIndex,
        durationSlots: unit.durationSlots,
        itemType: unit.itemType,
        title: unit.title,
        timeLabel: getSlotTimeLabel(slotIndex, unit.durationSlots),
        split: unit.split,
        sourceType: unit.sourceType,
        locked: unit.lockedDayOfWeek != null,
        bandId: null,
    };

    return {
        dayOfWeek,
        slotIndex,
        score: scorePlacement(unit, dayOfWeek, slotIndex, state, existingPlan),
        slots: [slot],
    };
}

function tryPlaceBand(
    unit: Extract<SolverUnit, { kind: "band" }>,
    dayOfWeek: number,
    slotIndex: number,
    state: SolverState,
    context: Awaited<ReturnType<typeof loadPlanningContext>>,
    existingPlan: ExistingPlan,
): PlacementCandidate | null {
    if (slotIndex + unit.durationSlots - 1 > SLOT_TEMPLATES.length) return null;

    const uniqueClasses = [...new Set(unit.members.map((member) => member.classId))];
    for (const classId of uniqueClasses) {
        for (let offset = 0; offset < unit.durationSlots; offset += 1) {
            if (state.classOccupancy.has(occupancyKey("class", classId, dayOfWeek, slotIndex + offset))) {
                return null;
            }
        }
    }

    const slots: SlotDraft[] = [];
    const usedTeacherIds = new Set<string>();
    const usedRoomIds = new Set<string>();

    for (const member of unit.members) {
        let assignedTeacherId: string | null = member.preferredTeacherId;
        if (member.candidateTeacherIds.length > 0) {
            const teacherCandidates = member.candidateTeacherIds
                .filter((teacherId) => !usedTeacherIds.has(teacherId))
                .filter((teacherId) => isTeacherAvailable(teacherId, dayOfWeek, slotIndex, unit.durationSlots, context))
                .filter((teacherId) =>
                    Array.from({ length: unit.durationSlots }).every((_, offset) => !state.teacherOccupancy.has(occupancyKey("teacher", teacherId, dayOfWeek, slotIndex + offset))),
                )
                .sort((left, right) => (state.teacherDayLoad.get(`${left}:${dayOfWeek}`) ?? 0) - (state.teacherDayLoad.get(`${right}:${dayOfWeek}`) ?? 0));
            assignedTeacherId = teacherCandidates[0] ?? null;
            if (!assignedTeacherId) return null;
        }

        const room = getRoomCandidates(context, member.preferredRoomId, member.roomTypeRequired)
            .filter((candidate) => !usedRoomIds.has(candidate.id))
            .filter((candidate) => isRoomAvailable(candidate, dayOfWeek, slotIndex, unit.durationSlots))
            .find((candidate) =>
                Array.from({ length: unit.durationSlots }).every((_, offset) => !state.roomOccupancy.has(occupancyKey("room", candidate.id, dayOfWeek, slotIndex + offset))),
            );

        if (!room) return null;

        if (assignedTeacherId) usedTeacherIds.add(assignedTeacherId);
        usedRoomIds.add(room.id);

        slots.push({
            classId: member.classId,
            subjectId: member.subjectId,
            teacherId: assignedTeacherId,
            originalTeacherId: assignedTeacherId,
            roomId: room.id,
            dayOfWeek,
            slotIndex,
            durationSlots: unit.durationSlots,
            itemType: unit.itemType,
            title: member.title ?? unit.title,
            timeLabel: getSlotTimeLabel(slotIndex, unit.durationSlots),
            split: true,
            sourceType: unit.sourceType,
            locked: false,
            bandId: unit.bandId,
        });
    }

    return {
        dayOfWeek,
        slotIndex,
        score: scorePlacement(unit, dayOfWeek, slotIndex, state, existingPlan),
        slots,
    };
}

function getCandidatesForUnit(
    unit: SolverUnit,
    state: SolverState,
    context: Awaited<ReturnType<typeof loadPlanningContext>>,
    existingPlan: ExistingPlan,
) {
    const dayCandidates = unit.kind === "requirement" && unit.lockedDayOfWeek ? [unit.lockedDayOfWeek] : [...SCHEDULE_DAYS];
    const slotCandidates = unit.kind === "requirement" && unit.lockedSlotIndex ? [unit.lockedSlotIndex] : SLOT_TEMPLATES.map((slot) => slot.index);
    const placements: PlacementCandidate[] = [];

    for (const dayOfWeek of dayCandidates) {
        for (const slotIndex of slotCandidates) {
            const candidate =
                unit.kind === "requirement"
                    ? tryPlaceRequirement(unit, dayOfWeek, slotIndex, state, context, existingPlan)
                    : tryPlaceBand(unit, dayOfWeek, slotIndex, state, context, existingPlan);
            if (candidate) placements.push(candidate);
        }
    }

    return placements
        .sort((left, right) => right.score - left.score)
        .slice(0, 12);
}

function applyCandidate(state: SolverState, candidate: PlacementCandidate) {
    const next = cloneState(state);
    next.score += candidate.score;
    next.placedCount += 1;
    next.slots.push(...candidate.slots);

    for (const slot of candidate.slots) {
        const durationSlots = slot.durationSlots ?? 1;
        const dayOfWeek = slot.dayOfWeek ?? 1;
        const slotIndex = slot.slotIndex ?? 1;
        for (let offset = 0; offset < durationSlots; offset += 1) {
            const currentSlot = slotIndex + offset;
            next.classOccupancy.add(occupancyKey("class", slot.classId, dayOfWeek, currentSlot));
            if (slot.teacherId) next.teacherOccupancy.add(occupancyKey("teacher", slot.teacherId, dayOfWeek, currentSlot));
            if (slot.roomId) next.roomOccupancy.add(occupancyKey("room", slot.roomId, dayOfWeek, currentSlot));
        }

        mapIncrement(next.classDayLoad, `${slot.classId}:${dayOfWeek}`, durationSlots);
        if (slot.teacherId) {
            mapIncrement(next.teacherDayLoad, `${slot.teacherId}:${dayOfWeek}`, durationSlots);
        }
    }

    return next;
}

function createInitialState(lockedSlots: SlotDraft[] = []): SolverState {
    const state: SolverState = {
        slots: [],
        classOccupancy: new Set(),
        teacherOccupancy: new Set(),
        roomOccupancy: new Set(),
        classDayLoad: new Map(),
        teacherDayLoad: new Map(),
        score: 0,
        placedCount: 0,
        conflicts: [],
    };

    for (const slot of lockedSlots) {
        const candidate: PlacementCandidate = { dayOfWeek: slot.dayOfWeek ?? 1, slotIndex: slot.slotIndex ?? 1, score: 5, slots: [slot] };
        const next = applyCandidate(state, candidate);
        state.slots = next.slots;
        state.classOccupancy = next.classOccupancy;
        state.teacherOccupancy = next.teacherOccupancy;
        state.roomOccupancy = next.roomOccupancy;
        state.classDayLoad = next.classDayLoad;
        state.teacherDayLoad = next.teacherDayLoad;
        state.score = next.score;
        state.placedCount = next.placedCount;
    }

    return state;
}

function ensureMinimumDailyLoad(
    slots: SlotDraft[],
    context: Awaited<ReturnType<typeof loadPlanningContext>>,
    conflicts: ConflictDraft[],
) {
    const nextSlots = [...slots];
    const classOccupancy = new Set<string>();
    const roomOccupancy = new Set<string>();

    for (const slot of nextSlots) {
        const dayOfWeek = slot.dayOfWeek ?? 1;
        const slotIndex = slot.slotIndex ?? 1;
        const durationSlots = slot.durationSlots ?? 1;
        for (let offset = 0; offset < durationSlots; offset += 1) {
            classOccupancy.add(occupancyKey("class", slot.classId, dayOfWeek, slotIndex + offset));
            if (slot.roomId) roomOccupancy.add(occupancyKey("room", slot.roomId, dayOfWeek, slotIndex + offset));
        }
    }

    for (const schoolClass of context.classes) {
        const preferredRoom = schoolClass.roomLabel
            ? context.rooms.find((room) => room.name === schoolClass.roomLabel) ?? null
            : null;

        for (const dayOfWeek of SCHEDULE_DAYS) {
            const occupied = new Set<number>();
            for (const slot of nextSlots.filter((item) => item.classId === schoolClass.id && (item.dayOfWeek ?? 1) === dayOfWeek)) {
                const start = slot.slotIndex ?? 1;
                const durationSlots = slot.durationSlots ?? 1;
                for (let offset = 0; offset < durationSlots; offset += 1) {
                    occupied.add(start + offset);
                }
            }

            const currentLoad = occupied.size;
            if (currentLoad >= MIN_CLASS_DAILY_SLOTS) continue;

            for (const slotTemplate of SLOT_TEMPLATES) {
                if (occupied.size >= MIN_CLASS_DAILY_SLOTS) break;
                if (occupied.has(slotTemplate.index)) continue;
                if (classOccupancy.has(occupancyKey("class", schoolClass.id, dayOfWeek, slotTemplate.index))) continue;

                const fillerRoom =
                    [preferredRoom, ...context.rooms.filter((room) => room.id !== preferredRoom?.id)]
                        .filter(Boolean)
                        .find((room) => room && !roomOccupancy.has(occupancyKey("room", room.id, dayOfWeek, slotTemplate.index))) ?? null;

                if (!fillerRoom) {
                    conflicts.push({
                        title: `Не удалось добрать 6 уроков для ${schoolClass.name}`,
                        description: `${DAY_LABELS[dayOfWeek]}: нет свободного кабинета для академического часа.`,
                        severity: "low",
                        resolved: false,
                        needsAttention: true,
                    });
                    continue;
                }

                const fillerSlot: SlotDraft = {
                    classId: schoolClass.id,
                    subjectId: null,
                    teacherId: null,
                    originalTeacherId: null,
                    roomId: fillerRoom.id,
                    dayOfWeek,
                    slotIndex: slotTemplate.index,
                    durationSlots: 1,
                    itemType: ScheduleItemType.academicHour,
                    title: "Академический час",
                    timeLabel: slotTemplate.label,
                    split: false,
                    sourceType: ScheduleSlotSourceType.generated,
                    locked: false,
                    bandId: null,
                };

                nextSlots.push(fillerSlot);
                occupied.add(slotTemplate.index);
                classOccupancy.add(occupancyKey("class", schoolClass.id, dayOfWeek, slotTemplate.index));
                roomOccupancy.add(occupancyKey("room", fillerRoom.id, dayOfWeek, slotTemplate.index));
            }
        }
    }

    return nextSlots;
}

function solveUnits(
    units: SolverUnit[],
    context: Awaited<ReturnType<typeof loadPlanningContext>>,
    existingPlan: ExistingPlan,
    state = createInitialState(),
    index = 0,
): SolverState {
    if (index >= units.length) return state;

    const unit = units[index];
    const candidates = getCandidatesForUnit(unit, state, context, existingPlan);
    if (candidates.length === 0) {
        const next = cloneState(state);
        next.conflicts.push({
            title: unit.kind === "band" ? `Не размещена лента ${unit.title}` : `Не размещен блок ${unit.title ?? unit.key}`,
            description:
                unit.kind === "band"
                    ? "Не удалось найти общий слот без конфликтов по кабинетам, учителям и классам."
                    : "Не удалось найти свободный слот с учетом доступности кабинетов и преподавателей.",
            severity: unit.kind === "band" ? "high" : getSeverityForDifficulty(unit.kind === "requirement" ? unit.difficulty : 3),
            resolved: false,
            needsAttention: true,
        });
        return solveUnits(units, context, existingPlan, next, index + 1);
    }

    const branchWidth = index < 4 ? 3 : index < 8 ? 2 : 1;
    let best: SolverState | null = null;
    for (const candidate of candidates.slice(0, branchWidth)) {
        const applied = applyCandidate(state, candidate);
        const solved = solveUnits(units, context, existingPlan, applied, index + 1);
        if (!best || solved.placedCount > best.placedCount || (solved.placedCount === best.placedCount && solved.score > best.score)) {
            best = solved;
        }
    }

    return best ?? state;
}

async function persistPlan(
    data: {
    title: string;
    weekStartDate: Date;
    createdById?: string;
    status: SchedulePlanStatus;
    generationMode: ScheduleGenerationMode;
    regenerationReason?: string | null;
    basedOnPlanId?: string | null;
    slots: SlotDraft[];
    conflicts: ConflictDraft[];
},
    client: Prisma.TransactionClient | typeof prisma = prisma,
) {
    return client.schedulePlan.create({
        data: {
            title: data.title,
            weekStartDate: data.weekStartDate,
            status: data.status,
            generationMode: data.generationMode,
            regenerationReason: data.regenerationReason ?? null,
            basedOnPlanId: data.basedOnPlanId ?? null,
            publishedAt: data.status === SchedulePlanStatus.published ? new Date() : null,
            createdById: data.createdById,
            slots: {
                createMany: {
                    data: data.slots.map((slot) => ({
                        ...slot,
                        title: slot.title ?? undefined,
                        originalTeacherId: slot.originalTeacherId ?? undefined,
                        teacherId: slot.teacherId ?? undefined,
                        subjectId: slot.subjectId ?? undefined,
                        roomId: slot.roomId ?? undefined,
                        bandId: slot.bandId ?? undefined,
                    })),
                },
            },
            conflicts: data.conflicts.length > 0
                ? {
                    createMany: {
                        data: data.conflicts.map((conflict) => ({
                            title: conflict.title,
                            description: conflict.description,
                            severity: conflict.severity,
                            resolved: conflict.resolved ?? false,
                            needsAttention: conflict.needsAttention ?? false,
                        })),
                    },
                }
                : undefined,
        },
    });
}

async function createScheduleEventLog(title: string, note: string, userId?: string) {
    await prisma.eventLog.create({
        data: {
            title,
            note,
            kind: EventLogKind.schedule,
            userId,
        },
    });
}

async function createScheduleNotifications(input: {
    classIds: string[];
    targetTeacherUserIds: string[];
    text: string;
    createdByUserId?: string;
    kioskTitle: string;
}) {
    const classIds = [...new Set(input.classIds)];
    const teacherUserIds = [...new Set(input.targetTeacherUserIds)];

    for (const classId of classIds) {
        const schoolClass = await prisma.schoolClass.findUnique({ where: { id: classId } });
        if (!schoolClass) continue;
        await prisma.broadcast.create({
            data: {
                audienceType: BroadcastAudienceType.class,
                audienceLabel: schoolClass.name,
                targetClassId: classId,
                text: input.text,
                createdByUserId: input.createdByUserId,
            },
        });
    }

    for (const targetUserId of teacherUserIds) {
        await prisma.broadcast.create({
            data: {
                audienceType: BroadcastAudienceType.user,
                audienceLabel: "Личное уведомление учителю",
                targetUserId,
                text: input.text,
                createdByUserId: input.createdByUserId,
            },
        });
    }

    await prisma.kioskItem.create({
        data: {
            type: KioskItemType.replacement,
            title: input.kioskTitle,
            body: input.text,
            priority: 95,
        },
    });
}

export async function getScheduleConstraintBundle() {
    const [rooms, teachers, requirements, bands, absences] = await Promise.all([
        prisma.room.findMany({ include: { availabilities: true }, orderBy: { name: "asc" } }),
        prisma.teacher.findMany({
            include: {
                user: true,
                availabilities: true,
            },
            orderBy: { user: { fullName: "asc" } },
        }),
        prisma.scheduleRequirement.findMany({
            include: {
                schoolClass: true,
                subject: true,
                teacher: { include: { user: true } },
                band: true,
            },
            orderBy: [{ classId: "asc" }, { itemType: "asc" }],
        }),
        prisma.scheduleBand.findMany({
            include: {
                members: {
                    include: {
                        schoolClass: true,
                        subject: true,
                        teacher: { include: { user: true } },
                        room: true,
                    },
                },
            },
            orderBy: { title: "asc" },
        }),
        prisma.teacherAbsence.findMany({
            where: { status: TeacherAbsenceStatus.active },
            include: { teacher: { include: { user: true } } },
            orderBy: { startsAt: "asc" },
        }),
    ]);

    return {
        slots: SLOT_TEMPLATES,
        dayLabels: DAY_LABELS,
        rooms,
        teachers,
        requirements,
        bands,
        absences,
        summary: {
            roomCount: rooms.length,
            unavailableRoomCells: rooms.reduce(
                (sum, room) => sum + room.availabilities.filter((item) => item.status === AvailabilityStatus.unavailable).length,
                0,
            ),
            teacherCount: teachers.length,
            unavailableTeacherCells: teachers.reduce(
                (sum, teacher) => sum + teacher.availabilities.filter((item) => item.status === AvailabilityStatus.unavailable).length,
                0,
            ),
            requirementCount: requirements.length,
            bandCount: bands.length,
            activeAbsenceCount: absences.length,
        },
    };
}

export async function updateScheduleConstraints(payload: {
    rooms?: Array<{ id?: string; name: string; type: RoomType; capacity?: number; active?: boolean }>;
    teacherAvailability?: Array<{ teacherId: string; dayOfWeek: number; slotIndex: number; status: AvailabilityStatus }>;
    roomAvailability?: Array<{ roomId: string; dayOfWeek: number; slotIndex: number; status: AvailabilityStatus }>;
    requirements?: Array<{
        id?: string;
        classId: string;
        subjectId?: string | null;
        teacherId?: string | null;
        bandId?: string | null;
        title?: string | null;
        unitsPerWeek: number;
        durationSlots?: number;
        itemType?: ScheduleItemType;
        roomTypeRequired?: RoomType | null;
        difficulty?: number;
        lockedDayOfWeek?: number | null;
        lockedSlotIndex?: number | null;
    }>;
    bands?: Array<{
        id?: string;
        title: string;
        unitsPerWeek: number;
        durationSlots?: number;
        itemType?: ScheduleItemType;
        members: Array<{
            id?: string;
            classId: string;
            subjectId?: string | null;
            teacherId?: string | null;
            roomId?: string | null;
            label?: string | null;
            title?: string | null;
        }>;
    }>;
}) {
    await prisma.$transaction(async (tx) => {
        if (payload.rooms) {
            await tx.roomAvailability.deleteMany();
            await tx.room.deleteMany();
            await tx.room.createMany({
                data: payload.rooms.map((room) => ({
                    id: room.id,
                    name: room.name,
                    type: room.type,
                    capacity: room.capacity ?? 25,
                    active: room.active ?? true,
                })),
            });
        }

        if (payload.teacherAvailability) {
            await tx.teacherAvailability.deleteMany();
            if (payload.teacherAvailability.length > 0) {
                await tx.teacherAvailability.createMany({
                    data: payload.teacherAvailability,
                });
            }
        }

        if (payload.roomAvailability) {
            await tx.roomAvailability.deleteMany();
            if (payload.roomAvailability.length > 0) {
                await tx.roomAvailability.createMany({
                    data: payload.roomAvailability,
                });
            }
        }

        if (payload.bands) {
            await tx.scheduleBandMember.deleteMany();
            await tx.scheduleBand.deleteMany();
            for (const band of payload.bands) {
                await tx.scheduleBand.create({
                    data: {
                        id: band.id,
                        title: band.title,
                        unitsPerWeek: band.unitsPerWeek,
                        durationSlots: band.durationSlots ?? 1,
                        itemType: band.itemType ?? ScheduleItemType.band,
                        members: {
                            createMany: {
                                data: band.members.map((member) => ({
                                    id: member.id,
                                    classId: member.classId,
                                    subjectId: member.subjectId ?? undefined,
                                    teacherId: member.teacherId ?? undefined,
                                    roomId: member.roomId ?? undefined,
                                    label: member.label ?? undefined,
                                    title: member.title ?? undefined,
                                })),
                            },
                        },
                    },
                });
            }
        }

        if (payload.requirements) {
            await tx.scheduleRequirement.deleteMany();
            if (payload.requirements.length > 0) {
                await tx.scheduleRequirement.createMany({
                    data: payload.requirements.map((requirement) => ({
                        id: requirement.id,
                        classId: requirement.classId,
                        subjectId: requirement.subjectId ?? undefined,
                        teacherId: requirement.teacherId ?? undefined,
                        bandId: requirement.bandId ?? undefined,
                        title: requirement.title ?? undefined,
                        unitsPerWeek: requirement.unitsPerWeek,
                        durationSlots: requirement.durationSlots ?? 1,
                        itemType: requirement.itemType ?? ScheduleItemType.lesson,
                        roomTypeRequired: requirement.roomTypeRequired ?? undefined,
                        difficulty: requirement.difficulty ?? 1,
                        lockedDayOfWeek: requirement.lockedDayOfWeek ?? undefined,
                        lockedSlotIndex: requirement.lockedSlotIndex ?? undefined,
                    })),
                });
            }
        }
    }, { timeout: 20000 });

    return getScheduleConstraintBundle();
}

export async function generateSmartSchedule(input: {
    weekStartDate?: string | Date;
    createdById?: string;
    useExistingConstraints?: boolean;
}) {
    const weekStartDate = getWeekStartDate(input.weekStartDate);
    const context = await loadPlanningContext(weekStartDate);
    const existingPlan = await loadExistingPlan();
    const units = buildSolverUnits(context, existingPlan);
    const solved = solveUnits(units, context, existingPlan);
    const completedSlots = ensureMinimumDailyLoad(solved.slots, context, solved.conflicts);
    const title = `Smart Schedule • ${formatWeekLabel(weekStartDate)}`;
    const plan = await persistPlan({
        title,
        weekStartDate,
        createdById: input.createdById,
        status: SchedulePlanStatus.draft,
        generationMode: ScheduleGenerationMode.initial,
        slots: completedSlots,
        conflicts: solved.conflicts,
    });

    await createScheduleEventLog("Сгенерирован weekly draft", title, input.createdById);

    return {
        planId: plan.id,
        placedUnits: solved.placedCount,
        conflictCount: solved.conflicts.length,
        weekStartDate,
    };
}

function buildReoptimizationUnitsFromSlots(
    slots: NonNullable<ExistingPlan>["slots"],
    context: Awaited<ReturnType<typeof loadPlanningContext>>,
) {
    return slots.map((slot, index): SolverUnit => ({
        kind: "requirement",
        key: `reopt:${slot.id}:${index}`,
        classId: slot.classId,
        subjectId: slot.subjectId,
        preferredTeacherId: null,
        candidateTeacherIds:
            slot.subjectId
                ? context.teachers
                    .filter((teacher) => teacher.id !== slot.teacherId)
                    .filter((teacher) => teacher.assignments.some((assignment) => assignment.subjectId === slot.subjectId))
                    .map((teacher) => teacher.id)
                : [],
        title: slot.title ?? slot.subject?.name ?? null,
        durationSlots: slot.durationSlots,
        itemType: slot.itemType,
        roomTypeRequired: slot.room?.type ?? null,
        difficulty: slot.itemType === ScheduleItemType.event ? 1 : 3,
        lockedDayOfWeek: null,
        lockedSlotIndex: null,
        sourceType: ScheduleSlotSourceType.reoptimized,
        split: slot.split,
        preferredRoomId: slot.roomId,
        originalTeacherId: slot.originalTeacherId ?? slot.teacherId,
    }));
}

export async function createTeacherAbsenceAndReoptimize(input: {
    teacherId: string;
    startsAt: string | Date;
    endsAt: string | Date;
    reason: string;
    createdById?: string;
}) {
    const publishedPlan = await loadExistingPlan();
    if (!publishedPlan) {
        throw new Error("Нет опубликованного недельного плана для перестройки.");
    }

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    const absence = await prisma.teacherAbsence.create({
        data: {
            teacherId: input.teacherId,
            startsAt,
            endsAt,
            reason: input.reason,
            status: TeacherAbsenceStatus.active,
        },
        include: {
            teacher: { include: { user: true } },
        },
    });

    const affectedSlots = publishedPlan.slots.filter((slot) => {
        if (slot.teacherId !== input.teacherId) return false;
        const slotDate = buildSlotDate(publishedPlan.weekStartDate, slot.dayOfWeek);
        return slotDate >= startsAt && slotDate <= endsAt;
    });

    const weekStartDate = new Date(publishedPlan.weekStartDate);
    const context = await loadPlanningContext(weekStartDate);
    const lockedSlots: SlotDraft[] = [];
    const changedClassIds = new Set<string>();
    const notifiedTeacherUserIds = new Set<string>();
    const unresolvedSlots: typeof affectedSlots = [];

    for (const slot of publishedPlan.slots) {
        if (!affectedSlots.some((item) => item.id === slot.id)) {
            lockedSlots.push({
                classId: slot.classId,
                subjectId: slot.subjectId,
                teacherId: slot.teacherId,
                originalTeacherId: slot.originalTeacherId ?? slot.teacherId,
                roomId: slot.roomId,
                dayOfWeek: slot.dayOfWeek,
                slotIndex: slot.slotIndex,
                durationSlots: slot.durationSlots,
                itemType: slot.itemType,
                title: slot.title,
                timeLabel: slot.timeLabel,
                split: slot.split,
                sourceType: slot.sourceType,
                locked: true,
                bandId: slot.bandId,
            });
        }
    }

    for (const slot of affectedSlots) {
        const substituteTeacher = context.teachers
            .filter((teacher) => teacher.id !== slot.teacherId)
            .filter((teacher) => slot.subjectId && teacher.assignments.some((assignment) => assignment.subjectId === slot.subjectId))
            .filter((teacher) => isTeacherAvailable(teacher.id, slot.dayOfWeek, slot.slotIndex, slot.durationSlots, context))
            .sort((left, right) => (left.assignments.length - right.assignments.length))[0];

        if (substituteTeacher) {
            lockedSlots.push({
                classId: slot.classId,
                subjectId: slot.subjectId,
                teacherId: substituteTeacher.id,
                originalTeacherId: slot.originalTeacherId ?? slot.teacherId,
                roomId: slot.roomId,
                dayOfWeek: slot.dayOfWeek,
                slotIndex: slot.slotIndex,
                durationSlots: slot.durationSlots,
                itemType: slot.itemType,
                title: slot.title,
                timeLabel: slot.timeLabel,
                split: slot.split,
                sourceType: ScheduleSlotSourceType.substitute,
                locked: true,
                bandId: slot.bandId,
            });
            changedClassIds.add(slot.classId);
            notifiedTeacherUserIds.add(substituteTeacher.userId);
        } else {
            unresolvedSlots.push(slot);
        }
    }

    const reoptUnits = buildReoptimizationUnitsFromSlots(unresolvedSlots, context);
    const solved = solveUnits(reoptUnits, context, publishedPlan, createInitialState(lockedSlots));
    const completedSlots = ensureMinimumDailyLoad(solved.slots, context, solved.conflicts);
    const title = `Reoptimized Schedule • ${formatWeekLabel(weekStartDate)}`;

    const plan = await prisma.$transaction(async (tx) => {
        await tx.schedulePlan.updateMany({
            where: { status: SchedulePlanStatus.published },
            data: { status: SchedulePlanStatus.draft },
        });

        const created = await persistPlan({
            title,
            weekStartDate,
            createdById: input.createdById,
            status: SchedulePlanStatus.published,
            generationMode: ScheduleGenerationMode.reoptimized,
            regenerationReason: `Больничный: ${absence.teacher.user.fullName}`,
            basedOnPlanId: publishedPlan.id,
            slots: completedSlots,
            conflicts: [
                ...publishedPlan.conflicts.map((conflict) => ({
                    title: conflict.title,
                    description: conflict.description,
                    severity: conflict.severity,
                    resolved: conflict.resolved,
                    needsAttention: conflict.needsAttention,
                })),
                ...solved.conflicts,
            ],
        }, tx);

        await tx.teacherAbsence.update({
            where: { id: absence.id },
            data: { triggeredPlanId: created.id },
        });

        return created;
    }, { timeout: 20000 });

    for (const slot of affectedSlots) {
        changedClassIds.add(slot.classId);
    }

    const message = `${absence.teacher.user.fullName} отмечен(а) как отсутствующий. Расписание недели перестроено автоматически.`;
    await createScheduleNotifications({
        classIds: [...changedClassIds],
        targetTeacherUserIds: [...notifiedTeacherUserIds],
        text: message,
        createdByUserId: input.createdById,
        kioskTitle: `Замены недели • ${absence.teacher.user.fullName}`,
    });
    await createScheduleEventLog("Автоперестройка по больничному", message, input.createdById);

    return {
        absenceId: absence.id,
        planId: plan.id,
        affectedSlots: affectedSlots.length,
        unresolvedCount: solved.conflicts.length,
    };
}

export function buildConstraintSummary(bundle: ConstraintSummary) {
    return [
        `${bundle.summary.teacherCount} учителей`,
        `${bundle.summary.roomCount} кабинетов`,
        `${bundle.summary.requirementCount} требований`,
        `${bundle.summary.bandCount} лент`,
        `${bundle.summary.activeAbsenceCount} активных больничных`,
    ].join(" • ");
}
