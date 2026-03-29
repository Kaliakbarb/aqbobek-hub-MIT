import Image from "next/image";
import Link from "next/link";
import logo from "../logo.png";
import {
    ArrowRight,
    BarChart3,
    BellRing,
    BookOpen,
    BrainCircuit,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    GraduationCap,
    PlayCircle,
    School,
    ShieldCheck,
    Sparkles,
    Trophy,
    Users,
} from "lucide-react";

const metrics = [
    { value: "12+", label: "ключевых сценариев школы в одной системе" },
    { value: "4", label: "роли с персонализированным интерфейсом" },
    { value: "24/7", label: "доступ к аналитике, событиям и AI-помощнику" },
];

const productPillars = [
    {
        icon: BrainCircuit,
        title: "AI-аналитика вместо ручной рутины",
        description: "Сигналы по рискам, учебная динамика, рекомендации по следующим шагам и приоритетам класса.",
    },
    {
        icon: BellRing,
        title: "Коммуникация в одном окне",
        description: "Оповещения, новости, события и важные напоминания собираются в один понятный школьный поток.",
    },
    {
        icon: ShieldCheck,
        title: "Один источник правды для школы",
        description: "Оценки, расписание, посещаемость и достижения синхронизированы между учеником, учителем и родителем.",
    },
];

const schoolVideo = {
    title: "Aqbobek International School",
    subtitle: "Opening the doors to the future of education",
    embedUrl: "https://www.youtube-nocookie.com/embed/PHp3uG4e2AM?autoplay=1&mute=1&loop=1&playlist=PHp3uG4e2AM&controls=0&modestbranding=1&rel=0",
};

const roleCards = [
    {
        icon: GraduationCap,
        title: "Ученик",
        description: "Личный прогресс, цели, рейтинг и понятные рекомендации, что улучшить уже сегодня.",
        accent: "from-sky-500/20 to-cyan-500/10",
    },
    {
        icon: BookOpen,
        title: "Учитель",
        description: "Быстрая картина по классу, зона риска и подготовка к решениям без перегрузки таблицами.",
        accent: "from-emerald-500/20 to-teal-500/10",
    },
    {
        icon: Users,
        title: "Родитель",
        description: "Успеваемость, уведомления и школьные события в спокойном, прозрачном формате.",
        accent: "from-amber-500/20 to-orange-500/10",
    },
    {
        icon: School,
        title: "Администрация",
        description: "Панорама школы: расписание, новости, нагрузка, вовлеченность и контроль исполнения.",
        accent: "from-slate-700/15 to-sky-600/10",
    },
];

const workflow = [
    {
        step: "01",
        title: "Собирает сигналы",
        description: "Оценки, события, домашние задания, достижения и посещаемость стекаются в единую картину.",
    },
    {
        step: "02",
        title: "Подсвечивает важное",
        description: "Система показывает, где нужен фокус: ученику, учителю, родителю или администрации.",
    },
    {
        step: "03",
        title: "Помогает действовать",
        description: "Следующие шаги, рекомендации и сценарии работы уже готовы внутри интерфейса.",
    },
];

const integrations = [
    "BilimClass",
    "Kundelik",
    "Google Classroom",
    "Microsoft Teams",
    "Moodle",
    "Canvas",
];

