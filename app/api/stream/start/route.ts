import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { streamKey, filename, mode = "landscape" } = await req.json();

        if (!streamKey || !filename) {
            return NextResponse.json({ error: "Missing streamKey or filename" }, { status: 400 });
        }

        const videoPath = path.join(process.cwd(), "public/uploads", filename);

        if (!fs.existsSync(videoPath)) {
            return NextResponse.json({ error: "Video file not found" }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const stateFile = path.join(process.cwd(), `stream_${userId}.json`);

        // Stop existing stream if running
        if (fs.existsSync(stateFile)) {
            try {
                const oldState = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
                if (oldState.pid) {
                    process.kill(oldState.pid, "SIGTERM");
                }
            } catch (e) {
                // Ignore
            }
        }

        const facebookUrl = `rtmps://live-api.facebook.com:443/rtmp/${streamKey}`;

        // FFmpeg Filter Logic
        let videoFilter = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1"; // Landscape Default

        if (mode === "portrait") {
            videoFilter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1";
        }

        // FFmpeg args
        const args = [
            "-re",
            "-stream_loop", "-1",
            "-i", videoPath,
            "-vf", videoFilter,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-profile:v", "high",
            "-level:v", "4.0",
            "-pix_fmt", "yuv420p",
            "-b:v", "4500k",
            "-maxrate", "5000k",
            "-bufsize", "10000k",
            "-g", "60",
            "-keyint_min", "60",
            "-sc_threshold", "0",
            "-c:a", "aac",
            "-b:a", "128k",
            "-ar", "44100",
            "-flush_packets", "1",
            "-f", "flv",
            facebookUrl
        ];

        console.log("Starting FFmpeg with:", args.join(" "));

        const ffmpegProcess = spawn("ffmpeg", args, {
            stdio: "ignore", // Detach properly
            detached: true
        });

        if (!ffmpegProcess.pid) {
            throw new Error("Failed to spawn process");
        }

        ffmpegProcess.unref(); // Allow node to exit independently if needed

        const state = {
            pid: ffmpegProcess.pid,
            startedAt: Date.now(),
            videoPath,
            streamKey: "***" // Don't store full key if possible, or store for reconnect
        };

        fs.writeFileSync(stateFile, JSON.stringify(state));

        await db.user.update({
            where: { id: userId },
            data: { isLive: true }
        });

        return NextResponse.json({ success: true, pid: ffmpegProcess.pid, startedAt: state.startedAt });
    } catch (error) {
        console.error("Start error:", error);
        return NextResponse.json({ error: "Failed to start stream" }, { status: 500 });
    }
}
