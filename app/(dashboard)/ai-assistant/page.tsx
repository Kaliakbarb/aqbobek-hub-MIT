"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, BrainCircuit, LineChart, MessageSquare, AlertTriangle, Lightbulb, PlayCircle, FileText, ArrowRight, LoaderCircle, Trash2 } from "lucide-react";

type ChatMessage = {
    id: string;
    role: "assistant" | "user";
    text: string;
};

const STORAGE_KEY = "aqbobekhub_gemini_chat";

const quickPrompts = [
    "Сводка по физике",
    "Что повторить перед завтрашним днем?",
    "Как подтянуть алгебру за неделю?",
];

const initialMessage: ChatMessage = {
    id: "welcome",
    role: "assistant",
    text: "Здравствуйте! Я AI-Наставник AqbobekHub. Могу помочь с подготовкой к урокам, планом на неделю и разбором сложных тем.",
};

function normalizeText(text: string) {
    return text
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .replace(/^#{1,6}\s*/gm, "")
        .replace(/^\s*---+\s*$/gm, "")
        .replace(/^\s*\*\s+/gm, "- ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function renderFormattedText(text: string) {
    const lines = normalizeText(text).split("\n");
    const elements: React.ReactNode[] = [];
    let index = 0;

    while (index < lines.length) {
        const currentLine = lines[index].trim();

        if (!currentLine) {
            index += 1;
            continue;
        }

        if (/^\d+\./.test(currentLine)) {
            const items: string[] = [];
            while (index < lines.length && /^\d+\./.test(lines[index].trim())) {
                items.push(lines[index].trim().replace(/^\d+\.\s*/, ""));
                index += 1;
            }
            elements.push(
                <ol key={`ol-${index}`} className="list-decimal pl-5 space-y-2">
                    {items.map((item) => <li key={item}>{item}</li>)}
                </ol>,
            );
            continue;
        }

        if (/^[-•]/.test(currentLine)) {
            const items: string[] = [];
            while (index < lines.length && /^[-•]/.test(lines[index].trim())) {
                items.push(lines[index].trim().replace(/^[-•]\s*/, ""));
                index += 1;
            }
            elements.push(
                <ul key={`ul-${index}`} className="list-disc pl-5 space-y-2">
                    {items.map((item) => <li key={item}>{item}</li>)}
                </ul>,
            );
            continue;
        }

        if (/^день\s+\d+/i.test(currentLine) || /план/i.test(currentLine) && currentLine.length < 80) {
            elements.push(
                <p key={`title-${index}`} className="font-semibold text-foreground">
                    {currentLine}
                </p>,
            );
            index += 1;
            continue;
        }

        const paragraphLines: string[] = [];
        while (
            index < lines.length &&
            lines[index].trim() &&
            !/^\d+\./.test(lines[index].trim()) &&
            !/^[-•]/.test(lines[index].trim())
        ) {
            paragraphLines.push(lines[index].trim());
            index += 1;
        }

        elements.push(
            <p key={`p-${index}`} className="leading-7">
                {paragraphLines.join(" ")}
            </p>,
        );
    }

    return elements;
}

export default function AIAssistant() {
    const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hydrated, setHydrated] = useState(false);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as ChatMessage[];
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                }
            }
        } catch {
            // Ignore malformed local storage state and keep the default welcome message.
        } finally {
            setHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages, hydrated]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const messageCountLabel = useMemo(() => {
        const assistantMessages = messages.filter((message) => message.role === "assistant").length;
        return `Сохранено ответов наставника: ${assistantMessages}`;
    }, [messages]);

    const sendMessage = async (text: string) => {
        const message = text.trim();
        if (!message || loading) return;

        const nextMessages: ChatMessage[] = [...messages, { id: crypto.randomUUID(), role: "user", text: message }];
        setMessages(nextMessages);
        setInput("");
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/ai-assistant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message,
                    history: messages,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Не удалось получить ответ от Gemini.");
            }

            setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: normalizeText(data.text) }]);
        } catch (requestError) {
            const messageText = requestError instanceof Error ? requestError.message : "Ошибка при обращении к AI-Наставнику.";
            setError(messageText);
            setMessages((current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    text: "Сейчас не получилось получить ответ от Gemini. Проверьте ключ API и попробуйте еще раз.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeUp h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shadow-sm pb-4 border-b border-border">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-primary" /> AI-Наставник
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">Реальный чат на Gemini API для учебной поддержки и рекомендаций</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="font-sora font-bold text-foreground flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-muted-foreground" /> Быстрые сценарии
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative liquid-glass p-6 rounded-[2rem] border border-orange-200 overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <AlertTriangle className="w-24 h-24 text-orange-500" />
                            </div>
                            <div className="relative z-10 text-orange-600 mb-3 bg-orange-100 w-10 h-10 rounded-xl flex items-center justify-center">
                                <LineChart className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-foreground mb-2 text-lg">Подготовка к физике</h3>
                            <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-4">
                                Попросите наставника составить мини-план повторения, разобрать ошибки или объяснить сложную тему простыми словами.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => sendMessage("Сделай мне краткий план подготовки к СОЧ по физике на сегодня")} className="text-xs text-left bg-white border border-border p-3 rounded-xl shadow-sm hover:border-primary transition-colors flex items-center justify-between group-hover:bg-primary/5">
                                    <span className="font-semibold text-foreground">План на сегодня</span>
                                    <PlayCircle className="w-4 h-4 text-primary" />
                                </button>
                                <button onClick={() => sendMessage("Объясни тему электрического поля простыми словами для ученика 10 класса")} className="text-xs text-left bg-white border border-border p-3 rounded-xl shadow-sm hover:border-primary transition-colors flex items-center justify-between group-hover:bg-primary/5">
                                    <span className="font-semibold text-foreground">Объяснить тему</span>
                                    <FileText className="w-4 h-4 text-primary" />
                                </button>
                            </div>
                        </div>

                        <div className="relative liquid-glass p-6 rounded-[2rem] border border-green-200 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Lightbulb className="w-24 h-24 text-green-500" />
                            </div>
                            <div className="relative z-10 text-green-600 mb-3 bg-green-100 w-10 h-10 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-foreground mb-2 text-lg">Планирование и рост</h3>
                            <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-4">
                                Используйте чат для учебного плана, мотивации, расписания повторения и персональных рекомендаций.
                            </p>
                            <button onClick={() => sendMessage("Составь мне учебный план на 7 дней, чтобы подтянуть алгебру и физику")} className="text-xs text-left bg-white border border-border p-3 rounded-xl shadow-sm hover:border-primary transition-colors flex items-center justify-between w-full mt-auto">
                                <span className="font-semibold text-foreground">План на 7 дней</span>
                                <ArrowRight className="w-4 h-4 text-primary" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 liquid-glass rounded-[2rem] flex flex-col overflow-hidden h-full min-h-[500px]">
                    <div className="p-5 border-b border-border bg-white/50 backdrop-blur-md">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="font-sora font-bold flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-primary" /> Диалог с наставником
                                </h3>
                                <p className="mt-1 text-xs font-medium text-muted-foreground">{messageCountLabel}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setMessages([initialMessage]);
                                    setError("");
                                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([initialMessage]));
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                                <Trash2 className="w-4 h-4" />
                                Очистить
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto space-y-4">
                        {messages.map((message, index) => (
                            <div
                                key={message.id || `${message.role}-${index}`}
                                className={`p-4 text-sm leading-relaxed max-w-[88%] ${message.role === "assistant" ? "bg-primary/10 border border-primary/20 text-foreground rounded-b-xl rounded-tr-xl self-start" : "ml-auto bg-slate-950 text-white rounded-b-xl rounded-tl-xl"}`}
                            >
                                <div className="space-y-3">
                                    {renderFormattedText(message.text)}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="bg-primary/10 border border-primary/20 text-foreground p-4 rounded-b-xl rounded-tr-xl self-start w-[85%] text-sm leading-relaxed flex items-center gap-2">
                                <LoaderCircle className="w-4 h-4 animate-spin text-primary" />
                                Gemini думает над ответом...
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-border bg-white/50 backdrop-blur-md">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {quickPrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => sendMessage(prompt)}
                                    disabled={loading}
                                    className="text-xs bg-white border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                        {error && <p className="mb-3 text-xs font-medium text-red-600">{error}</p>}
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        void sendMessage(input);
                                    }
                                }}
                                placeholder="Например: как подготовиться к физике за 2 дня?"
                                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 pe-10"
                                disabled={loading}
                            />
                            <button
                                onClick={() => void sendMessage(input)}
                                disabled={loading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
