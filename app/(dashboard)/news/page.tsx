"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, Filter, ArrowRight, BellRing, Target } from "lucide-react";
import { readAnnouncements, subscribeAdminSync, type DemoAnnouncement } from "../../../lib/demo-admin-store";

const baseFeed = [
    { type: "Олимпиада", title: "Регистрация на турнир Кеңгуру", desc: "Ученики 5-11 классов могут принять участие в математическом турнире.", date: "10 Марта" },
    { type: "Расписание", title: "Изменение расписания звонков", desc: "В связи с сокращенным днем, звонки сдвинуты на 10 минут.", date: "9 Марта", highlight: true },
    { type: "Курсы", title: "Набор в группу подготовки к IELTS", desc: "Учитель английского языка проводит бесплатные занятия для 11 классов по субботам.", date: "8 Марта" },
    { type: "Спорт", title: "Победа в городском чемпионате по баскетболу", desc: "Сборная школы заняла почетное 1 место в региональных играх.", date: "5 Марта" },
];

function formatDate(value: string) {
    if (!value.includes("-")) return value;

    const date = new Date(value);
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);
}

export default function NewsFeed() {
    const [filter, setFilter] = useState("Все");
    const [activeTitle, setActiveTitle] = useState("Открывайте новости, чтобы смотреть подробности прямо в ленте.");
    const [adminAnnouncements, setAdminAnnouncements] = useState<DemoAnnouncement[]>([]);

    useEffect(() => {
        const sync = () => setAdminAnnouncements(readAnnouncements());
        sync();
        return subscribeAdminSync(sync);
    }, []);

    const allItems = useMemo(() => {
        const published = adminAnnouncements.map((item) => ({
            type: item.type,
            title: item.title,
            desc: item.desc,
            date: formatDate(item.date),
            highlight: item.highlight,
        }));
        return [...published, ...baseFeed];
    }, [adminAnnouncements]);

    const filters = ["Все", "Объявление", "Олимпиада", "Расписание", "Курсы", "Спорт"];

    const items = useMemo(() => {
        if (filter === "Все") return allItems;
        return allItems.filter((item) => item.type === filter);
    }, [allItems, filter]);

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Новости и Объявления</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Лента событий Aqbobek Lyceum</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {filters.map((item) => (
                        <button
                            key={item}
                            onClick={() => setFilter(item)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border ${filter === item ? "bg-primary text-white border-primary" : "bg-white border-border text-foreground"}`}
                        >
                            <Filter className="w-4 h-4" />
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4">
                <p className="text-sm font-semibold text-foreground">{activeTitle}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <button
                        onClick={() => setActiveTitle("Открытие кампуса робототехники: торжественное мероприятие пройдет в среду, приглашены старшеклассники и преподаватели IT-направлений.")}
                        className="relative liquid-glass rounded-[2rem] overflow-hidden group cursor-pointer block text-left w-full"
                    >
                        <div className="h-64 sm:h-80 w-full bg-gradient-to-tr from-primary to-secondary-accent relative p-6 sm:p-8 flex flex-col justify-end">
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                            <div className="relative z-10 text-white">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-4 inline-block">Важное</span>
                                <h2 className="text-2xl sm:text-3xl font-sora font-bold mb-2">Открытие нового кампуса робототехники</h2>
                                <p className="text-white/80 text-sm max-w-lg mb-4">В среду состоится торжественное открытие лаборатории. Приглашаются старшеклассники и учителя IT направлений.</p>
                                <div className="flex items-center gap-2 text-xs font-semibold text-white/60">
                                    <CalendarIcon className="w-4 h-4" /> 12 Марта 2026
                                </div>
                            </div>
                        </div>
                    </button>

                    <div className="space-y-4">
                        {items.map((news) => (
                            <button
                                key={`${news.type}-${news.title}`}
                                onClick={() => setActiveTitle(`${news.title}: ${news.desc}`)}
                                className={`liquid-glass p-5 rounded-2xl flex flex-col sm:flex-row gap-5 items-start sm:items-center cursor-pointer hover:border-primary/30 transition-colors text-left w-full ${news.highlight ? "border border-orange-200 bg-orange-50/10" : ""}`}
                            >
                                <div className="flex-1">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider mb-2 block ${news.highlight ? "text-orange-600" : "text-primary"}`}>{news.type}</span>
                                    <h3 className="font-bold text-foreground text-lg leading-tight mb-2">{news.title}</h3>
                                    <p className="text-sm text-muted-foreground">{news.desc}</p>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-2 shrink-0">
                                    <span className="text-xs font-semibold text-muted-foreground bg-black/5 px-2 py-1 rounded">{news.date}</span>
                                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-colors">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem] bg-gradient-to-b from-blue-50/50 to-white border-blue-100">
                        <h2 className="text-lg font-sora font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5" /> Целевые уведомления
                        </h2>
                        <p className="text-sm text-blue-800/80 mb-5">Отображаются на основе вашего профиля (10 "А" класс)</p>
                        <div className="space-y-3">
                            <button onClick={() => setActiveTitle("Сдача СОЧ по физике: дедлайн 16 Марта, кабинет 302. Уведомление сохранено как важное.")} className="w-full bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-start gap-3 text-left">
                                <BellRing className="w-5 h-5 text-blue-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-blue-950">Сдача СОЧ по физике</p>
                                    <p className="text-xs text-blue-800/70 mt-1">Дедлайн: 16 Марта. Кабинет 302.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
