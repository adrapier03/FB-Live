import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const stateFile = path.join(process.cwd(), `stream_${userId}.json`);

        if (!fs.existsSync(stateFile)) {
            return NextResponse.json({ error: "No stream running" }, { status: 404 });
        }

        const state = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
        const pid = state.pid;

        if (pid) {
            try {
                process.kill(pid, "SIGTERM"); // or SIGKILL
            } catch (e) {
                console.error("Failed to kill process (maybe already dead):", e);
            }
        }

        fs.unlinkSync(stateFile);

        await db.user.update({
            where: { id: userId },
            data: { isLive: false }
        });

        return NextResponse.json({ success: true, message: "Stream stopped" });
    } catch (error) {
        console.error("Stop error:", error);
        return NextResponse.json({ error: "Failed to stop stream" }, { status: 500 });
    }
}
