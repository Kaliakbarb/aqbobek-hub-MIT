"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    BarChart3,
    BellRing,
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    Megaphone,
    Send,
    Settings,
    ShieldCheck,
    Siren,
    Users,
    XCircle,
} from "lucide-react";
import { saveAnnouncement, saveBroadcast } from "../../../lib/demo-admin-store";

type EventKind = "mail" | "approval" | "incident" | "publish" | "system";

type EventItem = {
    title: string;
    note: string;
    kind: EventKind;
};

type ApprovalItem = {
    id: number;
    title: string;
    meta: string;
    priority: "Высокий" | "Средний";
    status: "pending" | "approved" | "rejected";
};

type IncidentItem = {
    id: number;
    title: string;
    location: string;
    owner: string;
    severity: "Критично" | "Средне";
    status: "open" | "resolved";
};

const baseEvents: EventItem[] = [
    { title: "Система стабильна", note: "Последний бекап: 2 часа назад", kind: "system" },
    { title: "Уведомление отправлено", note: '"Собрание 10-х классов" (120 получателей)', kind: "mail" },
    { title: "Модуль расписания активен", note: "Генератор расписания готов к использованию", kind: "system" },
];

const baseApprovals: ApprovalItem[] = [
    { id: 1, title: "Больничный: Жукенов М.Т.", meta: "Физика • 10-11 классы • 2 дня", priority: "Высокий", status: "pending" },
    { id: 2, title: "Закупка проекторов", meta: "IT блок • 4 кабинета • 1 280 000 ₸", priority: "Средний", status: "pending" },
    { id: 3, title: "Внеплановое собрание родителей", meta: "10 классы • Актовый зал • пятница 18:30", priority: "Средний", status: "pending" },
];

const baseIncidents: IncidentItem[] = [
    { id: 1, title: "Жалоба на перегрузку расписания", location: "10 Б", owner: "Зам. директора", severity: "Средне", status: "open" },
    { id: 2, title: "Не работает проектор", location: "Каб. 305", owner: "Техслужба", severity: "Критично", status: "open" },
    { id: 3, title: "Конфликт замены учителя", location: "11 А", owner: "Учебная часть", severity: "Средне", status: "open" },
];

const audiences = ["Все пользователи", "Учителя", "Родители", "Ученики 10-х классов"];

function eventAppearance(kind: EventKind) {
    if (kind === "mail") return { icon: BellRing, color: "bg-blue-100 text-blue-600" };
    if (kind === "approval") return { icon: ClipboardCheck, color: "bg-emerald-100 text-emerald-600" };
    if (kind === "incident") return { icon: Siren, color: "bg-orange-100 text-orange-600" };
    if (kind === "publish") return { icon: Megaphone, color: "bg-violet-100 text-violet-600" };
    return { icon: ShieldCheck, color: "bg-green-100 text-green-600" };
}

