import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ running: false });

        const userId = (session.user as any).id;
        const stateFile = path.join(process.cwd(), `stream_${userId}.json`);

        if (!fs.existsSync(stateFile)) {
            return NextResponse.json({ running: false });
        }

        const state = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
        const pid = state.pid;

        try {
            // Check if process exists signal 0
            process.kill(pid, 0);
            return NextResponse.json({
                running: true,
                startedAt: state.startedAt,
                pid: state.pid
            });
        } catch (e) {
            // Process doesn't exist, clean up
            fs.unlinkSync(stateFile);
            return NextResponse.json({ running: false });
        }
    } catch (error) {
        console.error("Status error:", error);
        return NextResponse.json({ error: "Status check failed" }, { status: 500 });
    }
}
