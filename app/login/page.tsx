import React from "react";
import Link from "next/link";
import { GraduationCap, BookOpen, Users, Shield, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const roles = [
        { id: "student", label: "Ученик", icon: GraduationCap, href: "/student", color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: "teacher", label: "Учитель", icon: BookOpen, href: "/teacher", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { id: "parent", label: "Родитель", icon: Users, href: "/parent", color: "text-amber-500", bg: "bg-amber-500/10" },
        { id: "admin", label: "Администрация", icon: Shield, href: "/admin", color: "text-violet-500", bg: "bg-violet-500/10" },
    ];

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-secondary-accent/20 blur-[150px]" />
            </div>

            <div className="liquid-glass-strong rounded-3xl w-full max-w-[1000px] min-h-[600px] flex flex-col md:flex-row shadow-2xl z-10 overflow-hidden">

                {/* Left Side (Branding & Info) */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-primary to-[#4f3c88] p-10 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-8 border border-white/30">
                            <span className="font-sora font-bold text-xl tracking-tight">AH</span>
                        </div>
                        <h1 className="font-sora text-4xl sm:text-5xl font-bold leading-[1.1] mb-6 shadow-sm">
                            Добро пожаловать в AqbobekHub
                        </h1>
                        <p className="text-white/80 text-lg leading-relaxed max-w-sm font-medium">
                            Единая экосистема для вашей школы. Выберите свою роль для входа в портал.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12 md:mt-0">
                        <div className="flex -space-x-3 mb-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#5b469e] bg-white/10 backdrop-blur-sm flex items-center justify-center text-xs font-bold shrink-0">
                                    {i}
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-[#5b469e] bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs font-bold pl-1">+</div>
                        </div>
                        <p className="text-sm font-medium text-white/70">Более 2000 пользователей уже с нами</p>
                    </div>
                </div>

                {/* Right Side (Auth Forms / Quick Login) */}
                <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-card/80 backdrop-blur-xl">
                    <div className="max-w-md w-full mx-auto">
                        <h2 className="font-sora text-2xl font-bold text-foreground mb-2">Вход в систему</h2>
                        <p className="text-muted-foreground mb-8">Используйте демо-доступ для быстрого входа в MVP платформы.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                                <input
                                    type="email"
                                    placeholder="demo@aqbobek.kz"
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Пароль</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                    disabled
                                />
                            </div>
                            <button className="w-full bg-primary text-white rounded-xl py-3.5 font-semibold shadow-[0_4px_16px_rgba(157,118,220,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2 opacity-50 cursor-not-allowed">
                                Войти по Email <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                            <div className="relative flex justify-center text-sm"><span className="px-4 bg-transparent text-muted-foreground font-medium">ИЛИ БЫСТРЫЙ ВХОД (DEMO)</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                return (
                                    <Link
                                        key={role.id}
                                        href={role.href}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-white hover:border-primary/50 hover:shadow-lg transition-all group"
                                    >
                                        <div className={`w-12 h-12 rounded-full ${role.bg} ${role.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className="font-semibold text-foreground">{role.label}</span>
                                    </Link>
                                )
                            })}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
