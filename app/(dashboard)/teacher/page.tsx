import React from "react";
import {
    Users, AlertOctagon, TrendingDown, CheckSquare,
    FileText, ArrowUpRight, Sparkles, UserX, Activity
} from "lucide-react";

export default function TeacherDashboard() {
    return (
        <div className="space-y-6 animate-fadeUp">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Кабинет учителя</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Физика, 10 \"А\" и 10 \"Б\" классы</p>
                </div>
                <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
                    <FileText className="w-4 h-4" />
                    Сгенерировать отчет
                </button>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-3">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Всего учеников</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">58</p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 mb-3">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Средний балл классов</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">4.2</p>
                </div>

                <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <AlertOctagon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">Внимание</span>
                    </div>
                    <h3 className="text-sm text-orange-900/60 font-medium mb-1">В зоне риска (СОЧ)</h3>
                    <p className="text-2xl font-sora font-bold text-orange-700">4 ученика</p>
                </div>

                <div className="liquid-glass p-5 rounded-3xl">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 mb-3">
                        <UserX className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm text-muted-foreground font-medium mb-1">Пропуски (неделя)</h3>
                    <p className="text-2xl font-sora font-bold text-foreground">12 чел/часов</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col */}
                <div className="lg:col-span-2 space-y-6">

                    {/* AI Class Report */}
                    <div className="bg-gradient-to-br from-[#f8f5ff] to-white border border-primary/20 p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none">
                            <Activity className="w-64 h-64 text-primary" />
                        </div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Сводка AI-Аналитика</h2>
                        </div>
                        <div className="relative z-10 bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50">
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                10 \"А\" демонстрирует отличное усвоение темы «Магнитное поле» (средний балл вырос на 12%). Однако в 10 \"Б\" замечено резкое падение вовлеченности — 5 учеников не сдали последние 2 домашних задания. Рекомендуется провести короткое тестирование перед следующим уроком и разобрать ошибки на примерах.
                            </p>
                            <div className="mt-4 flex gap-3">
                                <button className="text-xs font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
                                    Сгенерировать тест (10 мин)
                                </button>
                                <button className="text-xs font-semibold bg-white border border-border text-foreground px-4 py-2 rounded-xl hover:bg-black/5 transition-colors">
                                    Уведомить родителей 10 "Б"
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Students at Risk - Early Warning System */}
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-1">Система раннего предупреждения</h2>
                        <p className="text-sm text-muted-foreground mb-5">Студенты с высоким риском неуспеваемости по прогнозам ИИ</p>

                        <div className="space-y-4">
                            {[
                                { name: "Алихан Смаилов", class: "10 Б", drop: "-15%", reason: "Пропустил 3 урока, не сдал ЛР #4", risk: "Высокий" },
                                { name: "Амина Серикова", class: "10 А", drop: "-8%", reason: "Систематические ошибки в задачах на закон Фарадея", risk: "Средний" },
                                { name: "Руслан Ким", class: "10 Б", drop: "-12%", reason: "Резкое падение активности на уроке", risk: "Высокий" },
                            ].map((student, i) => (
                                <div key={i} className="bg-white/40 border border-border/60 p-4 rounded-2xl flex items-center justify-between hover:border-orange-300 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                                            {student.name[0]}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-foreground">{student.name}</h4>
                                                <span className="text-xs px-2 py-0.5 rounded border border-border bg-black/5 font-medium">{student.class}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${student.risk === 'Высокий' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {student.risk} РИСК
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{student.reason}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <span className="flex items-center gap-1 text-sm font-bold text-red-600">
                                            <TrendingDown className="w-4 h-4" /> {student.drop}
                                        </span>
                                        <button className="text-xs font-semibold text-primary hover:underline">Подробнее</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Col */}
                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Журнал и Задачи</h2>
                        <ul className="space-y-3">
                            <li className="p-3 bg-red-50 border border-red-100 rounded-xl cursor-pointer hover:bg-red-100/50 transition-colors">
                                <p className="text-sm font-semibold text-red-900 mb-1">Проверить СОЧ 10 "А"</p>
                                <p className="text-xs text-red-700">Остался 1 день до закрытия оценок</p>
                            </li>
                            <li className="p-3 bg-white/50 border border-border/50 rounded-xl cursor-pointer hover:border-primary/30 transition-colors">
                                <p className="text-sm font-semibold text-foreground mb-1">Загрузить конспект лекции</p>
                                <p className="text-xs text-muted-foreground">Тема: Электромагнитная индукция</p>
                            </li>
                            <li className="p-3 bg-white/50 border border-border/50 rounded-xl cursor-pointer hover:border-primary/30 transition-colors flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-foreground mb-1">Заполнить Кунделик</p>
                                    <p className="text-xs text-muted-foreground">За 14 Марта</p>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
