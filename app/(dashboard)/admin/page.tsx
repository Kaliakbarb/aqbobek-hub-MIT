import React from "react";
import {
    BarChart3, Activity, Users, BookOpen,
    Send, AlertTriangle, ShieldCheck, Settings, BellRing
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
    return (
        <div className="space-y-6 animate-fadeUp">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Командный центр</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Aqbobek Lyceum • Главная сводка</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/schedule" className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        Управление расписанием
                    </Link>
                </div>
            </div>

            {/* Top Stats */}
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
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 mb-3">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Средняя успеваемость</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">4.5 <span className="text-green-500 text-sm font-bold">↑ 0.1</span></p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 mb-3">
                        <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Инциденты за день</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">3 <span className="text-sm font-normal text-muted-foreground">решаются</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Performance Radar/Trends Placeholder */}
                    <div className="liquid-glass p-6 rounded-[2rem] min-h-[300px] flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h2 className="text-lg font-sora font-bold text-foreground">Аналитика по параллелям</h2>
                            <button className="text-xs font-semibold bg-white border border-border px-3 py-1.5 rounded-lg">Экспорт</button>
                        </div>
                        {/* Fake Chart Area */}
                        <div className="flex-1 w-full bg-gradient-to-t from-black/5 to-transparent rounded-xl flex items-end px-4 gap-2 pt-10">
                            {[80, 85, 92, 78, 88, 95, 82, 90, 86, 94].map((h, i) => (
                                <div key={i} className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors relative group" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {h}%
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 px-4 relative z-10 text-[10px] text-muted-foreground font-bold uppercase">
                            <span>1 классы</span>
                            <span>11 классы</span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-primary/5 border border-primary/20 p-5 rounded-3xl flex items-center justify-between hover:bg-primary/10 transition-colors cursor-pointer">
                            <div>
                                <h3 className="font-bold text-foreground">Сделать рассылку</h3>
                                <p className="text-xs text-muted-foreground mt-1">Отправить пуш-уведомление</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <Send className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 p-5 rounded-3xl flex items-center justify-between hover:bg-orange-100/50 transition-colors cursor-pointer">
                            <div>
                                <h3 className="font-bold text-orange-900">Замены учителей</h3>
                                <p className="text-xs text-orange-700/80 mt-1">2 запроса на больничный</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Col */}
                <div className="space-y-6">

                    {/* Target Notifications Config */}
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Журнал событий</h2>
                        <div className="space-y-4">
                            <div className="flex gap-3 items-start border-b border-border pb-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mt-0.5 shrink-0">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Система стабильна</p>
                                    <p className="text-xs text-muted-foreground">Последний бекап: 2 часа назад</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start border-b border-border pb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mt-0.5 shrink-0">
                                    <BellRing className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Уведомление отправлено</p>
                                    <p className="text-xs text-muted-foreground">"Собрание 10-х классов" (120 получателей)</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start pb-1">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mt-0.5 shrink-0">
                                    <Settings className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Обновление модуля расписания</p>
                                    <p className="text-xs text-muted-foreground">ИИ-генератор готов к использованию</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