export default function AdminDashboard() {
    const [status, setStatus] = useState("Административный центр готов: можно управлять рассылками, согласованиями, инцидентами и публикациями.");
    const [events, setEvents] = useState<EventItem[]>(baseEvents);
    const [approvals, setApprovals] = useState<ApprovalItem[]>(baseApprovals);
    const [incidents, setIncidents] = useState<IncidentItem[]>(baseIncidents);
    const [audience, setAudience] = useState(audiences[0]);
    const [broadcastText, setBroadcastText] = useState("Напоминаем о совещании руководителей кафедр сегодня в 16:30.");
    const [announcementTitle, setAnnouncementTitle] = useState("Открытая неделя STEM-проектов");
    const [announcementDate, setAnnouncementDate] = useState("2026-04-02");
    const [announcementBody, setAnnouncementBody] = useState("Приглашаем учеников и преподавателей на серию открытых STEM-событий, воркшопов и проектных сессий.");

    const prependEvent = (event: EventItem) => {
        setEvents((current) => [event, ...current].slice(0, 6));
    };

    const pendingApprovals = useMemo(
        () => approvals.filter((item) => item.status === "pending").length,
        [approvals],
    );

    const openIncidents = useMemo(
        () => incidents.filter((item) => item.status === "open").length,
        [incidents],
    );

    const sendBroadcast = () => {
        if (!broadcastText.trim()) {
            setStatus("Введите текст рассылки перед отправкой.");
            return;
        }

        setStatus(`Рассылка отправлена для аудитории «${audience}». Сообщение поставлено в ленту уведомлений.`);
        saveBroadcast({
            id: crypto.randomUUID(),
            audience,
            text: broadcastText.trim(),
            createdAt: new Date().toISOString(),
        });
        prependEvent({
            title: "Новая рассылка",
            note: `${audience}: ${broadcastText.trim()}`,
            kind: "mail",
        });
        setBroadcastText("");
    };

    const updateApproval = (id: number, statusValue: "approved" | "rejected") => {
        const item = approvals.find((approval) => approval.id === id);
        if (!item) return;

        setApprovals((current) =>
            current.map((approval) => approval.id === id ? { ...approval, status: statusValue } : approval),
        );
        setStatus(
            statusValue === "approved"
                ? `Согласовано: ${item.title}.`
                : `Отклонено: ${item.title}.`,
        );
        prependEvent({
            title: statusValue === "approved" ? "Заявка согласована" : "Заявка отклонена",
            note: item.title,
            kind: "approval",
        });
    };

    const resolveIncident = (id: number) => {
        const item = incidents.find((incident) => incident.id === id);
        if (!item) return;

        setIncidents((current) =>
            current.map((incident) => incident.id === id ? { ...incident, status: "resolved" } : incident),
        );
        setStatus(`Инцидент закрыт: ${item.title}. Ответственный: ${item.owner}.`);
        prependEvent({
            title: "Инцидент закрыт",
            note: `${item.title} • ${item.location}`,
            kind: "incident",
        });
    };

    const publishAnnouncement = () => {
        if (!announcementTitle.trim()) {
            setStatus("Введите заголовок объявления перед публикацией.");
            return;
        }

        setStatus(`Объявление «${announcementTitle.trim()}» опубликовано на дату ${announcementDate}.`);
        saveAnnouncement({
            id: crypto.randomUUID(),
            type: "Объявление",
            title: announcementTitle.trim(),
            desc: announcementBody.trim() || "Новая публикация от администрации школы.",
            date: announcementDate,
            highlight: true,
        });
        prependEvent({
            title: "Объявление опубликовано",
            note: `${announcementTitle.trim()} • ${announcementDate}`,
            kind: "publish",
        });
        setAnnouncementTitle("");
        setAnnouncementBody("");
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
                <p className="text-sm font-semibold text-foreground">{status}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-3">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Всего учеников</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">1,248</p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-3">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Учителя</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">84</p>
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
                                    onClick={sendBroadcast}
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
                                    <BellRing className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-sora text-xl font-bold text-foreground">Публикация объявления</h2>
                                    <p className="text-sm text-muted-foreground">Быстрая публикация важных школьных новостей</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Заголовок</label>
                                    <input
                                        value={announcementTitle}
                                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground outline-none"
                                        placeholder="Например: изменение расписания звонков"
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
                                        rows={3}
                                        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground outline-none resize-none"
                                        placeholder="Короткий текст, который увидят пользователи в новостях"
                                    />
                                </div>
                                <button
                                    onClick={publishAnnouncement}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                                >
                                    <Send className="w-4 h-4" />
                                    Опубликовать
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass rounded-[2rem] p-6">
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <div>
                                <h2 className="font-sora text-xl font-bold text-foreground">Очередь согласований</h2>
                                <p className="text-sm text-muted-foreground">Заявки, которые требуют решения администратора</p>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                {pendingApprovals} активных
                            </span>
                        </div>

                        <div className="space-y-4">
                            {approvals.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-border bg-white/60 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.priority === "Высокий" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {item.priority}
                                                </span>
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.status === "approved" ? "bg-emerald-100 text-emerald-700" : item.status === "rejected" ? "bg-slate-200 text-slate-700" : "bg-sky-100 text-sky-700"}`}>
                                                    {item.status === "approved" ? "согласовано" : item.status === "rejected" ? "отклонено" : "ожидает"}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-muted-foreground">{item.meta}</p>
                                        </div>

                                        {item.status === "pending" && (
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => updateApproval(item.id, "approved")}
                                                    className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
                                                >
                                                    Согласовать
                                                </button>
                                                <button
                                                    onClick={() => updateApproval(item.id, "rejected")}
                                                    className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-black/5"
                                                >
                                                    Отклонить
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="liquid-glass rounded-[2rem] p-6">
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <div>
                                <h2 className="font-sora text-xl font-bold text-foreground">Центр инцидентов</h2>
                                <p className="text-sm text-muted-foreground">Оперативная работа с проблемами школы</p>
                            </div>
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                                {openIncidents} открытых
                            </span>
                        </div>

                        <div className="space-y-4">
                            {incidents.map((incident) => (
                                <div key={incident.id} className="rounded-2xl border border-border bg-white/60 p-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-bold text-foreground">{incident.title}</h3>
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${incident.severity === "Критично" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {incident.severity}
                                                </span>
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${incident.status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"}`}>
                                                    {incident.status === "resolved" ? "закрыт" : "в работе"}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {incident.location} • Ответственный: {incident.owner}
                                            </p>
                                        </div>

                                        {incident.status === "open" && (
                                            <button
                                                onClick={() => resolveIncident(incident.id)}
                                                className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                            >
                                                Закрыть инцидент
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem] min-h-[280px]">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-sora font-bold text-foreground">Журнал событий</h2>
                            <button
                                onClick={() => {
                                    setEvents(baseEvents);
                                    setStatus("Журнал событий сброшен к базовому состоянию.");
                                }}
                                className="text-xs font-semibold text-primary"
                            >
                                Сбросить
                            </button>
                        </div>
                        <div className="space-y-4">
                            {events.map((event, index) => {
                                const appearance = eventAppearance(event.kind);
                                const Icon = appearance.icon;

                                return (
                                    <div key={`${event.title}-${index}`} className="flex gap-3 items-start border-b border-border pb-3 last:border-b-0 last:pb-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${appearance.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{event.title}</p>
                                            <p className="text-xs text-muted-foreground leading-5">{event.note}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Операционный обзор</h2>
                        <div className="space-y-4">
                            <button
                                onClick={() => setStatus("Открыт срез по параллелям: 10-е классы показывают лучшую динамику за месяц.")}
                                className="w-full rounded-2xl bg-white/70 border border-border p-4 text-left hover:border-primary/30"
                            >
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-bold text-foreground">Аналитика по параллелям</p>
                                        <p className="text-xs text-muted-foreground mt-1">Посмотреть срез по росту успеваемости</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setStatus("Открыт сценарий работы с замещениями. Следующий шаг — перейти в модуль расписания.")}
                                className="w-full rounded-2xl bg-white/70 border border-border p-4 text-left hover:border-primary/30"
                            >
                                <div className="flex items-center gap-3">
                                    <Settings className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-bold text-foreground">Сценарий замен</p>
                                        <p className="text-xs text-muted-foreground mt-1">Подготовить решение по отсутствующим педагогам</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setStatus("Открыт блок контроля коммуникаций. Последняя рассылка дошла до 96% аудитории.")}
                                className="w-full rounded-2xl bg-white/70 border border-border p-4 text-left hover:border-primary/30"
                            >
                                <div className="flex items-center gap-3">
                                    <BellRing className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-bold text-foreground">Контроль коммуникаций</p>
                                        <p className="text-xs text-muted-foreground mt-1">Проверить доставку и вовлеченность</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
