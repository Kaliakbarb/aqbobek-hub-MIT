export type AppRole = "student" | "teacher" | "admin" | "parent";

export type AppSession = {
    userId: string;
    username: string;
    role: AppRole;
    fullName: string;
    homePath: string;
};

export const SESSION_COOKIE = "aqbobek_session";

const roleAccessMap: Record<AppRole, string[]> = {
    student: ["/student", "/student/profile", "/ai-assistant", "/leaderboard", "/news", "/settings"],
    teacher: ["/teacher", "/ai-assistant", "/leaderboard", "/news", "/settings"],
    admin: ["/admin", "/admin/schedule", "/ai-assistant", "/leaderboard", "/news", "/settings", "/kiosk"],
    parent: ["/parent", "/ai-assistant", "/news", "/settings"],
};

export function getHomePath(role: AppRole) {
    if (role === "student") return "/student";
    if (role === "teacher") return "/teacher";
    if (role === "admin") return "/admin";
    return "/parent";
}

export function encodeSession(session: AppSession) {
    return encodeURIComponent(JSON.stringify(session));
}

export function decodeSession(value?: string | null): AppSession | null {
    if (!value) return null;

    try {
        const parsed = JSON.parse(decodeURIComponent(value)) as AppSession;
        if (!parsed?.userId || !parsed?.username || !parsed?.role || !parsed?.homePath) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

export function canAccessPath(role: AppRole, pathname: string) {
    const allowed = roleAccessMap[role];
    return allowed.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
