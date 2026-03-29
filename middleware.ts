import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccessPath, decodeSession, SESSION_COOKIE } from "./lib/demo-auth";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);

    const isDashboardPage =
        pathname.startsWith("/student") ||
        pathname.startsWith("/teacher") ||
        pathname.startsWith("/parent") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/news") ||
        pathname.startsWith("/leaderboard") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/ai-assistant") ||
        pathname.startsWith("/kiosk");

    if (pathname === "/login" && session) {
        return NextResponse.redirect(new URL(session.homePath, request.url));
    }

    if (!isDashboardPage) {
        return NextResponse.next();
    }

    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!canAccessPath(session.role, pathname)) {
        return NextResponse.redirect(new URL(session.homePath, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/login",
        "/student/:path*",
        "/teacher/:path*",
        "/parent/:path*",
        "/admin/:path*",
        "/news/:path*",
        "/leaderboard/:path*",
        "/settings/:path*",
        "/ai-assistant/:path*",
        "/kiosk/:path*",
    ],
};
