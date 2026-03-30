"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
    Sparkles,
    AlertCircle,
    Calendar,
    Award,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    BookOpen,
    MessageSquare,
    TrendingUp,
    TrendingDown,
    BellRing,
} from "lucide-react";

type ParentDashboardPayload = {
    parent: { fullName: string };
    child: { fullName: string; className: string; gpa: number; absences: number };
    grades: Array<{ id: string; name: string; grade: string; type: string; status: string }>;
    aiSummary: string;
    recommendation: string;
    news: Array<{ id: string; title: string; desc: string; date: string }>;
};

function getConcernTone(absences: number, badGrades: number, gpa: number) {
    if (badGrades >= 2 || absences >= 4 || gpa < 4) {
        return {
            label: "Нужен фокус",
            badge: "bg-red-100 text-red-700",
            card: "border-red-200 bg-red-50/70",
            icon: <TrendingDown className="w-4 h-4" />,
        };
    }

    if (badGrades >= 1 || absences >= 2 || gpa < 4.5) {
        return {
            label: "Стабильно, но следим",
            badge: "bg-amber-100 text-amber-700",
            card: "border-amber-200 bg-amber-50/70",
            icon: <AlertCircle className="w-4 h-4" />,
        };
    }

    return {
        label: "Хорошая динамика",
        badge: "bg-green-100 text-green-700",
        card: "border-green-200 bg-green-50/70",
        icon: <TrendingUp className="w-4 h-4" />,
    };
}

