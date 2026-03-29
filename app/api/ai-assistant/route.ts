import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const model = "gemini-2.5-flash";

function sanitizeGeminiText(text: string) {
    return text
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .replace(/^#{1,6}\s*/gm, "")
        .replace(/^\s*---+\s*$/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured on the server." },
                { status: 500 },
            );
        }

        const body = await request.json();
        const message = typeof body?.message === "string" ? body.message.trim() : "";
        const history = Array.isArray(body?.history) ? body.history : [];

        if (!message) {
            return NextResponse.json({ error: "Message is required." }, { status: 400 });
        }

        const ai = new GoogleGenAI({ apiKey });
        const conversation = history
            .filter((item: { role?: string; text?: string }) => item?.text && item?.role)
            .slice(-8)
            .map((item: { role: string; text: string }) => `${item.role === "assistant" ? "Наставник" : "Пользователь"}: ${item.text}`)
            .join("\n");

        const prompt = `
Ты AI-Наставник внутри платформы AqbobekHub.

Контекст:
- Это школьная образовательная платформа.
- Отвечай по-русски.
- Тон спокойный, доброжелательный, конкретный.
- Давай практичные рекомендации для учебы, дисциплины, планирования и подготовки.
- Не выдумывай доступ к скрытым данным, если их нет в сообщении.
- Если вопрос не про учебу, все равно отвечай кратко и полезно.
- Не используй markdown-оформление вроде **жирного**, # заголовков, --- разделителей.
- Не используй звездочки * для списков.
- Пиши чистым, красивым текстом.
- Если даешь план, оформляй его как понятный список с коротким вступлением и шагами по порядку.
- Для учебных планов используй формат:
  Название плана
  День 1: ...
  1. ...
  2. ...
  День 2: ...
- Если даешь советы, группируй мысли в короткие абзацы или аккуратные списки.
- Не перегружай ответ лишней водой.

История диалога:
${conversation || "Диалог только начинается."}

Новое сообщение пользователя:
Пользователь: ${message}

Ответ наставника:
        `.trim();

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });

        const text = response.text ? sanitizeGeminiText(response.text) : "";

        if (!text) {
            return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 });
        }

        return NextResponse.json({ text });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Gemini API error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
