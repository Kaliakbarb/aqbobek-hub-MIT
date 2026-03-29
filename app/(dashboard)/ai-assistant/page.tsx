import React from "react";
import { Sparkles, BrainCircuit, LineChart, MessageSquare, AlertTriangle, Lightbulb, PlayCircle, FileText, ArrowRight } from "lucide-react";

export default function AIAssistant() {
    return (
        <div className="space-y-6 animate-fadeUp h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shadow-sm pb-4 border-b border-border">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-primary" /> AI-Наставник
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">Интеллектуальная система поддержки академических решений</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

                {/* Main Insights Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="font-sora font-bold text-foreground flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-muted-foreground" /> Глубокая аналитика (Профиль ученика)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Risk Insight */}
                        <div className="relative liquid-glass p-6 rounded-[2rem] border border-orange-200 overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <AlertTriangle className="w-24 h-24 text-orange-500" />
                            </div>
                            <div className="relative z-10 text-orange-600 mb-3 bg-orange-100 w-10 h-10 rounded-xl flex items-center justify-center">
                                <LineChart className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-foreground mb-2 text-lg">Прогноз: Физика</h3>
                            <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-4">
                                Вероятность снижения результата на предстоящем СОЧ: <span className="text-orange-600 font-bold">80%</span>. Система выявила паттерн ошибок в теме <span className="font-bold text-foreground">«Электрическое поле»</span> в последних 3-х тестах.
                            </p>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Вмешательство:</h4>
                            <div className="flex flex-col gap-2">
                                <button className="text-xs text-left bg-white border border-border p-3 rounded-xl shadow-sm hover:border-primary transition-colors flex items-center justify-between group-hover:bg-primary/5">
                                    <span className="font-semibold text-foreground">Повторить лекцию (15 мин)</span>
                                    <PlayCircle className="w-4 h-4 text-primary" />
                                </button>
                                <button className="text-xs text-left bg-white border border-border p-3 rounded-xl shadow-sm hover:border-primary transition-colors flex items-center justify-between group-hover:bg-primary/5">
                                    <span className="font-semibold text-foreground">Пройти адаптивный мини-тест</span>
                                    <FileText className="w-4 h-4 text-primary" />
                                </button>
                            </div>
                        </div>

                        {/* Positive Trend Insight */}
                        <div className="relative liquid-glass p-6 rounded-[2rem] border border-green-200 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Lightbulb className="w-24 h-24 text-green-500" />
                            </div>
                            <div className="relative z-10 text-green-600 mb-3 bg-green-100 w-10 h-10 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-foreground mb-2 text-lg">Сильная сторона: Алгебра</h3>
                            <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-4">
                                Вы демонстрируете скорость решения логарифмических уравнений на <span className="text-green-600 font-bold">40% выше среднего по классу</span>. Рекомендуется участие в турнире Кеңгуру.
                            </p>
                            <button className="text-xs text-left bg-white border border-border p-3 rounded-xl shadow-sm hover:border-primary transition-colors flex items-center justify-between w-full mt-auto">
                                <span className="font-semibold text-foreground">Регистрация на турнир</span>
                                <ArrowRight className="w-4 h-4 text-primary" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chat / Assistant Helper */}
                <div className="lg:col-span-1 liquid-glass rounded-[2rem] flex flex-col overflow-hidden h-full min-h-[500px]">
                    <div className="p-5 border-b border-border bg-white/50 backdrop-blur-md">
                        <h3 className="font-sora font-bold flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" /> Диалог с นаставником
                        </h3>
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto space-y-4">
                        <div className="bg-primary/10 border border-primary/20 text-foreground p-4 rounded-b-xl rounded-tr-xl self-start w-[85%] text-sm leading-relaxed">
                            Здравствуйте! Я проанализировал вашу успеваемость за неделю. Хотите узнать, какие темы повторить перед завтрашним днем?
                        </div>
                    </div>

                    <div className="p-4 border-t border-border bg-white/50 backdrop-blur-md">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-xs bg-white border border-border px-3 py-1.5 rounded-full text-muted-foreground cursor-pointer hover:text-primary transition-colors">Сводка по физике</span>
                            <span className="text-xs bg-white border border-border px-3 py-1.5 rounded-full text-muted-foreground cursor-pointer hover:text-primary transition-colors">Что задали по истории?</span>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Задайте вопрос ИИ-Наставнику..."
                                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 pe-10"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
