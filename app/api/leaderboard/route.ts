import { NextResponse } from "next/server";
import { handleRouteError } from "../../../lib/http";
import { getLeaderboard } from "../../../lib/server-data";
import { requireSession } from "../../../lib/session";

export async function GET() {
    try {
        const session = await requireSession();
        const leaderboard = await getLeaderboard(session.userId);
        return NextResponse.json({ leaderboard });
    } catch (error) {
        return handleRouteError(error);
    }
}
