"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import logo from "../logo.png";
import type { AppRole } from "../lib/demo-auth";
import {
    Menu, X, Home, BookOpen, Calendar,
    Settings, Bell, LogOut, Award, Sparkles, Newspaper, Monitor, Shield
} from "lucide-react";

type SessionPayload = {
    userId: string;
    username: string;
    role: AppRole;
    fullName: string;
    homePath: string;
};

const navItems: Array<{
    href: string;
    label: string;
    icon: typeof Home;
    roles: AppRole[];
}> = [
    { href: "/student", label: "Профиль ученика", icon: Home, roles: ["student"] },
    { href: "/teacher", label: "Кабинет учителя", icon: BookOpen, roles: ["teacher"] },
    { href: "/parent", label: "Кабинет родителя", icon: Home, roles: ["parent"] },
    { href: "/admin", label: "Администрация", icon: Shield, roles: ["admin"] },
    { href: "/admin/schedule", label: "Расписание", icon: Calendar, roles: ["admin"] },
    { href: "/news", label: "Новости", icon: Newspaper, roles: ["student", "teacher", "admin"] },
    { href: "/ai-assistant", label: "AI Наставник", icon: Sparkles, roles: ["student", "teacher", "admin"] },
    { href: "/leaderboard", label: "Достижения", icon: Award, roles: ["student", "teacher", "admin"] },
    { href: "/kiosk", label: "Режим киоска", icon: Monitor, roles: ["admin"] },
    { href: "/settings", label: "Настройки", icon: Settings, roles: ["student", "teacher", "admin"] },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [session, setSession] = useState<SessionPayload | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const loadSession = async () => {
            try {
                const response = await fetch("/api/auth/session");
                const data = await response.json();
                setSession(data.session ?? null);
            } catch {
                setSession(null);
            }
        };

        void loadSession();
    }, []);

    const visibleNavItems = useMemo(() => {
        if (!session) return [];
        return navItems.filter((item) => item.roles.includes(session.role));
    }, [session]);

    const activeLabel = visibleNavItems.find((item) => pathname === item.href)?.label || "Дашборд";

    const logout = async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
            <aside className="hidden md:flex flex-col w-64 h-full border-r border-border bg-card/50 backdrop-blur-xl">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm">
                            <Image src={logo} alt="AqbobekHub logo" className="h-full w-full object-cover" />
                        </div>
                        <div>
                            <span className="block font-sora font-bold text-lg text-foreground tracking-tight">AqbobekHub</span>
                            {session && <span className="text-xs font-medium text-muted-foreground">{session.username}</span>}
                        </div>
                    </Link>
                </div>
                <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
                    {visibleNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-black/5 hover:text-foreground"}`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-border">
                    <button onClick={() => void logout()} disabled={loggingOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-black/5 hover:text-red-500 transition-colors text-sm font-medium disabled:opacity-50">
                        <LogOut className="w-5 h-5" />
                        {loggingOut ? "Выходим..." : "Выйти"}
                    </button>
                </div>
            </aside>

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
                                <div>
                                    <span className="font-sora font-bold text-lg">AqbobekHub</span>
                                    {session && <p className="text-xs text-muted-foreground">{session.username}</p>}
                                </div>
                            </Link>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-muted-foreground"><X className="w-5 h-5" /></button>
                        </div>
                        <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
                            {visibleNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>
                </div>
            )}

            <main className="flex-x-1 flex flex-col h-full w-full overflow-hidden">
                <header className="h-16 lg:h-20 w-full flex items-center justify-between px-4 lg:px-8 border-b border-border bg-background/80 backdrop-blur-xl z-30 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden p-2 text-muted-foreground" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="hidden md:block font-sora font-semibold text-lg text-foreground">{activeLabel}</h2>
                            {session && <p className="hidden md:block text-xs text-muted-foreground mt-0.5">{session.fullName}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2.5 rounded-full bg-black/5 hover:bg-black/10 text-foreground transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-highlight animate-pulseDot"></span>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary-accent to-primary flex items-center justify-center text-white shadow-sm font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
                            {session?.username?.slice(0, 1).toUpperCase() || "U"}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