export default function Home() {
    return (
        <div className="ambient-page min-h-screen overflow-x-hidden text-foreground">
            <header className="fixed inset-x-0 top-4 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-6xl animate-slideDown">
                <div className="liquid-glass-strong flex items-center justify-between rounded-[28px] px-4 py-3 sm:px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white soft-shadow">
                            <Image src={logo} alt="AqbobekHub logo" className="h-full w-full object-cover" priority />
                        </div>
                        <div>
                            <p className="font-sora text-base font-bold tracking-tight text-foreground">AqbobekHub</p>
                            <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">School OS</p>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-7 lg:flex">
                        <a href="#capabilities" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Возможности</a>
                        <a href="#roles" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Для ролей</a>
                        <a href="#workflow" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Как это работает</a>
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-slate-950/5 sm:inline-flex">
                            Demo Login
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_rgba(8,145,178,0.28)] hover:-translate-y-0.5 hover:bg-cyan-700"
                        >
                            Открыть платформу
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-24 pt-32 sm:px-6 lg:px-8">
                <section className="grid items-center gap-12 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24">
                    <div className="max-w-3xl">
                        <div className="eyebrow animate-fadeUp">
                            <Sparkles className="h-4 w-4" />
                            Новое поколение школьного интерфейса
                        </div>

                        <h1
                            className="mt-7 max-w-4xl text-balance text-5xl font-bold leading-[0.98] tracking-tight text-hero-heading sm:text-6xl lg:text-7xl animate-fadeUp"
                            style={{ animationDelay: "120ms" }}
                        >
                            Профессиональная цифровая
                            <span className="block bg-gradient-to-r from-slate-950 via-cyan-800 to-teal-600 bg-clip-text text-transparent">
                                операционная система для школы
                            </span>
                        </h1>

                        <p
                            className="mt-7 max-w-2xl text-balance text-lg leading-8 text-hero-sub animate-fadeUp sm:text-xl"
                            style={{ animationDelay: "220ms" }}
                        >
                            AqbobekHub объединяет обучение, аналитику, коммуникацию и AI-помощника в единую среду, которая выглядит современно и помогает школе действовать быстрее.
                        </p>

                        <div
                            className="mt-9 flex flex-col gap-3 sm:flex-row animate-fadeUp"
                            style={{ animationDelay: "320ms" }}
                        >
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-[0_20px_50px_rgba(8,145,178,0.28)] hover:-translate-y-0.5 hover:bg-cyan-700"
                            >
                                Перейти в демо
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <a
                                href="#capabilities"
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-7 py-3.5 text-base font-semibold text-foreground hover:border-cyan-200 hover:bg-white"
                            >
                                <PlayCircle className="h-5 w-5 text-primary" />
                                Посмотреть возможности
                            </a>
                        </div>

                        <div
                            className="mt-10 grid gap-4 sm:grid-cols-3 animate-fadeUp"
                            style={{ animationDelay: "420ms" }}
                        >
                            {metrics.map((metric) => (
                                <div key={metric.label} className="rounded-3xl border border-white/70 bg-white/70 p-5 backdrop-blur-xl soft-shadow">
                                    <p className="font-sora text-3xl font-bold tracking-tight text-foreground">{metric.value}</p>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{metric.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative animate-fadeUp" style={{ animationDelay: "250ms" }}>
                        <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
                        <div className="absolute -right-4 bottom-8 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />

                        <div className="liquid-glass-strong bg-mesh rounded-[36px] p-5 sm:p-7">
                            <div className="flex items-center justify-between rounded-[28px] border border-white/70 bg-slate-950 px-5 py-4 text-white">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Live Overview</p>
                                    <h2 className="mt-2 font-sora text-2xl font-bold">Единый центр управления школой</h2>
                                </div>
                                <div className="rounded-2xl bg-white/10 p-3">
                                    <BarChart3 className="h-7 w-7 text-cyan-300" />
                                </div>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <div className="rounded-[28px] border border-slate-200/70 bg-white/80 p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Риски и внимание</p>
                                            <p className="mt-2 font-sora text-4xl font-bold tracking-tight text-foreground">7</p>
                                        </div>
                                        <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                                            <BellRing className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                        AI сразу показывает, где нужен фокус сегодня: физика, пропуски и родительские уведомления.
                                    </p>
                                </div>

                                <div className="rounded-[28px] border border-cyan-100 bg-cyan-50/90 p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-cyan-900/70">Вовлеченность</p>
                                            <p className="mt-2 font-sora text-4xl font-bold tracking-tight text-slate-950">94%</p>
                                        </div>
                                        <div className="rounded-2xl bg-white p-3 text-primary soft-shadow">
                                            <Trophy className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-cyan-950/70">
                                        Единый интерфейс помогает держать темп и делает коммуникацию между ролями заметно проще.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-[28px] border border-white/70 bg-white/80 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground">Операционный поток школы</p>
                                        <p className="mt-1 font-sora text-2xl font-bold tracking-tight text-foreground">От сигнала к действию за один экран</p>
                                    </div>
                                    <div className="hidden rounded-2xl bg-slate-950 p-3 text-white md:block">
                                        <BrainCircuit className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {[
                                        { icon: CalendarDays, label: "Расписание обновлено", note: "Секции и кабинеты синхронизированы" },
                                        { icon: BookOpen, label: "Оценки и ДЗ собраны", note: "Учителям не нужно переключаться между сервисами" },
                                        { icon: ShieldCheck, label: "Администрация видит общую картину", note: "Новости, риски и контроль исполнения в одном месте" },
                                    ].map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <div key={item.label} className="flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                                                <div className="rounded-xl bg-white p-2.5 text-primary soft-shadow">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                                    <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="pb-16 lg:pb-24">
                    <div className="section-shell px-6 py-6 sm:px-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Совместимость</p>
                                <p className="mt-2 max-w-2xl text-lg text-foreground">
                                    Подключается к привычным платформам и собирает школьный контур в один более сильный интерфейс.
                                </p>
                            </div>
                            <div
                                className="overflow-hidden"
                                style={{ maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)" }}
                            >
                                <div className="animate-marquee flex w-max gap-3">
                                    {[...integrations, ...integrations, ...integrations].map((brand, index) => (
                                        <div key={`${brand}-${index}`} className="flex items-center gap-3 rounded-full border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                                                {brand[0]}
                                            </div>
                                            <span className="whitespace-nowrap text-sm font-semibold text-foreground">{brand}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="pb-16 lg:pb-24">
                    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                        <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
                            <div className="eyebrow border-white/10 bg-white/10 text-cyan-200 shadow-none">
                                <PlayCircle className="h-4 w-4" />
                                Атмосфера школы
                            </div>
                            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                                Видео о школе
                            </h2>
                            <p className="mt-5 text-base leading-8 text-white/72">
                                Познакомьтесь с атмосферой Aqbobek International School и тем подходом к образованию, который стоит за платформой AqbobekHub.
                            </p>

                            <div className="mt-8 space-y-4">
                                {[
                                    "Современная среда, в которой технологии и образование работают вместе.",
                                    "Школа, где важны развитие, дисциплина и сильная академическая база.",
                                    "Платформа, созданная как цифровое продолжение этой экосистемы.",
                                ].map((point) => (
                                    <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-cyan-300" />
                                        <p className="text-sm leading-7 text-white/80">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="liquid-glass-strong rounded-[32px] p-4 sm:p-5">
                            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">Featured Video</p>
                                        <h3 className="mt-1 font-sora text-xl font-bold">{schoolVideo.title}</h3>
                                        <p className="mt-1 text-sm text-white/65">{schoolVideo.subtitle}</p>
                                    </div>
                                    <div className="rounded-2xl bg-white/10 p-3">
                                        <PlayCircle className="h-5 w-5 text-cyan-300" />
                                    </div>
                                </div>

                                <div className="relative aspect-video w-full">
                                    <iframe
                                        className="absolute inset-0 h-full w-full"
                                        src={schoolVideo.embedUrl}
                                        title={schoolVideo.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="capabilities" className="pb-16 lg:pb-24">
                    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="eyebrow">
                                <Building2 className="h-4 w-4" />
                                Что делает платформу сильной
                            </div>
                            <h2 className="mt-5 max-w-3xl text-balance text-3xl font-bold tracking-tight text-hero-heading sm:text-4xl">
                                Дизайн не просто красивый. Он помогает школе быстрее понимать, решать и координироваться.
                            </h2>
                        </div>
                        <p className="max-w-xl text-base leading-7 text-muted-foreground">
                            Мы сделали интерфейс спокойнее, чище и взрослее, чтобы продукт выглядел надежно и при этом ощущался легким в ежедневной работе.
                        </p>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3">
                        {productPillars.map((pillar, index) => {
                            const Icon = pillar.icon;

                            return (
                                <article
                                    key={pillar.title}
                                    className="section-shell p-7 animate-fadeUp"
                                    style={{ animationDelay: `${index * 120}ms` }}
                                >
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white soft-shadow">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mt-6 text-2xl font-bold tracking-tight text-foreground">{pillar.title}</h3>
                                    <p className="mt-4 text-base leading-7 text-muted-foreground">{pillar.description}</p>
                                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                                        Подробнее
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section id="roles" className="pb-16 lg:pb-24">
                    <div className="section-shell overflow-hidden p-6 sm:p-8">
                        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                            <div>
                                <div className="eyebrow">
                                    <Users className="h-4 w-4" />
                                    Для всех ролей школы
                                </div>
                                <h2 className="mt-5 max-w-xl text-balance text-3xl font-bold tracking-tight text-hero-heading sm:text-4xl">
                                    Каждый участник видит свой лучший рабочий стол, а не перегруженный универсальный экран.
                                </h2>
                                <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
                                    Ученик видит прогресс и цели. Учитель получает приоритеты. Родитель получает прозрачность. Администрация получает контроль и обзор.
                                </p>

                                <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white">
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Product Principle</p>
                                    <p className="mt-3 text-xl font-semibold leading-8 text-white/90">
                                        Один бренд, одна система, четыре четко настроенных пользовательских сценария.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {roleCards.map((role) => {
                                    const Icon = role.icon;

                                    return (
                                        <article key={role.title} className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                                            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${role.accent}`}>
                                                <Icon className="h-6 w-6 text-slate-900" />
                                            </div>
                                            <h3 className="mt-5 text-xl font-bold text-foreground">{role.title}</h3>
                                            <p className="mt-3 text-sm leading-7 text-muted-foreground">{role.description}</p>
                                            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
                                                Персональный сценарий
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="workflow" className="pb-16 lg:pb-24">
                    <div className="mb-8">
                        <div className="eyebrow">
                            <CheckCircle2 className="h-4 w-4" />
                            Как работает продукт
                        </div>
                        <h2 className="mt-5 max-w-3xl text-balance text-3xl font-bold tracking-tight text-hero-heading sm:text-4xl">
                            Простая логика интерфейса: собрать данные, показать важное, помочь сделать следующий шаг.
                        </h2>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="grid gap-5 md:grid-cols-3">
                            {workflow.map((item) => (
                                <article key={item.step} className="section-shell p-6">
                                    <p className="text-sm font-bold tracking-[0.28em] text-primary">{item.step}</p>
                                    <h3 className="mt-5 text-2xl font-bold text-foreground">{item.title}</h3>
                                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.description}</p>
                                </article>
                            ))}
                        </div>

                        <aside className="rounded-[32px] border border-slate-200 bg-slate-950 p-7 text-white soft-shadow">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Почему это выглядит сильнее</p>
                            <p className="mt-5 text-2xl font-semibold leading-9 text-white/90">
                                Мы увели интерфейс от случайной яркости в сторону уверенной, деловой и современной визуальной системы.
                            </p>
                            <div className="mt-8 space-y-4">
                                {[
                                    "Темно-синий каркас вместо шаблонной фиолетовой палитры",
                                    "Четкие секции и большие поверхности вместо визуального шума",
                                    "Акцент на продуктовой ценности, а не на декоративном фоне",
                                ].map((point) => (
                                    <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-cyan-300" />
                                        <p className="text-sm leading-7 text-white/80">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    </div>
                </section>

                <section className="pb-8">
                    <div className="rounded-[36px] border border-cyan-100 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:px-10">
                        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div>
                                <div className="eyebrow border-white/10 bg-white/10 text-cyan-200 shadow-none">
                                    <Sparkles className="h-4 w-4" />
                                    Готово к демонстрации
                                </div>
                                <h2 className="mt-5 max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                                    Новый front для AqbobekHub теперь выглядит как зрелый edtech-продукт, а не как шаблонный MVP.
                                </h2>
                                <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
                                    Откройте демо-вход и посмотрите, как обновленный стиль продолжает себя в интерфейсах ролей и основных сценариях платформы.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-slate-950 hover:-translate-y-0.5"
                                >
                                    Перейти в демо
                                    <ArrowRight className="h-5 w-5" />
                                </Link>
                                <a
                                    href="#capabilities"
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/15"
                                >
                                    Ещё раз посмотреть блоки
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
