"use client";

import React, { useState, useEffect } from "react";
import { Clock, Info, ShieldAlert, Sparkles } from "lucide-react";

type KioskPayload = {
    replacements: Array<{ id: string; title: string; body: string }>;
    featured: { id: string; title: string; body: string } | null;
    spotlight: { id: string; title: string; body: string } | null;
    cafeteria: { id: string; title: string; body: string } | null;
    meta: { weekLabel: string | null; updatedAt: string | null; replacementsCount: number };
};

export default function KioskMode() {
    const [time, setTime] = useState("");
    const [kiosk, setKiosk] = useState<KioskPayload | null>(null);

    useEffect(() => {
        const int = setInterval(() => {
            setTime(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
        }, 1000);

        const load = async () => {
            const response = await fetch("/api/kiosk");
            const data = await response.json();
            if (response.ok) {
                setKiosk(data.kiosk);
            }
        };

        void load();
        return () => clearInterval(int);
    }, []);

    return (
        <div className="min-h-screen bg-background flex flex-col p-8 overflow-hidden relative">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-primary/20 blur-[200px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-secondary-accent/20 blur-[200px]" />
            </div>

            <header className="flex justify-between items-end mb-12 relative z-10 border-b border-border pb-6">
                <div>
                    <h1 className="text-5xl font-sora font-bold text-foreground mb-2">Aqbobek Lyceum</h1>
                    <p className="text-xl text-muted-foreground font-medium">Цифровая панель школы</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {kiosk?.meta.weekLabel ? `Публикация недели: ${kiosk.meta.weekLabel}` : "Ожидаем публикацию недели"}
                        {kiosk?.meta.updatedAt ? ` • обновлено ${kiosk.meta.updatedAt}` : ""}
                    </p>
                </div>
                <div className="text-right flex items-center gap-4">
                    <Clock className="w-8 h-8 text-primary" />
                    <span className="text-6xl font-sora font-bold text-primary tracking-tighter">{time || "12:00"}</span>
                </div>
            </header>

            <main className="flex-1 grid grid-cols-3 gap-8 relative z-10">
                <div className="col-span-1 space-y-6">
                    <div className="bg-red-50/80 border-2 border-red-200 rounded-[2rem] p-8 shadow-xl">
                        <h2 className="text-3xl font-sora font-bold text-red-900 mb-6 flex items-center gap-3">
                            <ShieldAlert className="w-8 h-8" /> Замены на сегодня
                        </h2>
                        <p className="text-sm text-red-800/70 mb-6">Активных карточек: {kiosk?.meta.replacementsCount ?? 0}</p>
                        <div className="space-y-6">
                            {kiosk?.replacements.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
                                    <p className="text-sm font-bold text-red-700 uppercase tracking-widest mb-1">{item.title}</p>
                                    <p className="text-2xl font-bold text-foreground leading-tight">{item.body}</p>
                                </div>
                            ))}
                            {(kiosk?.replacements.length ?? 0) === 0 && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
                                    <p className="text-xl font-bold text-foreground">Сегодня замен нет</p>
                                    <p className="mt-2 text-sm text-muted-foreground">Цифровая панель автоматически покажет новые карточки после перестройки расписания.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-span-2 space-y-8">
                    <div className="liquid-glass-strong rounded-[2rem] p-10 h-full flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-10 right-10">
                            <Info className="w-12 h-12 text-primary/40" />
                        </div>
                        <span className="bg-primary/20 text-primary px-4 py-2 rounded-xl text-lg font-bold uppercase tracking-wider mb-6 w-max inline-block">Важное объявление</span>
                        <h2 className="text-5xl sm:text-6xl font-sora font-bold text-foreground leading-[1.1] mb-6">
                            {kiosk?.featured?.title ?? "Нет опубликованного объявления"}
                        </h2>
                        <p className="text-3xl text-muted-foreground leading-relaxed">
                            {kiosk?.featured?.body ?? "Ожидаем обновление цифровой панели."}
                        </p>
                    </div>
                </div>
            </main>

            <footer className="mt-8 pt-6 border-t border-border flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <span className="text-xl font-bold text-foreground">{kiosk?.spotlight?.title ?? "Ученик дня"}: <span className="text-primary">{kiosk?.spotlight?.body ?? "будет определен позже"}</span></span>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-white/50 backdrop-blur-md rounded-full border border-border text-lg font-semibold text-muted-foreground">
                    {kiosk?.cafeteria?.body ?? "Меню столовой обновляется"}
                </div>
            </footer>
        </div>
    );
}
