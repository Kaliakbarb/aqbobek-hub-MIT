import Image from "next/image";
import Link from "next/link";
import logo from "../../logo.png";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    GraduationCap,
    Shield,
    Sparkles,
    Users,
} from "lucide-react";

const roles = [
    { id: "student", label: "Ученик", icon: GraduationCap, href: "/student", accent: "bg-sky-500/10 text-sky-700" },
    { id: "teacher", label: "Учитель", icon: BookOpen, href: "/teacher", accent: "bg-emerald-500/10 text-emerald-700" },
    { id: "parent", label: "Родитель", icon: Users, href: "/parent", accent: "bg-amber-500/15 text-amber-700" },
    { id: "admin", label: "Администрация", icon: Shield, href: "/admin", accent: "bg-slate-900/10 text-slate-800" },
];

export default function LoginPage() {
    return (
        <div className="ambient-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
            <div className="absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute bottom-[-12%] right-[-5%] h-80 w-80 rounded-full bg-amber-300/18 blur-3xl" />

            <div className="liquid-glass-strong grid w-full max-w-6xl overflow-hidden rounded-[36px] lg:grid-cols-[0.95fr_1.05fr]">
                <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 text-white sm:p-10 lg:p-12">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.22),transparent_30%)]" />

                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                            <Link href="/" className="inline-flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/12 backdrop-blur-xl">
                                    <Image src={logo} alt="AqbobekHub logo" className="h-full w-full object-cover" priority />
                                </div>
                                <div>
                                    <p className="font-sora text-xl font-bold tracking-tight">AqbobekHub</p>
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Unified School OS</p>
                                </div>
                            </Link>

                            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
                                <Sparkles className="h-4 w-4" />
                                Demo Access
                            </div>

                            <h1 className="mt-6 max-w-xl text-balance font-sora text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
                                Вход в школу, которая выглядит уверенно и работает как единая система.
                            </h1>
                            <p className="mt-6 max-w-lg text-base leading-8 text-white/70">
                                Обновленный вход отражает весь характер продукта: спокойная визуальная система, четкий выбор роли и быстрый доступ к основным сценариям платформы.
                            </p>
                        </div>

                        <div className="mt-10 space-y-4">
                            {[
                                "Четкое разделение ролей без лишних кликов",
                                "Единая визуальная логика между лендингом и кабинетом",
                                "Демо-вход готов для презентаций и питчинга",
                            ].map((item) => (
                                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-cyan-300" />
                                    <p className="text-sm leading-7 text-white/80">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-white/80 p-8 sm:p-10 lg:p-12">
                    <div className="mx-auto max-w-xl">
                        <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">Вход в систему</p>
                        <h2 className="mt-4 font-sora text-3xl font-bold tracking-tight text-foreground">
                            Выберите быстрый путь в демо-платформу
                        </h2>
                        <p className="mt-4 text-base leading-7 text-muted-foreground">
                            Ниже сохранен демо-сценарий для MVP. Можно войти от лица ученика, учителя, родителя или администрации и сразу оценить обновленный интерфейс.
                        </p>

                        <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50/90 p-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-foreground">Email</label>
                                    <input
                                        type="email"
                                        placeholder="demo@aqbobek.kz"
                                        disabled
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-muted-foreground outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-foreground">Пароль</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        disabled
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-muted-foreground outline-none"
                                    />
                                </div>
                            </div>

                            <Link href="/student" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white hover:bg-slate-800">
                                Быстрый demo-вход
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="my-8 flex items-center gap-3">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground">Быстрый вход</span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {roles.map((role) => {
                                const Icon = role.icon;

                                return (
                                    <Link
                                        key={role.id}
                                        href={role.href}
                                        className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_22px_50px_rgba(15,23,42,0.10)]"
                                    >
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${role.accent}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="mt-5 text-lg font-bold text-foreground">{role.label}</h3>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Открыть персонализированный сценарий и посмотреть демо-интерфейс роли.
                                        </p>
                                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                                            Войти как {role.label.toLowerCase()}
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