export default function ParentDashboard() {
    const [dashboard, setDashboard] = useState<ParentDashboardPayload | null>(null);
    const [note, setNote] = useState("Загружаем обзор успеваемости ребенка.");

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch("/api/parent/dashboard");
                const data = await response.json();
                if (!response.ok) throw new Error(data?.error || "Не удалось загрузить кабинет родителя.");
                setDashboard(data.dashboard);
                setNote("Данные родителя и ребенка синхронизированы. Можно спокойно смотреть картину недели.");
            } catch (error) {
                setNote(error instanceof Error ? error.message : "Не удалось загрузить кабинет родителя.");
            }
        };

        void load();
    }, []);

    const child = dashboard?.child;
    const grades = dashboard?.grades ?? [];
    const goodGrades = grades.filter((item) => item.status === "good").length;
    const badGrades = grades.filter((item) => item.status === "bad").length;
    const concernTone = getConcernTone(child?.absences ?? 0, badGrades, child?.gpa ?? 0);

    const homeChecklist = [
        child?.absences && child.absences > 0
            ? `Уточнить причину ${child.absences} пропусков и восстановить пропущенные темы.`
            : "Поддержать текущий темп без лишнего давления.",
        badGrades > 0
            ? `Обсудить предметы, где есть сложность: ${grades.filter((item) => item.status === "bad").map((item) => item.name).join(", ")}.`
            : "Похвалить за сильные результаты и закрепить уверенность.",
        dashboard?.recommendation ?? "Выделить время на разговор о дедлайнах и режиме подготовки.",
    ];

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary/70">Parent view</p>
                    <h1 className="mt-2 text-3xl font-sora font-bold text-foreground">Кабинет родителя</h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">
                        {child ? `Спокойный обзор по ученику ${child.fullName}, ${child.className} класс` : "Загружаем привязанного ученика..."}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="liquid-glass rounded-2xl px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Родитель</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{dashboard?.parent.fullName ?? "Профиль загружается"}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {child?.fullName?.slice(0, 1) ?? "?"}
                    </div>
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-foreground">{note}</p>
            </div>

            <div className={`rounded-[2rem] border p-6 ${concernTone.card}`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${concernTone.badge}`}>
                            {concernTone.icon}
                            {concernTone.label}
                        </div>
                        <h2 className="mt-4 text-2xl font-sora font-bold text-foreground">
                            {child ? `${child.fullName}: что важно родителю на этой неделе` : "Собираем картину недели"}
                        </h2>
                        <p className="mt-2 text-sm text-foreground/80 max-w-3xl">
                            {dashboard?.aiSummary ?? "Аналитика скоро появится."}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 min-w-[260px]">
                        <div className="rounded-2xl bg-white/70 px-4 py-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Средний балл</p>
                            <p className="mt-2 text-2xl font-sora font-bold text-foreground">{child?.gpa.toFixed(1) ?? "0.0"}</p>
                        </div>
                        <div className="rounded-2xl bg-white/70 px-4 py-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Пропуски</p>
                            <p className="mt-2 text-2xl font-sora font-bold text-foreground">{child?.absences ?? 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                        <Award className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Сильные оценки</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{goodGrades}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Результаты, которые сейчас поддерживают уверенность.</p>
                </div>
                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-3">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Предметы в обзоре</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{grades.length}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Столько предметов попало в недельный родительский снимок.</p>
                </div>
                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 mb-3">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Нужны обсуждения</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{badGrades}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Оценки, где ребенку, скорее всего, нужна поддержка.</p>
                </div>
                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 mb-3">
                        <BellRing className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Новости школы</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">{dashboard?.news.length ?? 0}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Объявления, которые важно увидеть родителю вовремя.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-[#f8f5ff] to-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Подсказка недели для семьи</h2>
                        </div>
                        <div className="space-y-4">
                            <p className="rounded-2xl border border-white/60 bg-white/70 p-4 text-sm font-medium leading-relaxed text-foreground/85">
                                {dashboard?.recommendation ?? "Рекомендация будет доступна после загрузки аналитики."}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setNote(`Отмечено: обсудить с ребенком режим и дедлайны. ${dashboard?.recommendation ?? ""}`)}
                                    className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                                >
                                    Сохранить как план разговора
                                </button>
                                <button
                                    onClick={() => setNote("Отмечено: вечером выделить 15 минут на спокойный разговор о школе без давления.")}
                                    className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-black/5"
                                >
                                    Напомнить себе обсудить дома
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <div>
                                <h2 className="text-lg font-sora font-bold text-foreground">Оценки за неделю</h2>
                                <p className="text-sm text-muted-foreground mt-1">Не просто цифры, а понятный weekly snapshot по предметам.</p>
                            </div>
                            <button onClick={() => setNote("Открыта расширенная история оценок за последние недели.")} className="text-xs font-semibold text-primary hover:text-primary/80">
                                Подробнее
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {grades.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setNote(`Открыта карточка: ${item.name} • ${item.type} • результат ${item.grade}.`)}
                                    className="rounded-[1.5rem] border border-border/60 bg-white/50 p-5 text-left hover:border-primary/30"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{item.type}</span>
                                            <p className="mt-2 text-base font-semibold text-foreground">{item.name}</p>
                                        </div>
                                        <div className={`text-2xl font-sora font-bold ${item.status === "bad" ? "text-red-500" : item.status === "good" ? "text-green-500" : "text-blue-500"}`}>
                                            {item.grade}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-xs">
                                        {item.status === "good" && (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                <span className="font-semibold text-green-700">Можно похвалить и закрепить уверенность</span>
                                            </>
                                        )}
                                        {item.status === "bad" && (
                                            <>
                                                <XCircle className="w-4 h-4 text-red-500" />
                                                <span className="font-semibold text-red-700">Нужен спокойный разбор и поддержка</span>
                                            </>
                                        )}
                                        {item.status !== "good" && item.status !== "bad" && (
                                            <>
                                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                                                <span className="font-semibold text-blue-700">Нейтральный результат, следим за динамикой</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            ))}
                            {grades.length === 0 && <p className="text-sm text-muted-foreground">Данных по оценкам пока нет.</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Как поговорить дома</h2>
                        </div>
                        <div className="space-y-3">
                            {homeChecklist.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => setNote(`Зафиксировано для родителя: ${item}`)}
                                    className="w-full rounded-2xl border border-border/60 bg-white/50 p-4 text-left hover:border-primary/30"
                                >
                                    <p className="text-sm font-medium text-foreground/85">{item}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Новости и объявления</h2>
                        </div>
                        <div className="space-y-4">
                            {dashboard?.news.map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={() => setNote(`Открыта новость: ${item.title}.`)}
                                    className="w-full rounded-2xl border border-border bg-white/50 p-4 flex items-start gap-3 text-left hover:border-primary/30"
                                >
                                    {index === 0 ? <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" /> : <Award className="w-5 h-5 text-secondary-accent shrink-0 mt-0.5" />}
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                                        <p className="mt-1 text-xs text-muted-foreground">{item.date}</p>
                                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                                    </div>
                                </button>
                            ))}
                            {(dashboard?.news.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Новостей пока нет.</p>}
                        </div>
                        <Link href="/news" className="mt-4 flex w-full items-center justify-center gap-1 text-sm font-semibold text-primary hover:underline">
                            Все новости школы
                        </Link>
                    </div>

                    <div className="rounded-[2rem] border border-green-200 bg-green-50/70 p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Спокойный вывод</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/80">
                            {badGrades > 0 || (child?.absences ?? 0) > 0
                                ? "Сейчас важнее не усиливать давление, а помочь ребенку структурировать неделю: понять, где пробел, и вместе выбрать один понятный следующий шаг."
                                : "Текущая картина выглядит устойчиво. Лучшее, что можно сделать дома, — поддержать ритм и отметить то, что уже получается хорошо."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
