"use client";

import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "../logo.png";
import {
    Menu, X, Home, Users, BookOpen, Calendar,
    Settings, Bell, LogOut, Award, Sparkles, Newspaper, Monitor, Shield
} from "lucide-react";

const navItems = [
    { href: "/student", label: "Профиль ученика", icon: Home },
    { href: "/teacher", label: "Кабинет учителя", icon: BookOpen },
    { href: "/parent", label: "Кабинет родителя", icon: Users },
    { href: "/admin", label: "Администрация", icon: Shield },
    { href: "/admin/schedule", label: "Расписание", icon: Calendar },
    { href: "/news", label: "Новости", icon: Newspaper },
    { href: "/ai-assistant", label: "AI Наставник", icon: Sparkles },
    { href: "/leaderboard", label: "Достижения", icon: Award },
    { href: "/kiosk", label: "Режим киоска", icon: Monitor },
    { href: "/settings", label: "Настройки", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 h-full border-r border-border bg-card/50 backdrop-blur-xl">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm">
                            <Image src={logo} alt="AqbobekHub logo" className="h-full w-full object-cover" />
                        </div>
                        <span className="font-sora font-bold text-lg text-foreground tracking-tight">AqbobekHub</span>
                    </Link>
                </div>
                <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
                <div className="p-4 border-t border-border">
                    <Link href="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-black/5 hover:text-red-500 transition-colors text-sm font-medium">
                        <LogOut className="w-5 h-5" />
                        Выйти
                    </Link>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <aside
                        className="w-64 h-full bg-card border-r border-border flex flex-col animate-slideDown"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 flex justify-between items-center border-b border-border">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <Image src={logo} alt="AqbobekHub logo" className="h-full w-full object-cover" />
                                </div>
                                <span className="font-sora font-bold text-lg">AqbobekHub</span>
                            </Link>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-muted-foreground"><X className="w-5 h-5" /></button>
                        </div>
                        <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground"
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </aside>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-x-1 flex flex-col h-full w-full overflow-hidden">
                {/* Topbar */}
                <header className="h-16 lg:h-20 w-full flex items-center justify-between px-4 lg:px-8 border-b border-border bg-background/80 backdrop-blur-xl z-30 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden p-2 text-muted-foreground" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="hidden md:block font-sora font-semibold text-lg text-foreground">
                            {navItems.find(i => i.href === pathname)?.label || "Дашборд"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2.5 rounded-full bg-black/5 hover:bg-black/10 text-foreground transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-highlight animate-pulseDot"></span>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary-accent to-primary flex items-center justify-center text-white shadow-sm font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
                            U
                        </div>
                    </div>
                </header>

                {/* Page Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
