"use client";

import React, { useMemo, useState } from "react";
import {
    Wand2, Calendar as CalendarIcon,
    CheckCircle2, Users, RefreshCw
} from "lucide-react";

type ScheduleSlot = {
    time: string;
    subject: string;
    teacher: string;
    room: string;
    split?: boolean;
};

const schedules = {
    "10 А": [
        { time: "08:30 - 09:15", subject: "Алгебра", teacher: "Смагулова К.А.", room: "302" },
        { time: "09:25 - 10:10", subject: "Физика", teacher: "Жукенов М.Т.", room: "Лаб. 3" },
        { time: "10:30 - 11:15", subject: "Английский (Лента)", teacher: "Подгруппы 1, 2", room: "205, 206", split: true },
        { time: "11:25 - 12:10", subject: "История", teacher: "Ахметов С.С.", room: "310" },
        { time: "12:20 - 13:05", subject: "Физкультура", teacher: "Иванов В.П.", room: "Спортзал 1" },
    ] as ScheduleSlot[],
    "10 Б": [
        { time: "08:30 - 09:15", subject: "Геометрия", teacher: "Иманбаева Л.Н.", room: "304" },
        { time: "09:25 - 10:10", subject: "Физика", teacher: "Жукенов М.Т.", room: "Лаб. 3" },
        { time: "10:30 - 11:15", subject: "Английский (Лента)", teacher: "Подгруппы 1, 3", room: "205, 207", split: true },
        { time: "11:25 - 12:10", subject: "Химия", teacher: "Турсунова А.А.", room: "Лаб. 1" },
        { time: "12:20 - 13:05", subject: "Физкультура", teacher: "Иванов В.П.", room: "Стадион" },
    ] as ScheduleSlot[],
    "10 В": [
        { time: "08:30 - 09:15", subject: "Алгебра", teacher: "Смагулова К.А.", room: "301" },
        { time: "09:25 - 10:10", subject: "Биология", teacher: "Сейтова Р.Е.", room: "204" },
        { time: "10:30 - 11:15", subject: "Английский", teacher: "Абильдина М.С.", room: "210" },
        { time: "11:25 - 12:10", subject: "История", teacher: "Ахметов С.С.", room: "310" },
        { time: "12:20 - 13:05", subject: "Информатика", teacher: "Муратов Н.К.", room: "Lab IT" },
    ] as ScheduleSlot[],
};

