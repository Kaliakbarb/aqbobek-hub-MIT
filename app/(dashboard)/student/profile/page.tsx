import React from "react";
import {
    Award, Medal, BookOpen, Activity, ShieldCheck,
} from "lucide-react";
import { getStudentProfile } from "../../../../lib/server-data";
import { getSession } from "../../../../lib/session";

export default async function StudentProfile() {
    const session = await getSession();
    const profile = session ? await getStudentProfile(session.userId) : null;

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
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-semibold">Призер олимпиад</span>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-semibold">Клуб робототехники</span>
                    </div>
                </div>

                <div className="bg-white/60 p-4 rounded-2xl border border-border text-center min-w-[150px] relative z-10">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Средний балл</p>
                    <p className="text-4xl font-sora font-bold text-primary">{profile?.gpa.toFixed(1) ?? "0.0"}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-secondary-accent" /> Выдающиеся достижения
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile?.achievements.map((item) => (
                                <div key={item.id} className="bg-white/50 border border-border p-4 rounded-xl flex gap-4 hover:border-primary/40 transition-colors">
                                    <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-slate-700 shrink-0`}>
                                        {item.icon === "Medal" ? <Medal className="w-6 h-6" /> : item.icon === "BookOpen" ? <BookOpen className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground mb-1">{item.title}</h4>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
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
                    <div className="liquid-glass p-6 rounded-[2rem]">
                        <h2 className="text-lg font-sora font-bold text-foreground mb-4">Навыки и интересы</h2>
                        <div className="flex flex-wrap gap-2">
                            {profile?.skills.map((skill) => (
                                <span key={skill.id} className="bg-black/5 text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold">{skill.name}</span>
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
