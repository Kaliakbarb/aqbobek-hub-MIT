"use client";

import React, { useState } from "react";
import { User, Bell, Shield, Palette, CheckCircle2 } from "lucide-react";

type TabKey = "profile" | "notifications" | "security" | "appearance";

export default function Settings() {
    const [tab, setTab] = useState<TabKey>("profile");
    const [firstName, setFirstName] = useState("Тимур");
    const [lastName, setLastName] = useState("Асанов");
    const [language, setLanguage] = useState("Русский");
    const [themeAuto, setThemeAuto] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [pushAlerts, setPushAlerts] = useState(true);
    const [status, setStatus] = useState("Настройки синхронизируются локально в демо-режиме.");

    const tabs = [
        { key: "profile" as const, label: "Профиль", icon: User },
        { key: "notifications" as const, label: "Уведомления", icon: Bell },
        { key: "security" as const, label: "Безопасность", icon: Shield },
        { key: "appearance" as const, label: "Внешний вид", icon: Palette },
    ];

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shadow-sm pb-4 border-b border-border">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Настройки</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Управление профилем и предпочтениями</p>
                </div>
                <button
                    onClick={() => setStatus(`Изменения сохранены: ${firstName} ${lastName}, язык ${language}.`)}
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm"
                >
                    <CheckCircle2 className="w-4 h-4" /> Сохранить изменения
                </button>
            </div>

            <div className="liquid-glass rounded-3xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-foreground">{status}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 space-y-2">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors text-left ${tab === key ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-black/5 hover:text-foreground font-medium"}`}
                        >
                            <Icon className="w-5 h-5" /> {label}
                        </button>
                    ))}
                </div>

                <div className="md:col-span-3 space-y-6">
                    {tab === "profile" && (
                        <div className="liquid-glass rounded-[2rem] p-8">
                            <h2 className="text-xl font-sora font-bold text-foreground mb-6">Личные данные</h2>
                            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary-accent text-white flex items-center justify-center font-sora font-bold text-2xl shadow-sm">
                                    {firstName[0]}
                                </div>
                                <div>
                                    <button onClick={() => setStatus("Загрузка фото будет доступна после подключения бэкенда профиля.")} className="bg-white border border-border px-4 py-2 rounded-xl text-sm font-semibold hover:border-primary/50 mb-2 block">Изменить фото</button>
                                    <p className="text-xs text-muted-foreground">Формат JPG, PNG. Макс 2 MB.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-foreground mb-2">Имя</label>
                                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-white/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium text-foreground" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-foreground mb-2">Фамилия</label>
                                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-white/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium text-foreground" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-bold text-foreground mb-2">Email</label>
                                    <input type="email" value="demo@aqbobek.kz" disabled className="w-full bg-black/5 border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed" />
                                    <p className="text-xs text-muted-foreground mt-2">Email привязан к школьной учетной записи. Для изменения обратитесь в администрацию.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "notifications" && (
                        <div className="liquid-glass rounded-[2rem] p-8">
                            <h2 className="text-xl font-sora font-bold text-foreground mb-6">Уведомления</h2>
                            <div className="space-y-4">
                                <button onClick={() => setEmailAlerts((v) => !v)} className="w-full flex items-center justify-between p-4 bg-white/40 rounded-xl border border-border text-left">
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground">Email-уведомления</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Получать сводки по оценкам и событиям</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${emailAlerts ? "bg-green-100 text-green-700" : "bg-black/5 text-muted-foreground"}`}>{emailAlerts ? "Вкл" : "Выкл"}</span>
                                </button>
                                <button onClick={() => setPushAlerts((v) => !v)} className="w-full flex items-center justify-between p-4 bg-white/40 rounded-xl border border-border text-left">
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground">Push-уведомления</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Срочные сообщения, дедлайны и напоминания</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${pushAlerts ? "bg-green-100 text-green-700" : "bg-black/5 text-muted-foreground"}`}>{pushAlerts ? "Вкл" : "Выкл"}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === "security" && (
                        <div className="liquid-glass rounded-[2rem] p-8">
                            <h2 className="text-xl font-sora font-bold text-foreground mb-6">Безопасность</h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/40 rounded-xl border border-border">
                                    <h4 className="font-bold text-sm text-foreground">Двухфакторная защита</h4>
                                    <p className="text-xs text-muted-foreground mt-1">В демо-версии включение имитируется на фронте.</p>
                                </div>
                                <button onClick={() => setStatus("Черновик сценария смены пароля открыт. Реальное изменение будет доступно после подключения бэкенда.")} className="bg-white border border-border px-4 py-2 rounded-xl text-sm font-semibold hover:border-primary/50">
                                    Сменить пароль
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === "appearance" && (
                        <div className="liquid-glass rounded-[2rem] p-8">
                            <h2 className="text-xl font-sora font-bold text-foreground mb-6">Предпочтения</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-border">
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground">Язык интерфейса</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Выберите основной язык портала</p>
                                    </div>
                                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-white border border-border rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none text-foreground">
                                        <option>Русский</option>
                                        <option>Қазақша</option>
                                        <option>English</option>
                                    </select>
                                </div>

                                <button onClick={() => setThemeAuto((v) => !v)} className="w-full flex items-center justify-between p-4 bg-white/40 rounded-xl border border-border text-left">
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground">Светлая/Темная тема</h4>
                                        <p className="text-xs text-muted-foreground mt-1">{themeAuto ? "Автоматически по системе" : "Светлая тема"}</p>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative ${themeAuto ? "bg-primary" : "bg-slate-300"}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${themeAuto ? "left-7" : "left-1"}`}></div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
