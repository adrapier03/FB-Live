import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const videos = await db.video.findMany({
        where: { userId: (session.user as any).id },
        orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(videos);
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();

    const video = await db.video.findUnique({
        where: { id }
    });

    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Check ownership or admin
    if (video.userId !== (session.user as any).id && (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete file
    const filepath = path.join(process.cwd(), "public/uploads", video.filename);
    try {
        await unlink(filepath);
    } catch (e) {
        console.error("Failed to delete file", e);
    }

    // Delete db record
    await db.video.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
