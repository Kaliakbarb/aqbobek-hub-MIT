"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    BellRing,
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    Megaphone,
    Send,
    ShieldCheck,
    Siren,
    Users,
} from "lucide-react";

type EventKind = "mail" | "approval" | "incident" | "publish" | "system" | "schedule" | "ai";

type EventItem = {
    id: string;
    title: string;
    note: string;
    kind: EventKind;
};

type ApprovalItem = {
    id: string;
    title: string;
    meta: string;
    priority: string;
    status: "pending" | "approved" | "rejected";
};

type IncidentItem = {
    id: string;
    title: string;
    location: string;
    owner: string;
    severity: string;
    status: "open" | "resolved";
};

type AdminDashboardPayload = {
    stats: {
        students: number;
        teachers: number;
        pendingApprovals: number;
        openIncidents: number;
    };
    approvals: ApprovalItem[];
    incidents: IncidentItem[];
    events: EventItem[];
};

const audiences = ["Все пользователи", "Учителя", "Родители", "Ученики 10-х классов"];
const ANNOUNCEMENTS_KEY = "aqbobek_admin_announcements";
const BROADCASTS_KEY = "aqbobek_admin_broadcasts";
const MIGRATED_KEY = "aqbobek_admin_migrated";

function eventAppearance(kind: EventKind) {
    if (kind === "mail") return { icon: BellRing, color: "bg-blue-100 text-blue-600" };
    if (kind === "approval") return { icon: ClipboardCheck, color: "bg-emerald-100 text-emerald-600" };
    if (kind === "incident") return { icon: Siren, color: "bg-orange-100 text-orange-600" };
    if (kind === "publish") return { icon: Megaphone, color: "bg-violet-100 text-violet-600" };
    return { icon: ShieldCheck, color: "bg-green-100 text-green-600" };
}

