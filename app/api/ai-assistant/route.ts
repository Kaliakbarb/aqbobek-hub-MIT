import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "../../../lib/http";
import { prisma } from "../../../lib/prisma";
import { buildAiContext, getChatHistory } from "../../../lib/server-data";
import { requireSessionUser } from "../../../lib/session";
import { ChatRole } from "@prisma/client";

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
            return jsonError("GEMINI_API_KEY is not configured on the server.", 500);
        }

        const user = await requireSessionUser();
        const body = await request.json();
        const message = typeof body?.message === "string" ? body.message.trim() : "";

        if (!message) {
            return jsonError("Message is required.");
        }

        await prisma.chatMessage.create({
            data: {
                userId: user.id,
                role: ChatRole.user,
                text: message,
            },
        });

        const ai = new GoogleGenAI({ apiKey });
        const history = (await getChatHistory(user.id)).slice(-10);
        const conversation = history
            .map((item) => `${item.role === "assistant" ? "Наставник" : "Пользователь"}: ${item.text}`)
            .join("\n");
        const context = await buildAiContext(user.id);

        const prompt = `
Ты AI-Наставник внутри платформы AqbobekHub.

Правила:
- Отвечай по-русски.
- Тон спокойный, доброжелательный, конкретный.
- Используй контекст пользователя ниже как основной источник фактов.
- Если данных недостаточно, прямо скажи об этом и дай безопасную рекомендацию.
- Не используй markdown-оформление вроде **жирного**, # заголовков и --- разделителей.
- Для шагов используй обычную нумерацию 1. 2. 3.
- Если вопрос про учебу, опирайся на реальные оценки, риски, расписание и задачи.
- Не придумывай скрытые данные, которых нет в контексте.

Контекст пользователя:
${context}

История диалога:
${conversation || "Диалог только начинается."}

Новое сообщение:
${message}

Ответ наставника:
        `.trim();

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });

        const text = response.text ? sanitizeGeminiText(response.text) : "";
        if (!text) {
            return jsonError("Gemini returned an empty response.", 502);
        }

        const saved = await prisma.chatMessage.create({
            data: {
                userId: user.id,
                role: ChatRole.assistant,
                text,
            },
        });

        return NextResponse.json({
            text,
            messageId: saved.id,
        });
    } catch (error) {
        return handleRouteError(error);
    }
}
