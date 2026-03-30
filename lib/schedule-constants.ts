export const SCHEDULE_DAYS = [1, 2, 3, 4, 5] as const;

export const DAY_LABELS: Record<number, string> = {
    1: "Понедельник",
    2: "Вторник",
    3: "Среда",
    4: "Четверг",
    5: "Пятница",
};

export const DAY_SHORT_LABELS: Record<number, string> = {
    1: "Пн",
    2: "Вт",
    3: "Ср",
    4: "Чт",
    5: "Пт",
};

export const DAY_CODE_MAP: Record<number, "Mon" | "Tue" | "Wed" | "Thu" | "Fri"> = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
};

export const SLOT_TEMPLATES = [
    { index: 1, label: "08:30 - 09:15", start: "08:30", end: "09:15" },
    { index: 2, label: "09:25 - 10:10", start: "09:25", end: "10:10" },
    { index: 3, label: "10:30 - 11:15", start: "10:30", end: "11:15" },
    { index: 4, label: "11:25 - 12:10", start: "11:25", end: "12:10" },
    { index: 5, label: "12:20 - 13:05", start: "12:20", end: "13:05" },
    { index: 6, label: "13:15 - 14:00", start: "13:15", end: "14:00" },
] as const;

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function getSlotTemplate(slotIndex: number) {
    return SLOT_TEMPLATES.find((slot) => slot.index === slotIndex) ?? SLOT_TEMPLATES[0];
}

export function getSlotTimeLabel(slotIndex: number, durationSlots = 1) {
    const startSlot = getSlotTemplate(slotIndex);
    const endSlot = getSlotTemplate(slotIndex + Math.max(durationSlots - 1, 0));
    return `${startSlot.start} - ${endSlot.end}`;
}

export function parseStartMinutes(timeLabel: string) {
    const match = timeLabel.match(/(\d{1,2}):(\d{2})/);
    if (!match) return Number.MAX_SAFE_INTEGER;
    return Number(match[1]) * 60 + Number(match[2]);
}

export function toDateOnly(value: Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function getWeekStartDate(input?: string | Date) {
    const raw = input ? new Date(input) : new Date();
    const date = toDateOnly(raw);
    const day = date.getUTCDay();
    const delta = day === 0 ? -6 : 1 - day;
    date.setUTCDate(date.getUTCDate() + delta);
    return date;
}

export function buildSlotDate(weekStartDate: Date, dayOfWeek: number) {
    const date = new Date(weekStartDate);
    date.setUTCDate(date.getUTCDate() + (dayOfWeek - 1));
    return date;
}

export function formatWeekLabel(weekStartDate: Date) {
    const end = buildSlotDate(weekStartDate, 5);
    return `${weekStartDate.toISOString().slice(0, 10)} - ${end.toISOString().slice(0, 10)}`;
}
