"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useTeacherOperations(initialStatus = "Система готова к работе.") {
    const router = useRouter();
    const [status, setStatus] = useState(initialStatus);

    const runAction = async (url: string, options?: RequestInit) => {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error || "Не удалось выполнить действие.");
        }

        if (data?.message) {
            setStatus(data.message);
        }

        router.refresh();
        return data;
    };

    const communication = async (action: string, fallback: string) => {
        try {
            await runAction("/api/teacher/communications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
        } catch (error) {
            setStatus(error instanceof Error ? error.message : fallback);
        }
    };

    const toggleTask = async (id: string, done: boolean) => {
        try {
            await runAction(`/api/teacher/tasks/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ done: !done }),
            });
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось обновить задачу.");
        }
    };

    const report = async () => {
        try {
            await runAction("/api/teacher/reports", { method: "POST" });
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось сформировать отчет.");
        }
    };

    const submitSickLeave = async (absenceForm: { startsAt: string; endsAt: string; reason: string }) => {
        try {
            await runAction("/api/teacher/absences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(absenceForm),
            });
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось оформить больничный.");
        }
    };

    return {
        status,
        setStatus,
        communication,
        toggleTask,
        report,
        submitSickLeave,
    };
}