export default function AdminDashboard() {
    const [status, setStatus] = useState("Загружаем командный центр и административные события.");
    const [dashboard, setDashboard] = useState<AdminDashboardPayload | null>(null);
    const [audience, setAudience] = useState(audiences[0]);
    const [broadcastText, setBroadcastText] = useState("Напоминаем о совещании руководителей кафедр сегодня в 16:30.");
    const [announcementTitle, setAnnouncementTitle] = useState("Открытая неделя STEM-проектов");
    const [announcementDate, setAnnouncementDate] = useState("2026-04-02");
    const [announcementBody, setAnnouncementBody] = useState("Приглашаем учеников и преподавателей на серию открытых STEM-событий, воркшопов и проектных сессий.");
    const [canImportLocal, setCanImportLocal] = useState(false);

    const load = async () => {
        try {
            const response = await fetch("/api/admin/dashboard");
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Не удалось загрузить административный центр.");
            setDashboard(data.dashboard);
            setStatus("Командный центр синхронизирован с базой данных.");
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось загрузить административный центр.");
        }
    };

    useEffect(() => {
        void load();

        if (typeof window !== "undefined") {
            const hasLocalData = Boolean(window.localStorage.getItem(ANNOUNCEMENTS_KEY) || window.localStorage.getItem(BROADCASTS_KEY));
            const alreadyMigrated = window.localStorage.getItem(MIGRATED_KEY) === "true";
            setCanImportLocal(hasLocalData && !alreadyMigrated);
        }
    }, []);

    const pendingApprovals = useMemo(
        () => dashboard?.approvals.filter((item) => item.status === "pending").length ?? 0,
        [dashboard],
    );

    const openIncidents = useMemo(
        () => dashboard?.incidents.filter((item) => item.status === "open").length ?? 0,
        [dashboard],
    );

    const sendBroadcast = async () => {
        if (!broadcastText.trim()) {
            setStatus("Введите текст рассылки перед отправкой.");
            return;
        }

        try {
            const response = await fetch("/api/admin/broadcasts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    audience,
                    text: broadcastText.trim(),
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Не удалось отправить рассылку.");
            setStatus(`Рассылка отправлена для аудитории «${audience}». Сообщение сохранено в базе.`);
            setBroadcastText("");
            await load();
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось отправить рассылку.");
        }
    };

    const updateApproval = async (id: string, statusValue: "approved" | "rejected") => {
        try {
            const response = await fetch(`/api/admin/approvals/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: statusValue }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Не удалось обновить заявку.");
            setStatus(statusValue === "approved" ? `Заявка согласована: ${data.approval.title}.` : `Заявка отклонена: ${data.approval.title}.`);
            await load();
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось обновить заявку.");
        }
    };

    const resolveIncident = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/incidents/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "resolved" }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Не удалось закрыть инцидент.");
            setStatus(`Инцидент закрыт: ${data.incident.title}.`);
            await load();
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось закрыть инцидент.");
        }
    };

    const publishAnnouncement = async () => {
        if (!announcementTitle.trim()) {
            setStatus("Введите заголовок объявления перед публикацией.");
            return;
        }

        try {
            const response = await fetch("/api/news", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: "announcement",
                    title: announcementTitle.trim(),
                    description: announcementBody.trim() || "Новая публикация от администрации школы.",
                    publishedAt: announcementDate,
                    highlight: true,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Не удалось опубликовать объявление.");
            setStatus(`Объявление «${announcementTitle.trim()}» опубликовано на дату ${announcementDate}.`);
            setAnnouncementTitle("");
            setAnnouncementBody("");
            await load();
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось опубликовать объявление.");
        }
    };

    const importLocalData = async () => {
        if (typeof window === "undefined") return;

        try {
            const announcements = JSON.parse(window.localStorage.getItem(ANNOUNCEMENTS_KEY) || "[]");
            const broadcasts = JSON.parse(window.localStorage.getItem(BROADCASTS_KEY) || "[]");
            const response = await fetch("/api/admin/migrate-local", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ announcements, broadcasts }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Не удалось импортировать локальные данные.");
            window.localStorage.setItem(MIGRATED_KEY, "true");
            setCanImportLocal(false);
            setStatus(`Импорт завершен: объявлений ${data.importedAnnouncements}, рассылок ${data.importedBroadcasts}.`);
            await load();
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Не удалось импортировать локальные данные.");
        }
    };

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Командный центр</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Aqbobek Lyceum • рабочее место администратора</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/schedule" className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm">
                        Управление расписанием
                    </Link>
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">{status}</p>
                    {canImportLocal && (
                        <button onClick={() => void importLocalData()} className="text-xs font-semibold text-primary hover:underline">
                            Импортировать старые объявления и рассылки из локального демо-хранилища
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-3">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Всего учеников</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{dashboard?.stats.students ?? 0}</p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-3">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Учителя</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{dashboard?.stats.teachers ?? 0}</p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-3">
                        <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Заявки на согласование</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{pendingApprovals}</p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 mb-3">
                        <Siren className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Открытые инциденты</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{openIncidents}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="liquid-glass rounded-[2rem] p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Send className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-sora text-xl font-bold text-foreground">Центр рассылок</h2>
                                    <p className="text-sm text-muted-foreground">Отправка уведомлений по выбранной аудитории</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Аудитория</label>
                                    <select
                                        value={audience}
                                        onChange={(e) => setAudience(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground outline-none"
                                    >
                                        {audiences.map((item) => (
                                            <option key={item}>{item}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Текст сообщения</label>
                                    <textarea
                                        value={broadcastText}
                                        onChange={(e) => setBroadcastText(e.target.value)}
                                        rows={4}
                                        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground outline-none resize-none"
                                        placeholder="Введите сообщение для выбранной аудитории"
                                    />
                                </div>
                                <button
                                    onClick={() => void sendBroadcast()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                                >
                                    <Megaphone className="w-4 h-4" />
                                    Отправить рассылку
                                </button>
                            </div>
                        </div>

                        <div className="liquid-glass rounded-[2rem] p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                                    <Megaphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-sora text-xl font-bold text-foreground">Публикация объявления</h2>
                                    <p className="text-sm text-muted-foreground">Новость попадет в ленту школы и на роли с доступом</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Заголовок</label>
                                    <input
                                        value={announcementTitle}
                                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Дата публикации</label>
                                    <input
                                        type="date"
                                        value={announcementDate}
                                        onChange={(e) => setAnnouncementDate(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Описание</label>
                                    <textarea
                                        value={announcementBody}
                                        onChange={(e) => setAnnouncementBody(e.target.value)}
                                        rows={4}
                                        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground outline-none resize-none"
                                    />
                                </div>
                                <button
                                    onClick={() => void publishAnnouncement()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                                >
                                    <BellRing className="w-4 h-4" />
                                    Опубликовать
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass rounded-[2rem] p-6">
                        <h2 className="font-sora text-xl font-bold text-foreground mb-5">Очередь согласований</h2>
                        <div className="space-y-4">
                            {dashboard?.approvals.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-border bg-white/60 p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.priority === "Высокий" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                                {item.priority}
                                            </span>
                                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.status === "approved" ? "bg-emerald-100 text-emerald-700" : item.status === "rejected" ? "bg-slate-200 text-slate-700" : "bg-sky-100 text-sky-700"}`}>
                                                {item.status === "approved" ? "согласовано" : item.status === "rejected" ? "отклонено" : "ожидает"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{item.meta}</p>
                                    </div>
                                    {item.status === "pending" && (
                                        <div className="flex gap-2">
                                            <button onClick={() => void updateApproval(item.id, "approved")} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600">Согласовать</button>
                                            <button onClick={() => void updateApproval(item.id, "rejected")} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300">Отклонить</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="font-sora text-xl font-bold text-foreground mb-5">Инциденты</h2>
                        <div className="space-y-4">
                            {dashboard?.incidents.map((incident) => (
                                <div key={incident.id} className="rounded-2xl border border-border bg-white/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="text-sm font-bold text-foreground">{incident.title}</h3>
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${incident.severity === "Критично" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {incident.severity}
                                                </span>
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${incident.status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"}`}>
                                                    {incident.status === "resolved" ? "закрыт" : "в работе"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {incident.location} • Ответственный: {incident.owner}
                                            </p>
                                        </div>
                                        {incident.status === "open" && (
                                            <button
                                                onClick={() => void resolveIncident(incident.id)}
                                                className="text-xs font-semibold text-primary hover:underline"
                                            >
                                                Закрыть
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="font-sora text-xl font-bold text-foreground mb-5">Журнал событий</h2>
                        <div className="space-y-3">
                            {dashboard?.events.map((event) => {
                                const appearance = eventAppearance(event.kind);
                                const Icon = appearance.icon;
                                return (
                                    <div key={event.id} className="rounded-2xl border border-border bg-white/60 p-4 flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${appearance.color}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-foreground">{event.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-1">{event.note}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-orange-200 bg-orange-50/50 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <h2 className="font-sora text-lg font-bold text-orange-900">Переход с localStorage</h2>
                        </div>
                        <p className="text-sm text-orange-900/80 leading-relaxed">
                            Старые демо-данные администратора больше не живут только в браузере. После импорта они становятся общими и видны всем ролям через базу данных.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
