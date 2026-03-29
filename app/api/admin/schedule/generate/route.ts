import { NextResponse } from "next/server";
import { handleRouteError } from "../../../../../lib/http";
import { prisma } from "../../../../../lib/prisma";
import { createAdminEventLog, requireRole } from "../../../../../lib/server-data";
import { requireSessionUser } from "../../../../../lib/session";
import { EventLogKind, SchedulePlanStatus, UserRole } from "@prisma/client";

export async function POST() {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.admin]);

        const source = await prisma.schedulePlan.findFirst({
            orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
            include: {
                slots: true,
                conflicts: true,
            },
        });

        const plan = await prisma.schedulePlan.create({
            data: {
                title: source?.title ?? "Сгенерированный план",
                dayOfWeek: source?.dayOfWeek ?? 1,
                status: SchedulePlanStatus.draft,
                createdById: user.id,
                slots: source
                    ? {
                        createMany: {
                            data: source.slots.map((slot) => ({
                                classId: slot.classId,
                                subjectId: slot.subjectId,
                                teacherId: slot.teacherId,
                                timeLabel: slot.timeLabel,
                                room: slot.room,
                                split: slot.split,
                            })),
                        },
                    }
                    : undefined,
                conflicts: {
                    createMany: {
                        data: source?.conflicts.length
                            ? source.conflicts.map((conflict) => ({
                                title: conflict.title,
                                description: conflict.description,
                                severity: conflict.severity,
                                resolved: true,
                            }))
                            : [
                                {
                                    title: "Физрук заболел",
                                    description: "ИИ объединил 10А и 10Б на стадионе со вторым учителем.",
                                    severity: "medium",
                                    resolved: true,
                                },
                                {
                                    title: "Ремонт зала",
                                    description: "Уроки переведены на альтернативные площадки согласно погоде.",
                                    severity: "low",
                                    resolved: true,
                                },
                            ],
                    },
                },
            },
        });

        await createAdminEventLog({
            title: "Сгенерировано расписание",
            note: `Создан черновик плана ${plan.title}.`,
            kind: EventLogKind.schedule,
            userId: user.id,
        });

        return NextResponse.json({ ok: true, planId: plan.id });
    } catch (error) {
        return handleRouteError(error);
    }
}
