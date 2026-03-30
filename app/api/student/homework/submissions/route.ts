import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { HomeworkSubmissionStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../../../lib/http";
import { prisma } from "../../../../../lib/prisma";
import { requireRole } from "../../../../../lib/server-data";
import { requireSessionUser } from "../../../../../lib/session";

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser();
        requireRole(user, [UserRole.student]);

        if (!user.student) {
            return jsonError("Профиль ученика не найден.", 404);
        }

        const formData = await request.formData();
        const assignmentId = String(formData.get("assignmentId") ?? "");
        const note = String(formData.get("note") ?? "").trim();
        const file = formData.get("file");

        if (!assignmentId) {
            return jsonError("Задание не выбрано.");
        }

        const assignment = await prisma.homeworkAssignment.findFirst({
            where: {
                id: assignmentId,
                classId: user.student.classId,
                active: true,
            },
        });

        if (!assignment) {
            return jsonError("Задание не найдено или недоступно для этого класса.", 404);
        }

        let fileName: string | undefined;
        let fileUrl: string | undefined;

        if (file instanceof File && file.size > 0) {
            const uploadsDir = path.join(process.cwd(), "public", "uploads", "homework", user.student.id);
            await mkdir(uploadsDir, { recursive: true });
            const ext = path.extname(file.name) || "";
            const safeBaseName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
            const finalName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBaseName || `homework${ext}`}`;
            const finalPath = path.join(uploadsDir, finalName);
            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(finalPath, buffer);
            fileName = file.name;
            fileUrl = `/uploads/homework/${user.student.id}/${finalName}`;
        }

        const existing = await prisma.homeworkSubmission.findUnique({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId: user.student.id,
                },
            },
        });

        if (!existing && !fileUrl && !note) {
            return jsonError("Добавьте файл или комментарий к домашнему заданию.");
        }

        const submission = existing
            ? await prisma.homeworkSubmission.update({
                where: {
                    assignmentId_studentId: {
                        assignmentId,
                        studentId: user.student.id,
                    },
                },
                data: {
                    note: note || existing.note,
                    fileName: fileName ?? existing.fileName,
                    fileUrl: fileUrl ?? existing.fileUrl,
                    status: fileUrl ? HomeworkSubmissionStatus.submitted : HomeworkSubmissionStatus.draft,
                    submittedAt: fileUrl ? new Date() : existing.submittedAt,
                },
            })
            : await prisma.homeworkSubmission.create({
                data: {
                    assignmentId,
                    studentId: user.student.id,
                    note: note || null,
                    fileName: fileName ?? null,
                    fileUrl: fileUrl ?? null,
                    status: fileUrl ? HomeworkSubmissionStatus.submitted : HomeworkSubmissionStatus.draft,
                    submittedAt: fileUrl ? new Date() : null,
                },
            });

        return NextResponse.json({
            ok: true,
            message: fileUrl ? "Домашнее задание загружено. Учитель увидит файл в системе." : "Черновик по домашнему заданию сохранен.",
            submission,
        });
    } catch (error) {
        return handleRouteError(error);
    }
}
