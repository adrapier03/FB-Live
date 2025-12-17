"use client";

import { useEffect, useState } from "react";

export default function CountdownTimer({ startedAt }: { startedAt: number }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startedAt;
            const totalDuration = 8 * 60 * 60 * 1000; // 8 hours
            const remaining = totalDuration - elapsed;

            if (remaining <= 0) {
                setTimeLeft("00:00:00");
                clearInterval(interval);
                return;
            }

            const h = Math.floor((remaining / (1000 * 60 * 60)) % 24);
            const m = Math.floor((remaining / (1000 * 60)) % 60);
            const s = Math.floor((remaining / 1000) % 60);

            setTimeLeft(
                `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [startedAt]);

    return (
        <div className="text-center p-6 border border-red-900/50 bg-red-900/20 rounded-xl">
            <p className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-1">Time Remaining</p>
            <div className="text-5xl font-mono font-bold text-red-500 tabular-nums">
                {timeLeft || "08:00:00"}
            </div>
        </div>
    );
}
