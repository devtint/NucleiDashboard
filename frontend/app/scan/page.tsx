"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, Shield, Target, Terminal } from "lucide-react";
import { clsx } from "clsx";
import { AlertTriangle } from "lucide-react"; // Added for error message icon

export default function NewScanPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [target, setTarget] = useState("");
    const [scanType, setScanType] = useState("fast");
    const [templates, setTemplates] = useState(searchParams.get("template") || "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("http://localhost:3001/api/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target, type: scanType, templates }),
            });

            if (!res.ok) throw new Error("Failed to start scan");

            setSuccess(`Scan started for ${target}`);
            setTarget("");
            setTemplates("");
        } catch (err) {
            setError("Failed to connect to backend. Is it running?");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">New Scan</h1>
                <p className="text-muted-foreground">
                    Configure and launch a new Nuclei scan.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        {success}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Target URL</label>
                    <input
                        type="text"
                        placeholder="example.com"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Scan Profile</label>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            type="button"
                            onClick={() => setScanType("fast")}
                            className={clsx(
                                "p-4 rounded-xl border text-left transition-all",
                                scanType === "fast"
                                    ? "bg-primary/10 border-primary ring-1 ring-primary"
                                    : "bg-card border-border hover:border-primary/50"
                            )}
                        >
                            <div className="font-semibold">Fast</div>
                            <div className="text-xs text-muted-foreground mt-1">Top 100 templates</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setScanType("full")}
                            className={clsx(
                                "p-4 rounded-xl border text-left transition-all",
                                scanType === "full"
                                    ? "bg-primary/10 border-primary ring-1 ring-primary"
                                    : "bg-card border-border hover:border-primary/50"
                            )}
                        >
                            <div className="font-semibold">Full</div>
                            <div className="text-xs text-muted-foreground mt-1">All templates</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setScanType("custom")}
                            className={clsx(
                                "p-4 rounded-xl border text-left transition-all",
                                scanType === "custom"
                                    ? "bg-primary/10 border-primary ring-1 ring-primary"
                                    : "bg-card border-border hover:border-primary/50"
                            )}
                        >
                            <div className="font-semibold">Custom</div>
                            <div className="text-xs text-muted-foreground mt-1">Specific tags</div>
                        </button>
                    </div>
                </div>

                {scanType === "custom" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-medium">Templates / Tags</label>
                        <input
                            type="text"
                            placeholder="cve, misconfig, exposure"
                            value={templates}
                            onChange={(e) => setTemplates(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <p className="text-xs text-muted-foreground">
                            Comma-separated list of template IDs or tags.
                        </p>
                    </div>
                )}
                {/* Action Bar */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isLoading || !target}
                        className={clsx(
                            "bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/25",
                            isLoading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            "Starting Scan..."
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                Launch Nuclei
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
