import React from "react";
import {
    HeartPulse, Sparkles, AlertCircle, Calendar,
    Award, FileText, ArrowUpRight, CheckCircle2, XCircle
} from "lucide-react";

export default function ParentDashboard() {
    return (
        <div className="space-y-6 animate-fadeUp">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Кабинет родителя</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Обзор успеваемости: Тимур (10 \"А\" класс)</p>
                </div>
                <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold">
                        Т
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col */}
                <div className="lg:col-span-2 space-y-6">

                    {/* AI Weekly Summary */}
                    <div className="bg-gradient-to-br from-[#f8f5ff] to-white border border-primary/20 p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <HeartPulse className="w-48 h-48 text-primary" />
                        </div>
                        <div className="flex items-center gap-3 mb-5 relative z-10">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Сводка за неделю от ИИ-Наставника</h2>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <p className="text-sm font-medium text-foreground/80 leading-relaxed bg-white/60 p-4 rounded-xl border border-white/50">
                                Ваш ребенок, Тимур, показывает <span className="text-green-600 font-bold">сильную динамику по алгебре</span> (решено 100% домашних заданий без ошибок). Однако, мы заметили, что он <span className="text-orange-600 font-bold">пропустил 2 урока истории</span> на прошлой неделе и имеет небольшие трудности с новой темой по физике.
                            </p>

                            <div className="bg-white/60 border border-border/50 rounded-xl p-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Рекомендация для вас:</h4>
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                        Рекомендуется обсудить с Тимуром тайм-менеджмент и убедиться, что у него достаточно времени на выполнение заданий по предметам гуманитарного цикла. Также мы предложили ему короткий видеоурок по физике в его кабинете.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grades Snapshot */}
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-sora font-bold text-foreground">Оценки за неделю</h2>
                            <button className="text-xs font-semibold text-primary">Подробнее</button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { name: "Алгебра", grade: "5", type: "СОЧ", status: 'good' },
                                { name: "Физика", grade: "4", type: "ДЗ", status: 'neutral' },
                                { name: "Биология", grade: "5", type: "Классная", status: 'good' },
                                { name: "История", grade: "Н", type: "Отсутствие", status: 'bad' },
                            ].map((item, i) => (
                                <div key={i} className="bg-black/5 p-4 rounded-2xl flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{item.type}</span>
                                        <p className="text-sm font-semibold text-foreground mt-1">{item.name}</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className={`text-2xl font-sora font-bold ${item.status === 'bad' ? 'text-red-500' : item.status === 'good' ? 'text-green-500' : 'text-blue-500'
                                            }`}>{item.grade}</span>
                                        {item.status === 'good' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                        {item.status === 'bad' && <XCircle className="w-5 h-5 text-red-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Col */}
                <div className="space-y-6">

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="liquid-glass p-5 rounded-2xl">
                            <p className="text-xs text-muted-foreground font-semibold mb-1">Средний балл</p>
                            <p className="text-2xl font-sora font-bold">4.8</p>
                        </div>
                        <div className="liquid-glass p-5 rounded-2xl bg-orange-50/50 border-orange-100">
                            <p className="text-xs text-orange-800/60 font-semibold mb-1">Пропуски</p>
                            <p className="text-2xl font-sora font-bold text-orange-700">2<span className="text-sm font-medium"> ур.</span></p>
                        </div>
                    </div>

                    {/* Announcements */}
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Объявления школы</h2>
                        <div className="space-y-4">
                            <div className="bg-white/50 p-4 rounded-xl border border-border flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-foreground">Родительское собрание</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">18 Марта, 19:00, Кабинет 302. Явка обязательна.</p>
                                </div>
                            </div>

                            <div className="bg-white/50 p-4 rounded-xl border border-border flex items-start gap-3">
                                <Award className="w-5 h-5 text-secondary-accent shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-foreground">Олимпиада по физике</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Тимур номинирован на участие в городской олимпиаде!</p>
                                </div>
                            </div>
                        </div>
                        <button className="w-full mt-4 text-sm font-semibold text-primary flex items-center justify-center gap-1 hover:underline">
                            Все новости
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
