"use client";

import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import VideoUpload from "./VideoUpload";
import CountdownTimer from "./CountdownTimer";
import VideoLibrary from "./VideoLibrary";

export default function Dashboard({ user }: { user: { name: string } }) {
    const [streamKey, setStreamKey] = useState("");
    const [filename, setFilename] = useState("");
    const [status, setStatus] = useState<{ running: boolean; startedAt?: number; pid?: number }>({
        running: false,
    });
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [mode, setMode] = useState("landscape");

    // Poll status
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch("/api/stream/status");
                const data = await res.json();
                setStatus(data);
            } catch (e) {
                console.error("Status check failed", e);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const startStream = async () => {
        if (!streamKey || !filename) return alert("Please provide stream key and video filename");

        setLoading(true);
        try {
            const res = await fetch("/api/stream/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ streamKey, filename, mode }),
            });
            const data = await res.json();
            if (data.success) {
                setStatus({ running: true, startedAt: data.startedAt, pid: data.pid });
            } else {
                alert("Failed to start: " + data.error);
            }
        } catch (e) {
            alert("Error starting stream");
        } finally {
            setLoading(false);
        }
    };

    const stopStream = async () => {
        setLoading(true);
        try {
            await fetch("/api/stream/stop", { method: "POST" });
            setStatus({ running: false });
        } catch (e) {
            alert("Error stopping stream");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            FB Live Dashboard
                        </h1>
                        <p className="text-gray-400 mt-1">Logged in as <span className="text-white font-medium">{user.name}</span></p>
                    </div>
                    <div className="flex gap-4">
                        {(user as any).role === "ADMIN" && (
                            <button
                                onClick={() => window.location.href = "/users"}
                                className="px-4 py-2 text-sm bg-purple-900/50 hover:bg-purple-900 text-purple-200 rounded-lg transition-colors border border-purple-800"
                            >
                                Manage Users
                            </button>
                        )}
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Status & Timer */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-xl border ${status.running ? "bg-green-900/10 border-green-500/50" : "bg-gray-900/50 border-gray-800"}`}>
                        <h3 className="text-sm font-semibold uppercase text-gray-400 mb-2">Stream Status</h3>
                        <div className="flex items-center space-x-3">
                            <span className={`w-3 h-3 rounded-full ${status.running ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
                            <span className="text-2xl font-bold">{status.running ? "LIVE" : "OFFLINE"}</span>
                        </div>
                        {status.pid && <p className="text-xs text-gray-500 mt-2 font-mono">PID: {status.pid}</p>}
                    </div>

                    <div>
                        {status.running && status.startedAt ? (
                            <CountdownTimer startedAt={status.startedAt} />
                        ) : (
                            <div className="h-full flex items-center justify-center p-6 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-500 font-mono text-xl">
                                08:00:00
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                            <h3 className="text-sm font-semibold uppercase text-gray-400 mb-4">Select Video</h3>

                            <div className="mb-6">
                                <h4 className="text-xs text-gray-500 mb-2 uppercase">Option 1: Upload New</h4>
                                <VideoUpload onUploadComplete={(fname) => {
                                    setFilename(fname);
                                    setRefreshKey(k => k + 1);
                                }} />
                            </div>

                            <div>
                                <h4 className="text-xs text-gray-500 mb-2 uppercase">Option 2: From Library</h4>
                                <VideoLibrary key={refreshKey} onSelect={setFilename} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Video Filename</label>
                            <input
                                type="text"
                                value={filename}
                                readOnly
                                placeholder="Uploaded filename..."
                                className="w-full bg-gray-900 border border-gray-800 rounded px-4 py-3 text-gray-300 font-mono text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Stream Key</label>
                            <input
                                type="password"
                                value={streamKey}
                                onChange={(e) => setStreamKey(e.target.value)}
                                placeholder="Facebook Stream Key"
                                className="w-full bg-gray-900 border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Orientation</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setMode("landscape")}
                                    className={`flex-1 py-3 rounded-lg border font-medium transition-all ${mode === "landscape" ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"}`}
                                >
                                    Landscape (16:9)
                                </button>
                                <button
                                    onClick={() => setMode("portrait")}
                                    className={`flex-1 py-3 rounded-lg border font-medium transition-all ${mode === "portrait" ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"}`}
                                >
                                    Portrait (9:16)
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            {!status.running ? (
                                <button
                                    onClick={startStream}
                                    disabled={loading || !streamKey || !filename}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform active:scale-95"
                                >
                                    {loading ? "Starting..." : "START STREAM"}
                                </button>
                            ) : (
                                <button
                                    onClick={stopStream}
                                    disabled={loading}
                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 transition-all transform active:scale-95"
                                >
                                    {loading ? "Stopping..." : "STOP STREAM"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
