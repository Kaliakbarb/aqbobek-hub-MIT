import React from "react";
import { User, Bell, Shield, Languages, Moon, Palette, CheckCircle2 } from "lucide-react";

export default function Settings() {
    return (
        <div className="space-y-6 animate-fadeUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shadow-sm pb-4 border-b border-border">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-foreground">Настройки</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Управление профилем и предпочтениями</p>
                </div>
                <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" /> Сохранить изменения
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Sidebar Nav */}
                <div className="md:col-span-1 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold text-sm transition-colors text-left">
                        <User className="w-5 h-5" /> Профиль
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-black/5 hover:text-foreground font-medium text-sm transition-colors text-left">
                        <Bell className="w-5 h-5" /> Уведомления
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-black/5 hover:text-foreground font-medium text-sm transition-colors text-left">
                        <Shield className="w-5 h-5" /> Безопасность
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-black/5 hover:text-foreground font-medium text-sm transition-colors text-left">
                        <Palette className="w-5 h-5" /> Внешний вид
                    </button>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-6">
                    <div className="liquid-glass rounded-[2rem] p-8">
                        <h2 className="text-xl font-sora font-bold text-foreground mb-6">Личные данные</h2>

                        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary-accent text-white flex items-center justify-center font-sora font-bold text-2xl shadow-sm">
                                Т
                            </div>
                            <div>
                                <button className="bg-white border border-border px-4 py-2 rounded-xl text-sm font-semibold hover:border-primary/50 transition-colors mb-2 block">Изменить фото</button>
                                <p className="text-xs text-muted-foreground">Формат JPG, PNG. Макс 2 MB.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-foreground mb-2">Имя</label>
                                <input type="text" defaultValue="Тимур" className="w-full bg-white/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium text-foreground" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-foreground mb-2">Фамилия</label>
                                <input type="text" defaultValue="Асанов" className="w-full bg-white/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium text-foreground" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-bold text-foreground mb-2">Email</label>
                                <input type="email" defaultValue="demo@aqbobek.kz" disabled className="w-full bg-black/5 border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed" />
                                <p className="text-xs text-muted-foreground mt-2">Email привязан к вашей школьной учетной записи. Для изменения обратитесь в администрацию.</p>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass rounded-[2rem] p-8">
                        <h2 className="text-xl font-sora font-bold text-foreground mb-6">Предпочтения</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-border">
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">Язык интерфейса</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Выберите основной язык портала</p>
                                </div>
                                <select className="bg-white border border-border rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none text-foreground outline-none">
                                    <option>Русский</option>
                                    <option>Қазақша</option>
                                    <option>English</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-border">
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">Светлая/Темная тема</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Автоматически по системе</p>
                                </div>
                                <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
