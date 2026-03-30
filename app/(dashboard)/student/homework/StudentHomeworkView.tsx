"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock3, Upload, CheckCircle2, FileText, MessageSquare, Sparkles } from "lucide-react";

type HomeworkAssignment = {
    id: string;
    title: string;
    description: string;
    subject: string;
    teacher: string;
    dueAt: string;
    dueAtIso: string;
    status: string;
    tone: string;
    submission: {
        id: string;
        status: string;
        note: string | null;
        fileName: string | null;
        fileUrl: string | null;
        submittedAt: string | null;
        teacherFeedback: string | null;
    } | null;
};

type HomeworkHubPayload = {
    student: {
        fullName: string;
        firstName: string;
        className: string;
    };
    summary: {
        total: number;
        submitted: number;
        pending: number;
        reviewed: number;
    };
    assignments: HomeworkAssignment[];
};

function toneClasses(tone: string) {
    if (tone === "green") return "bg-green-100 text-green-700 border-green-200";
    if (tone === "blue") return "bg-blue-100 text-blue-700 border-blue-200";
    if (tone === "amber") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
}

export function StudentHomeworkView({ hub }: { hub: HomeworkHubPayload | null }) {
    const router = useRouter();
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(hub?.assignments[0]?.id ?? null);
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState("Выберите задание, чтобы загрузить файл или сохранить черновик.");
    const [isPending, startTransition] = useTransition();

    const selectedAssignment = useMemo(
        () => hub?.assignments.find((item) => item.id === selectedAssignmentId) ?? hub?.assignments[0] ?? null,
        [hub, selectedAssignmentId],
    );

    useEffect(() => {
        if (!hub?.assignments.length) {
            setSelectedAssignmentId(null);
            setNote("");
            return;
        }

        const assignmentStillExists = hub.assignments.some((item) => item.id === selectedAssignmentId);
        const nextAssignment = assignmentStillExists
            ? hub.assignments.find((item) => item.id === selectedAssignmentId) ?? hub.assignments[0]
            : hub.assignments[0];

        if (!assignmentStillExists) {
            setSelectedAssignmentId(nextAssignment.id);
        }

        setNote(nextAssignment.submission?.note ?? "");
    }, [hub, selectedAssignmentId]);

    const submitHomework = () => {
        if (!selectedAssignment) return;

        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append("assignmentId", selectedAssignment.id);
                formData.append("note", note);
                if (file) {
                    formData.append("file", file);
                }

                const response = await fetch("/api/student/homework/submissions", {
                    method: "POST",
                    body: formData,
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data?.error || "Не удалось загрузить домашнее задание.");

                setMessage(data.message || "Домашнее задание сохранено.");
                setFile(null);
                router.refresh();
            } catch (error) {
                setMessage(error instanceof Error ? error.message : "Не удалось загрузить домашнее задание.");
            }
        });
    };

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Домашка</h1>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                        {hub ? `${hub.student.firstName}, здесь можно сдавать домашние задания файлами и комментариями.` : "Загружаем домашние задания..."}
                    </p>
                </div>
                <div className="liquid-glass rounded-2xl px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Сдано</p>
                    <p className="mt-1 text-2xl font-sora font-bold text-foreground">{hub?.summary.submitted ?? 0} / {hub?.summary.total ?? 0}</p>
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-foreground">{message}</p>
                    <p className="text-xs text-muted-foreground mt-1">Можно загрузить файл или сначала сохранить черновик с пояснением.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="liquid-glass p-5 rounded-3xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Всего заданий</p>
                    <p className="mt-2 text-3xl font-sora font-bold text-foreground">{hub?.summary.total ?? 0}</p>
                </div>
                <div className="liquid-glass p-5 rounded-3xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ждут сдачи</p>
                    <p className="mt-2 text-3xl font-sora font-bold text-orange-700">{hub?.summary.pending ?? 0}</p>
                </div>
                <div className="liquid-glass p-5 rounded-3xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Отправлены</p>
                    <p className="mt-2 text-3xl font-sora font-bold text-blue-700">{hub?.summary.submitted ?? 0}</p>
                </div>
                <div className="liquid-glass p-5 rounded-3xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Проверены</p>
                    <p className="mt-2 text-3xl font-sora font-bold text-green-700">{hub?.summary.reviewed ?? 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-5">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Задания класса</h2>
                        </div>

                        <div className="space-y-4">
                            {hub?.assignments.map((assignment) => (
                                <button
                                    key={assignment.id}
                                    onClick={() => {
                                        setSelectedAssignmentId(assignment.id);
                                        setNote(assignment.submission?.note ?? "");
                                        setMessage(`Открыто задание «${assignment.title}».`);
                                    }}
                                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedAssignment?.id === assignment.id ? "border-primary bg-primary/5" : "border-border/60 bg-white/50 hover:border-primary/30"}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{assignment.title}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{assignment.subject} • {assignment.teacher}</p>
                                        </div>
                                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${toneClasses(assignment.tone)}`}>
                                            {assignment.status}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-muted-foreground">{assignment.description}</p>
                                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1.5"><Clock3 className="w-4 h-4" />До {assignment.dueAt}</span>
                                        {assignment.submission?.submittedAt && <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />Сдано {assignment.submission.submittedAt}</span>}
                                    </div>
                                </button>
                            ))}
                            {(hub?.assignments.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Активных домашних заданий пока нет.</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-4">
                            <Upload className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Загрузить решение</h2>
                        </div>

                        {selectedAssignment ? (
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-primary/10 bg-white/60 p-4">
                                    <p className="text-lg font-sora font-bold text-foreground">{selectedAssignment.title}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{selectedAssignment.subject} • {selectedAssignment.teacher}</p>
                                    <p className="mt-3 text-sm text-foreground/80">{selectedAssignment.description}</p>
                                </div>

                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Файл</span>
                                    <input
                                        type="file"
                                        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Комментарий</span>
                                    <textarea
                                        value={note}
                                        onChange={(event) => setNote(event.target.value)}
                                        rows={4}
                                        placeholder="Например: загрузил PDF с полным решением, в конце написал, где возникли сложности."
                                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none"
                                    />
                                </label>

                                <button
                                    onClick={submitHomework}
                                    disabled={isPending}
                                    className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                                >
                                    {isPending ? "Сохраняем..." : "Загрузить домашнее задание"}
                                </button>

                                {selectedAssignment.submission?.fileUrl && (
                                    <a
                                        href={selectedAssignment.submission.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between rounded-xl border border-border/60 bg-white/60 px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/30"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            {selectedAssignment.submission.fileName ?? "Открыть файл"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">Открыть</span>
                                    </a>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Сначала выберите задание слева.</p>
                        )}
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem] bg-gradient-to-b from-white to-[#f8f5ff]">
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Комментарий учителя</h2>
                        </div>
                        {selectedAssignment?.submission?.teacherFeedback ? (
                            <p className="text-sm text-foreground/85">{selectedAssignment.submission.teacherFeedback}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">После проверки здесь появится комментарий учителя по твоей работе.</p>
                        )}
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem] bg-gradient-to-b from-white to-[#f8f5ff]">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Как сдавать аккуратно</h2>
                        </div>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <p>1. Загружай один понятный файл: PDF, изображение или архив проекта.</p>
                            <p>2. В комментарии коротко напиши, что внутри файла и где нужна проверка.</p>
                            <p>3. Если не готов до конца, сохрани черновик с пояснением.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
