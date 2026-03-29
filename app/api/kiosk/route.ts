import { NextResponse } from "next/server";
import { handleRouteError } from "../../../lib/http";
import { getKioskData } from "../../../lib/server-data";
import { requireSessionUser } from "../../../lib/session";

export async function GET() {
    try {
        await requireSessionUser();
        const kiosk = await getKioskData();
        return NextResponse.json({ kiosk });
    } catch (error) {
        return handleRouteError(error);
    }
}
