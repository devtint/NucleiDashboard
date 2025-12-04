"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle, Clock, Globe, Hash, Shield, Tag, Trash2 } from "lucide-react";

// ... (rest of imports)

// ... (inside component)

// Remove duplicate updateStatus definition if it exists later in the file
// The previous replace_file_content might have inserted it without removing the old one if the context wasn't perfect.
// I will read the file first to be sure, but based on the lint error, it is definitely duplicated.

// Actually, I'll just fix the imports first as that's a sure thing.
// And I will remove the duplicate updateStatus by replacing the entire block if needed, 
// but let's look at the file content first to be precise.
import { clsx } from "clsx";

interface Finding {
    id: number;
    template_id: string;
    name: string;
    severity: string;
    description: string;
    host: string;
    matched_at: string;
    info: string; // JSON string
    state: string;
    first_seen: string;
    last_seen: string;
    fingerprint: string;
}

export default function FindingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [finding, setFinding] = useState<Finding | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`http://127.0.0.1:3001/api/findings/${params.id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Finding not found");
                return res.json();
            })
            .then((data) => {
                setFinding(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setIsLoading(false);
            });
    }, [params.id]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading details...</div>;
    }

    if (!finding) {
        return <div className="p-8 text-center text-red-500">Finding not found.</div>;
    }

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case "critical": return "text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800";
            case "high": return "text-orange-600 bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
            case "medium": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
            case "low": return "text-blue-600 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
            default: return "text-gray-600 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
        }
    };

    const updateStatus = (newStatus: string) => {
        if (!finding) return; // Ensure finding is not null before proceeding
        fetch(`http://localhost:3001/api/findings/${finding.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: newStatus }),
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to update status");
                return res.json();
            })
            .then((data) => setFinding(data))
            .catch((err) => console.error("Failed to update status:", err));
    };

    const deleteFinding = () => {
        if (!finding) return; // Ensure finding is not null before proceeding
        if (confirm("Are you sure you want to delete this finding? This action cannot be undone.")) {
            fetch(`http://localhost:3001/api/findings/${finding.id}`, {
                method: "DELETE",
                credentials: "include",
            })
                .then((res) => {
                    if (res.ok) {
                        router.push("/findings"); // Use router.push for navigation
                    } else {
                        alert("Failed to delete finding");
                    }
                })
                .catch((err) => console.error("Failed to delete finding:", err));
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading details...</div>;
    }

    if (!finding) {
        return <div className="p-8 text-center text-red-500">Finding not found.</div>;
    }

    let infoObj = {};
    try {
        infoObj = JSON.parse(finding.info);
    } catch (e) { }

    const getStateBadge = (state: string) => {
        let colorClass = "";
        switch (state.toLowerCase()) {
            case "open":
                colorClass = "bg-red-500/10 text-red-500 border-red-500/20";
                break;
            case "fixed":
                colorClass = "bg-green-500/10 text-green-500 border-green-500/20";
                break;
            case "false_positive":
                colorClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                break;
            case "accepted_risk":
                colorClass = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
                break;
            default:
                colorClass = "bg-gray-500/10 text-gray-500 border-gray-500/20";
        }
        return (
            <span className={clsx("px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border", colorClass)}>
                {state.replace(/_/g, " ")}
            </span>
        );
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">{finding.name}</h1>
                        <span className={clsx("px-3 py-1 rounded-md text-sm font-semibold uppercase tracking-wider", getSeverityColor(finding.severity))}>
                            {finding.severity}
                        </span>
                        {getStateBadge(finding.state)}
                    </div>
                    <p className="text-muted-foreground font-mono text-sm">{finding.host}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={deleteFinding}
                        className="flex items-center gap-2 px-4 py-2 rounded-md border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-medium text-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                    <button
                        onClick={() => router.back()} // Changed to router.back() for consistency
                        className="px-4 py-2 rounded-md border border-border hover:bg-accent transition-colors font-medium text-sm"
                    >
                        Back
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* Description */}
                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Description
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {finding.description || "No description provided."}
                        </p>
                    </div>

                    {/* Technical Details */}
                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            Technical Details
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-4 bg-accent/50 rounded-lg space-y-1">
                                <div className="text-xs text-muted-foreground uppercase font-bold">Matched At</div>
                                <code className="text-sm font-mono break-all text-primary">{finding.matched_at}</code>
                            </div>
                            <div className="p-4 bg-accent/50 rounded-lg space-y-1">
                                <div className="text-xs text-muted-foreground uppercase font-bold">Fingerprint</div>
                                <code className="text-xs font-mono break-all text-muted-foreground">{finding.fingerprint}</code>
                            </div>
                        </div>
                    </div>

                    {/* Raw Info */}
                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Tag className="w-5 h-5 text-primary" />
                            Metadata
                        </h2>
                        <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-xs font-mono text-green-400">
                            {JSON.stringify(infoObj, null, 2)}
                        </pre>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Timeline</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">First Seen</div>
                                    <div className="text-sm font-medium">{new Date(finding.first_seen).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Last Seen</div>
                                    <div className="text-sm font-medium">{new Date(finding.last_seen).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Actions</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => updateStatus("FALSE_POSITIVE")}
                                className="w-full py-2 px-4 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium text-left flex items-center gap-2"
                            >
                                <Shield className="w-4 h-4 text-green-500" />
                                Mark as False Positive
                            </button>
                            <button
                                onClick={() => updateStatus("ACCEPTED_RISK")}
                                className="w-full py-2 px-4 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium text-left flex items-center gap-2"
                            >
                                <Shield className="w-4 h-4 text-yellow-500" />
                                Mark as Accepted Risk
                            </button>
                            <button
                                onClick={() => updateStatus("FIXED")}
                                className="w-full py-2 px-4 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium text-left flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                Mark as Fixed
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );


}
