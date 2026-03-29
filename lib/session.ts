import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { decodeSession, type AppSession, SESSION_COOKIE } from "./demo-auth";

export async function getSession() {
    const cookieStore = await cookies();
    return decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function getSessionUser() {
    const session = await getSession();
    if (!session) return null;

    return prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            settings: true,
            student: {
                include: {
                    schoolClass: true,
                },
            },
            teacher: true,
            parentLinks: {
                include: {
                    student: {
                        include: {
                            user: true,
                            schoolClass: true,
                        },
                    },
                },
            },
        },
    });
}

export async function requireSession() {
    const session = await getSession();
    if (!session) {
        throw new Error("UNAUTHORIZED");
    }

    return session;
}

export async function requireSessionUser() {
    const user = await getSessionUser();
    if (!user) {
        throw new Error("UNAUTHORIZED");
    }

    return user;
}

export function buildSession(payload: {
    userId: string;
    username: string;
    role: AppSession["role"];
    fullName: string;
    homePath: string;
}) {
    return payload satisfies AppSession;
}
