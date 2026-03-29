"use client";

import { ChevronDown, ChevronRight, ArrowRight, Play, GraduationCap, School, BookOpen, Users } from "lucide-react";
import React from "react";
import Link from "next/link";

export default function Home() {
    const socialBrands = [
        "BilimClass",
        "Kundelik",
        "Google Classroom",
        "Microsoft Teams",
        "Moodle",
        "Canvas",
    ];

    return (
        <div className="relative min-h-screen text-foreground overflow-x-hidden">
            {/* 1. Фоновый слой с видео */}
            <div className="absolute inset-0 w-full h-full -z-10 bg-background">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260309_042944_4a2205b7-b061-490a-852b-92d9e9955ce9.mp4" type="video/mp4" />
                </video>
                {/* Overlay для читаемости текста */}
                <div className="absolute inset-0 bg-white/55 backdrop-blur-[2px]"></div>
                {/* Gradient Layer */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_60%)]"></div>
            </div>

            {/* 2. Navbar */}
            <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[860px] z-50 animate-slideDown">
                <div className="liquid-glass-strong rounded-3xl pl-4 pr-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center text-white shadow-sm">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-foreground">AqbobekHub</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-7">
                        <button className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors group">
                            Возможности
                            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </button>
                        <button className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">Для школ</button>
                        <button className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">Тарифы</button>
                        <button className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">О нас</button>
                    </nav>

                    <Link href="/login" className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold shadow-[0_4px_16px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)] hover:-translate-y-0.5 transition-all">
                        Войти
                    </Link>
                </div>
            </header>

            {/* 3. Hero Content */}
            <main className="relative z-10 w-full pt-[140px] flex flex-col items-center text-center px-4 pb-24">

                {/* Heading */}
                <h1
                    className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] max-w-5xl animate-fadeUp text-hero-heading"
                    style={{ animationDelay: "350ms" }}
                >
                    Единая <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-emerald-700">экосистема</span>
                    <br className="hidden sm:block" /> для вашей школы
                </h1>

                {/* Subheading */}
                <p
                    className="mt-6 text-lg max-w-lg mx-auto text-[var(--color-hero-sub)] leading-relaxed animate-fadeUp"
                    style={{ animationDelay: "500ms" }}
                >
                    Оценки, достижения, аналитика и AI-наставник — всё в одном портале для учеников, учителей и родителей.
                </p>

                {/* CTA Buttons */}
                <div
                    className="flex flex-col sm:flex-row items-center gap-3 mt-8 animate-fadeUp"
                    style={{ animationDelay: "650ms" }}
                >
                    <Link href="/login" className="w-full sm:w-auto bg-primary text-primary-foreground rounded-full px-7 py-3.5 text-base font-semibold shadow-[0_4px_16px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group">
                        Начать бесплатно
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button className="w-full sm:w-auto liquid-glass text-foreground rounded-full px-7 py-3.5 text-base font-medium hover:bg-white/60 transition-colors flex items-center justify-center gap-2">
                        <Play className="w-5 h-5 fill-foreground/10" />
                        Узнать больше
                    </button>
                </div>

                {/* 4. Role Cards */}
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-[1100px] w-full animate-fadeUp"
                    style={{ animationDelay: "800ms" }}
                >
                    {/* Card 1: Ученик */}
                    <div className="liquid-glass rounded-2xl p-7 text-left hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "rgba(34,197,94,0.12)" }}>
                            <GraduationCap className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-base font-bold mb-2">Ученик</h3>
                        <p className="text-sm text-foreground/70 leading-snug">
                            Оценки, рейтинг, цели и персональные рекомендации от AI
                        </p>
                    </div>

                    {/* Card 2: Учитель */}
                    <div className="liquid-glass rounded-2xl p-7 text-left hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "rgba(59,130,246,0.12)" }}>
                            <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-base font-bold mb-2">Учитель</h3>
                        <p className="text-sm text-foreground/70 leading-snug">
                            Ученики в зоне риска, достижения и быстрая аналитика класса
                        </p>
                    </div>

                    {/* Card 3: Родитель */}
                    <div className="liquid-glass rounded-2xl p-7 text-left hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "rgba(245,158,11,0.12)" }}>
                            <Users className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="text-base font-bold mb-2">Родитель</h3>
                        <p className="text-sm text-foreground/70 leading-snug">
                            Динамика успеваемости ребёнка и уведомления в реальном времени
                        </p>
                    </div>

                    {/* Card 4: Администрация */}
                    <div className="liquid-glass rounded-2xl p-7 text-left hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "rgba(139,92,246,0.12)" }}>
                            <School className="w-6 h-6 text-violet-600" />
                        </div>
                        <h3 className="text-base font-bold mb-2">Администрация</h3>
                        <p className="text-sm text-foreground/70 leading-snug">
                            Новости школы, общая аналитика и управление событиями
                        </p>
                    </div>
                </div>

                {/* 5. Social Proof Marquee */}
                <div
                    className="mt-24 w-full max-w-[1200px] pt-8 animate-fadeUp flex flex-col items-center overflow-hidden"
                    style={{ animationDelay: "950ms" }}
                >
                    <span className="text-xs uppercase tracking-widest text-foreground/50 font-semibold mb-8">
                        Интегрируется с платформами
                    </span>
                    <div
                        className="w-full relative"
                        style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
                    >
                        <div className="flex w-max animate-marquee items-center gap-4">
                            {/* Дублируем массив для бесшовного скролла */}
                            {[...socialBrands, ...socialBrands, ...socialBrands, ...socialBrands].map((brand, idx) => (
                                <div
                                    key={idx}
                                    className="liquid-glass rounded-xl py-2.5 pr-5 pl-3 flex items-center gap-3"
                                >
                                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/5">
                                        <span className="font-bold text-base text-foreground/60">{brand[0]}</span>
                                    </div>
                                    <span className="text-sm font-semibold whitespace-nowrap">{brand}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
