import { NextResponse } from "next/server";
import { getMockBilimClassClasses } from "../../../../../lib/mock-bilimclass";

export async function GET() {
    const classes = await getMockBilimClassClasses();
    return NextResponse.json({ classes });
}
