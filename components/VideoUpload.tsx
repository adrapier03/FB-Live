"use client";

import { useState } from "react";

export default function VideoUpload({ onUploadComplete }: { onUploadComplete: (path: string) => void }) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.filename) {
                onUploadComplete(data.filename);
                alert("Upload successful!");
            } else {
                alert("Upload failed");
            }
        } catch (err) {
            console.error(err);
            alert("Error uploading file");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4 border border-gray-800 rounded-lg bg-gray-900/50">
            <h3 className="text-lg font-semibold mb-2 text-gray-200">Upload Video</h3>
            <input
                type="file"
                accept="video/mp4"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-400
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-600 file:text-white
          hover:file:bg-blue-500
          transition-all"
            />
            {uploading && <p className="text-sm text-blue-400 mt-2 animate-pulse">Uploading... please wait.</p>}
        </div>
    );
}
