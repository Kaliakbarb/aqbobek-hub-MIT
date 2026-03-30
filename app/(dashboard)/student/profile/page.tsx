import React from "react";
import {
    Award, Medal, BookOpen, Activity, ShieldCheck, Sparkles, Target,
} from "lucide-react";
import { UserRole } from "@prisma/client";
import { getStudentProfile, requireRole } from "../../../../lib/server-data";
import { requireSessionUser } from "../../../../lib/session";

export default async function StudentProfile() {
    const user = await requireSessionUser();
    requireRole(user, [UserRole.student]);
    const profile = await getStudentProfile(user.id);

    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="liquid-glass rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <ShieldCheck className="w-64 h-64 text-primary" />
                </div>

                <div className="w-32 h-32 rounded-full border-4 border-white/50 bg-gradient-to-br from-primary to-secondary-accent flex flex-col items-center justify-center text-white shadow-xl shrink-0">
                    <span className="font-sora font-bold text-4xl">{profile?.fullName?.slice(0, 1) ?? "?"}</span>
                </div>

                <div className="text-center md:text-left flex-1 relative z-10">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                        <h1 className="text-3xl font-sora font-bold text-foreground">{profile?.fullName ?? "Профиль ученика"}</h1>
                        <ShieldCheck className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-4">
                        {profile ? `Ученик ${profile.className} класса • ${profile.profileDirection}` : "Данные профиля загружаются"}
                    </p>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-semibold">Топ {profile?.rank ?? "-"} из {profile?.rankTotal ?? "-"}</span>
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-semibold">{profile?.achievementSummary.strongestTrack ?? "Достижения"}</span>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-semibold">{profile?.achievementSummary.badgeCount ?? 0} бейджей</span>
                    </div>
                </div>

                <div className="bg-white/60 p-4 rounded-2xl border border-border text-center min-w-[150px] relative z-10">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Средний балл</p>
                    <p className="text-4xl font-sora font-bold text-primary">{profile?.gpa.toFixed(1) ?? "0.0"}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="liquid-glass p-5 rounded-[1.5rem]">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Всего достижений</p>
                            <p className="mt-2 text-3xl font-sora font-bold text-foreground">{profile?.achievementSummary.total ?? 0}</p>
                        </div>
                        <div className="liquid-glass p-5 rounded-[1.5rem]">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Редкие</p>
                            <p className="mt-2 text-3xl font-sora font-bold text-primary">{profile?.achievementSummary.rareCount ?? 0}</p>
                        </div>
                        <div className="liquid-glass p-5 rounded-[1.5rem]">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Пропуски</p>
                            <p className="mt-2 text-3xl font-sora font-bold text-foreground">{profile?.achievementSummary.absenceCount ?? 0}</p>
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-secondary-accent" /> Выдающиеся достижения
                        </h2>
                        <p className="text-sm text-muted-foreground mb-5">
                            Здесь видно не только само достижение, но и за что именно оно получено и почему оно усиливает профиль ученика.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile?.achievements.map((item) => (
                                <div key={item.id} className="bg-white/50 border border-border p-4 rounded-xl flex gap-4 hover:border-primary/40 transition-colors">
                                    <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-slate-700 shrink-0`}>
                                        {item.icon === "Medal" ? <Medal className="w-6 h-6" /> : item.icon === "BookOpen" ? <BookOpen className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.rarity.tone}`}>{item.rarity.label}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                        <div className="mt-3 rounded-xl bg-black/5 px-3 py-2">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">За что</p>
                                            <p className="mt-1 text-xs text-foreground/80">{item.reasonLabel}</p>
                                        </div>
                                        <div className="mt-2 rounded-xl bg-primary/5 px-3 py-2">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-primary/80">Почему это круто</p>
                                            <p className="mt-1 text-xs text-foreground/80">{item.highlightText}</p>
                                        </div>
                                        <p className="mt-3 text-[11px] font-medium text-muted-foreground">{item.category} • добавлено {item.earnedAtLabel}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">История активности</h2>
                        <div className="relative border-l border-border ml-3 space-y-6 pl-6">
                            {profile?.activity.map((item) => (
                                <div key={item.id} className="relative">
                                    <div className={`absolute -left-[29px] top-1.5 w-3 h-3 rounded-full ${item.color} ring-4 ring-background`}></div>
                                    <p className="text-xs font-bold text-muted-foreground mb-1">{item.date}</p>
                                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem] bg-gradient-to-b from-white to-[#f8f5ff]">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Следующее достижение</h2>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{profile?.featuredMilestone?.title ?? "Новые цели скоро появятся"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{profile?.featuredMilestone?.hint}</p>
                        {profile?.featuredMilestone && (
                            <>
                                <div className="mt-4 h-2 rounded-full bg-border">
                                    <div className="h-2 rounded-full bg-primary" style={{ width: `${profile.featuredMilestone.progress}%` }}></div>
                                </div>
                                <p className="mt-2 text-xs font-medium text-muted-foreground">{profile.featuredMilestone.valueLabel}</p>
                            </>
                        )}
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Навыки и интересы</h2>
                        <div className="flex flex-wrap gap-2">
                            {profile?.skills.map((skill) => (
                                <span key={skill.id} className="bg-black/5 text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold">{skill.name}</span>
                            ))}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-sora font-bold text-foreground">Путь к новым достижениям</h2>
                        </div>
                        <div className="space-y-4">
                            {profile?.nextAchievements.map((item) => (
                                <div key={item.id} className="rounded-xl border border-border/60 bg-white/50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
                                        </div>
                                        <span className="text-xs font-bold text-primary">{item.progress}%</span>
                                    </div>
                                    <div className="mt-3 h-2 rounded-full bg-border">
                                        <div className="h-2 rounded-full bg-primary" style={{ width: `${item.progress}%` }}></div>
                                    </div>
                                    <p className="mt-2 text-[11px] font-medium text-muted-foreground">{item.valueLabel}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="liquid-glass p-6 rounded-[2rem] bg-gradient-to-b from-white to-[#f8f5ff]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-2">QR Портфолио</h2>
                        <p className="text-xs text-muted-foreground mb-6">Отсканируйте для просмотра цифрового профиля ученика при поступлении.</p>
                        <div className="w-32 h-32 mx-auto bg-white rounded-xl shadow-sm border border-border p-2">
                            <div className="w-full h-full border-4 border-dashed border-muted-foreground/20 rounded flex items-center justify-center">
                                <span className="text-xs text-muted-foreground text-center font-bold">QR Код</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
