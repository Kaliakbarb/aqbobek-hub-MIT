"use client";

import React, { useMemo, useState } from "react";
import { Trophy, Medal, Star, Flame, Crown, ArrowUp, Zap, Brain, ShieldCheck } from "lucide-react";

const rankings = {
    "Общий рейтинг": [
        { rank: 1, name: "Алиса Воронова", class: "11 А", points: 1450, trend: "up" },
        { rank: 2, name: "Дамир Абишев", class: "11 В", points: 1395, trend: "up" },
        { rank: 3, name: "Жанель Сапарова", class: "10 Б", points: 1320, trend: "down" },
        { rank: 4, name: "Тимур Асанов", class: "10 А", points: 1280, trend: "up", me: true },
        { rank: 5, name: "Илья Макаров", class: "10 В", points: 1105, trend: "-" },
    ],
    "Точные науки": [
        { rank: 1, name: "Тимур Асанов", class: "10 А", points: 980, trend: "up", me: true },
        { rank: 2, name: "Алиса Воронова", class: "11 А", points: 965, trend: "up" },
        { rank: 3, name: "Дамир Абишев", class: "11 В", points: 910, trend: "down" },
    ],
    "Олимпиады": [
        { rank: 1, name: "Жанель Сапарова", class: "10 Б", points: 620, trend: "up" },
        { rank: 2, name: "Тимур Асанов", class: "10 А", points: 600, trend: "up", me: true },
        { rank: 3, name: "Алиса Воронова", class: "11 А", points: 590, trend: "up" },
    ],
};

export default function Leaderboard() {
    const [category, setCategory] = useState<keyof typeof rankings>("Общий рейтинг");
    const [status, setStatus] = useState("Следите за рейтингом, бейджами и личным прогрессом по категориям.");

    const students = useMemo(() => rankings[category], [category]);

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shadow-sm pb-4 border-b border-border">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Рейтинг и Достижения</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Геймификация учебного процесса</p>
                </div>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4">
                <p className="text-sm font-semibold text-foreground">{status}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                <div className="lg:col-span-1 space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem] bg-gradient-to-tr from-orange-50 to-white border-orange-100 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 mb-4 shadow-sm relative">
                            <Flame className="w-10 h-10" />
                            <span className="absolute -bottom-2 -right-2 bg-foreground text-background text-xs font-bold px-2 py-1 rounded-lg">x14</span>
                        </div>
                        <h2 className="text-2xl font-sora font-bold text-foreground mb-1">Ударный темп!</h2>
                        <p className="text-sm font-medium text-muted-foreground">14 дней подряд без пропусков домашних заданий</p>
                        <div className="flex gap-1 mt-4">
                            {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
                                <div key={i} className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${i < 6 ? "bg-orange-500 text-white" : "bg-black/5 text-muted-foreground"}`}>{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][i]}</div>
                            ))}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Твои бейджи</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: Brain, color: "text-purple-600", bg: "bg-purple-100", label: "Эрудит" },
                                { icon: Zap, color: "text-amber-500", bg: "bg-amber-100", label: "Скорость" },
                                { icon: Star, color: "text-blue-500", bg: "bg-blue-100", label: "Перфекционист" },
                                { icon: Medal, color: "text-green-600", bg: "bg-green-100", label: "Спорт" },
                                { icon: ShieldCheck, color: "text-foreground", bg: "bg-black/10", label: "Староста" },
                            ].map((badge) => {
                                const Icon = badge.icon;
                                return (
                                    <button key={badge.label} onClick={() => setStatus(`Открыт бейдж «${badge.label}». Можно посмотреть, за что он был получен.`)} className="flex flex-col items-center gap-2 cursor-pointer group">
                                        <div className={`w-14 h-14 rounded-full ${badge.bg} ${badge.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-wider">{badge.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 liquid-glass rounded-[2rem] p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border bg-white/50 backdrop-blur-md flex justify-between items-center">
                        <h2 className="text-lg font-sora font-bold text-foreground flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" /> Топ 10 школы (10-11 классы)
                        </h2>
                        <select
                            value={category}
                            onChange={(e) => {
                                const next = e.target.value as keyof typeof rankings;
                                setCategory(next);
                                setStatus(`Переключен рейтинг: ${next}.`);
                            }}
                            className="bg-transparent border border-border text-sm font-semibold rounded-lg px-2 py-1 text-muted-foreground focus:outline-none"
                        >
                            {Object.keys(rankings).map((option) => (
                                <option key={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 overflow-auto p-2">
                        {students.map((student) => (
                            <button
                                key={`${category}-${student.rank}-${student.name}`}
                                onClick={() => setStatus(`Открыта карточка участника: ${student.name}, ${student.class}, ${student.points} XP.`)}
                                className={`flex items-center gap-4 p-4 rounded-xl mb-1 w-full text-left ${student.me ? "bg-primary/10 border border-primary/20 shadow-sm" : "hover:bg-black/5"} transition-colors`}
                            >
                                <div className={`w-8 font-sora font-bold text-xl text-center ${student.rank === 1 ? "text-yellow-500" : student.rank === 2 ? "text-gray-400" : student.rank === 3 ? "text-amber-700" : "text-muted-foreground"}`}>
                                    {student.rank === 1 ? <Crown className="w-6 h-6 mx-auto" /> : student.rank}
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary-accent text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    {student.name[0]}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${student.me ? "text-primary" : "text-foreground"}`}>
                                        {student.name} {student.me && "(Вы)"}
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-medium">{student.class}</p>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                    <span className="font-sora font-bold text-foreground">{student.points} <span className="text-xs text-muted-foreground font-medium">XP</span></span>
                                    {student.trend === "up" ? <ArrowUp className="w-4 h-4 text-green-500" /> : student.trend === "down" ? <ArrowUp className="w-4 h-4 text-red-500 rotate-180" /> : <span className="w-4 h-4" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
