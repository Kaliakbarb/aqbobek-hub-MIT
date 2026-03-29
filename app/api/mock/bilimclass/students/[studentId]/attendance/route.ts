import { NextResponse } from "next/server";
import { jsonError } from "../../../../../../../lib/http";
import { getMockBilimClassStudentSnapshot } from "../../../../../../../lib/mock-bilimclass";

type Context = {
    params: Promise<{ studentId: string }>;
};

export async function GET(_: Request, { params }: Context) {
    const { studentId } = await params;
    const student = await getMockBilimClassStudentSnapshot(studentId);
    if (!student) {
        return jsonError("Ученик не найден в mock BilimClass API.", 404);
    }

    return NextResponse.json({
        studentId: student.studentId,
        fullName: student.fullName,
        class: student.class,
        attendance: student.attendance,
    });
}
