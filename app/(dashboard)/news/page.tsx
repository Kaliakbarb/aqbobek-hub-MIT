"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, Filter, ArrowRight, BellRing, Target } from "lucide-react";

type NewsItem = {
    id: string;
    type: string;
    title: string;
    desc: string;
    date: string;
    highlight?: boolean;
    pinned?: boolean;
};

export default function NewsFeed() {
    const [filter, setFilter] = useState("Все");
    const [activeTitle, setActiveTitle] = useState("Открывайте новости, чтобы смотреть подробности прямо в ленте.");
    const [items, setItems] = useState<NewsItem[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch("/api/news");
                const data = await response.json();
                if (!response.ok) throw new Error(data?.error || "Не удалось загрузить новости.");
                setItems(data.items);
            } catch (error) {
                setActiveTitle(error instanceof Error ? error.message : "Не удалось загрузить новости.");
            }
        };

        void load();
    }, []);

    const hero = useMemo(() => items.find((item) => item.pinned) ?? items[0], [items]);
    const filters = useMemo(() => ["Все", ...new Set(items.map((item) => item.type))], [items]);

    const filteredItems = useMemo(() => {
        if (filter === "Все") return items;
        return items.filter((item) => item.type === filter);
    }, [items, filter]);

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
                    {hero && (
                        <button
                            onClick={() => setActiveTitle(`${hero.title}: ${hero.desc}`)}
                            className="relative liquid-glass rounded-[2rem] overflow-hidden group cursor-pointer block text-left w-full"
                        >
                            <div className="h-64 sm:h-80 w-full bg-gradient-to-tr from-primary to-secondary-accent relative p-6 sm:p-8 flex flex-col justify-end">
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                <div className="relative z-10 text-white">
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-4 inline-block">Важное</span>
                                    <h2 className="text-2xl sm:text-3xl font-sora font-bold mb-2">{hero.title}</h2>
                                    <p className="text-white/80 text-sm max-w-lg mb-4">{hero.desc}</p>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-white/60">
                                        <CalendarIcon className="w-4 h-4" /> {hero.date}
                                    </div>
                                </div>
                            </div>
                        </button>
                    )}

                    <div className="space-y-4">
                        {filteredItems.map((news) => (
                            <button
                                key={news.id}
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
                        <p className="text-sm text-blue-800/80 mb-5">Отображаются на основе вашего профиля и опубликованных администрацией новостей</p>
                        <div className="space-y-3">
                            {items.filter((item) => item.highlight).slice(0, 2).map((item) => (
                                <button key={item.id} onClick={() => setActiveTitle(`${item.title}: ${item.desc}`)} className="w-full bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-start gap-3 text-left">
                                    <BellRing className="w-5 h-5 text-blue-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-blue-950">{item.title}</p>
                                        <p className="text-xs text-blue-800/70 mt-1">{item.date}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
