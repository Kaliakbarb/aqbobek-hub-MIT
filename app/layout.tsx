import type { Metadata } from "next";
import "@fontsource/sora/400.css";
import "@fontsource/sora/500.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";

export const metadata: Metadata = {
    title: "AqbobekHub - Мультиролевая образовательная платформа",
    description: "Операционная система для школ: аналитика, оценки, ИИ, управление расписанием.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru">
            <body className="antialiased min-h-screen bg-background text-foreground">
                {children}
            </body>
        </html>
    );
}
