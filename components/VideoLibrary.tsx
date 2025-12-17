"use client";

import { useState, useEffect } from "react";

interface Video {
    id: string;
    filename: string;
    originalName: string;
    size: number;
    createdAt: string;
}

export default function VideoLibrary({ onSelect }: { onSelect: (filename: string) => void }) {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchVideos = async () => {
        try {
            const res = await fetch("/api/videos");
            const data = await res.json();
            setVideos(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this video?")) return;

        try {
            await fetch("/api/videos", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            fetchVideos(); // Refresh
        } catch (e) {
            alert("Failed to delete video");
        }
    };

    if (loading) return <div className="text-gray-400 text-sm animate-pulse">Loading videos...</div>;

    if (videos.length === 0) return <div className="text-gray-500 text-sm">No videos found. Upload one to get started.</div>;

    return (
        <div className="grid gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {videos.map((video) => (
                <div
                    key={video.id}
                    onClick={() => onSelect(video.filename)}
                    className="group flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition-all"
                >
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-medium text-gray-200 truncate pr-4">{video.originalName}</span>
                        <span className="text-xs text-gray-500">{(video.size / 1024 / 1024).toFixed(2)} MB • {new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button
                        onClick={(e) => handleDelete(video.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
                        title="Delete Video"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            ))}
        </div>
    );
}
