import { NextResponse } from "next/server";
import { getMe } from "../../../../lib/server-data";
import { getSession } from "../../../../lib/session";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ session: null });
    }

    const user = await getMe(session.userId);
    if (!user) {
        return NextResponse.json({ session: null });
    }

    return NextResponse.json({
        session: {
            userId: user.id,
            username: user.username,
            role: user.role,
            fullName: user.fullName,
            homePath: user.homePath,
        },
    });
}
