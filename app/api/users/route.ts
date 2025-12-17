import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Middleware check helper
async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return false;
    }
    return true;
}

export async function GET() {
    if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await db.user.findMany({
        select: { id: true, username: true, role: true, createdAt: true, isLive: true },
    });
    return NextResponse.json(users);
}

export async function POST(req: Request) {
    if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username, password, role } = await req.json();
    if (!username || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    try {
        const user = await db.user.create({
            data: {
                username,
                password, // Reminder: Hash in production
                role: role || "USER",
            },
        });
        return NextResponse.json(user);
    } catch (e) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