export default function SmartSchedule() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [selectedClass, setSelectedClass] = useState<keyof typeof schedules>("10 А");
    const [published, setPublished] = useState(false);

    const handleGenerate = () => {
        setPublished(false);
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setGenerated(true);
        }, 1800);
    };

    const selectedSchedule = useMemo(() => schedules[selectedClass], [selectedClass]);

    return (
        <div className="space-y-6 animate-fadeUp h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shadow-sm pb-4 border-b border-border">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Умное расписание</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Локально работающий демо-модуль генерации расписания</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm ${isGenerating ? "bg-muted text-muted-foreground cursor-not-allowed" : generated ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5"}`}
                >
                    {isGenerating ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Вычисляем матрицу...</>
                    ) : generated ? (
                        <><CheckCircle2 className="w-4 h-4" /> Оптимально сгенерировано</>
                    ) : (
                        <><Wand2 className="w-4 h-4" /> Сгенерировать расписание</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="font-sora font-bold text-foreground">Вводные данные</h2>

                    <div className="liquid-glass p-4 rounded-2xl bg-white/50 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Преподаватели</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-black/5 rounded-lg border border-border">
                                <span>Доступно:</span> <span className="text-green-600 font-bold">82/84</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-orange-50 rounded-lg border border-orange-100 text-orange-800">
                                <span>Отсутствуют:</span> <span>2 (Больничный)</span>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass p-4 rounded-2xl bg-white/50 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Кабинетный фонд</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-black/5 rounded-lg border border-border">
                                <span>Обычные классы:</span> <span className="font-bold text-foreground">40</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-black/5 rounded-lg border border-border">
                                <span>Лаборатории:</span> <span className="font-bold text-foreground">6</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-red-50 rounded-lg border border-red-100 text-red-800">
                                <span>Недоступно:</span> <span>Спортзал 2 (Ремонт)</span>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass p-4 rounded-2xl bg-white/50 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ленты (Группы)</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium p-2 bg-blue-50/50 rounded-lg border border-blue-100 text-blue-900 justify-start gap-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span>Английский: 10кл (3 группы)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 liquid-glass rounded-[2rem] p-6 flex flex-col relative overflow-hidden">
                    {!generated && !isGenerating && (
                        <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="bg-white/90 p-6 rounded-2xl shadow-xl border border-primary/20 text-center max-w-sm">
                                <Wand2 className="w-10 h-10 text-primary mx-auto mb-3 opacity-50" />
                                <h3 className="font-sora font-bold text-lg text-foreground mb-2">Нажмите «Сгенерировать»</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">Система локально подготовит демо-сетку без накладок с учетом замен и доступных кабинетов.</p>
                            </div>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
                                <p className="font-sora font-semibold text-lg text-primary">Оптимизация графа расписания...</p>
                                <div className="text-xs text-muted-foreground font-mono bg-black/5 p-3 rounded-lg text-left max-w-xs mx-auto">
                                    &gt; resolving node overlap...<br />
                                    &gt; placing English_group_3...<br />
                                    &gt; mitigating PE_Hall clash...<br />
                                    &gt; 10,240 permutations checked.
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-sora font-bold text-foreground">Сетка: {selectedClass} (Понедельник)</h2>
                        <div className="flex gap-2">
                            {(Object.keys(schedules) as Array<keyof typeof schedules>).map((className) => (
                                <button
                                    key={className}
                                    onClick={() => setSelectedClass(className)}
                                    className={`text-xs font-bold px-3 py-1 rounded-lg ${selectedClass === className ? "bg-black/5 text-foreground" : "bg-transparent border border-border text-muted-foreground"}`}
                                >
                                    {className}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto pr-2">
                        <div className="space-y-3 min-w-[400px]">
                            {selectedSchedule.map((slot, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${slot.split ? "bg-blue-50/50 border-blue-200" : "bg-white/60 border-border/50"} flex items-center transition-all ${generated ? "opacity-100" : "opacity-30 blur-sm"}`}>
                                    <div className="w-32 shrink-0">
                                        <span className="text-xs font-bold text-muted-foreground">{slot.time}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-foreground">{slot.subject}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{slot.teacher}</p>
                                    </div>
                                    <div className="w-24 text-right">
                                        <span className="text-xs font-semibold px-2 py-1 bg-black/5 rounded-md text-foreground">{slot.room}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <h2 className="font-sora font-bold text-foreground">Анализ коллизий</h2>

                    <div className="liquid-glass p-5 rounded-2xl bg-white/50 border border-primary/10">
                        {generated ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                    <p className="text-sm font-medium text-green-900 leading-snug">0 накладок. Все классы укомплектованы на 100%.</p>
                                </div>

                                <div className="h-[1px] w-full bg-border"></div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase">Решенные проблемы:</h4>
                                    <div className="bg-orange-50 border border-orange-100 p-2 rounded-lg text-xs text-orange-800 flex flex-col gap-1">
                                        <span className="font-bold">Физрук заболел</span>
                                        <span>ИИ объединил 10А и 10Б на стадионе со вторым учителем.</span>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg text-xs text-blue-900 flex flex-col gap-1">
                                        <span className="font-bold">Ремонт зала</span>
                                        <span>Уроки переведены на альтернативные площадки согласно погоде.</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setPublished(true)}
                                    className={`w-full py-2 rounded-xl text-xs font-bold transition-colors mt-2 ${published ? "bg-green-500 text-white" : "bg-black/5 hover:bg-black/10 text-foreground"}`}
                                >
                                    {published ? "Опубликовано для всех ролей" : "Опубликовать для всех"}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium opacity-50 flex-col py-6 text-center">
                                <CalendarIcon className="w-8 h-8" />
                                <span>Отчет появится после генерации</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
