"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Download, Search, Shield, Trash2 } from "lucide-react";
import { clsx } from "clsx";

interface Finding {
    id: number;
    template_id: string;
    name: string;
    severity: string;
    host: string;
    state: string; // NEW, OPEN, FIXED, REGRESSED
    last_seen: string;
}

export default function FindingsPage() {
    const [findings, setFindings] = useState<Finding[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedSeverities, setSelectedSeverities] = useState<string[]>(["critical", "high", "medium", "low", "info", "unknown"]);

    useEffect(() => {
        fetch("http://127.0.0.1:3001/api/findings", { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                setFindings(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch findings:", err);
                setIsLoading(false);
            });
    }, []);

    const toggleSeverity = (severity: string) => {
        setSelectedSeverities(prev =>
            prev.includes(severity)
                ? prev.filter(s => s !== severity)
                : [...prev, severity]
        );
    };

    const deleteFinding = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this finding?")) {
            fetch(`http://127.0.0.1:3001/api/findings/${id}`, {
                method: "DELETE",
                credentials: "include",
            })
                .then((res) => {
                    if (res.ok) {
                        setFindings(prev => prev.filter(f => f.id !== id));
                    } else {
                        alert("Failed to delete finding");
                    }
                })
                .catch((err) => console.error("Failed to delete finding:", err));
        }
    };

    const filteredFindings = findings.filter((f) => {
        const matchesSearch =
            f.name.toLowerCase().includes(search.toLowerCase()) ||
            f.template_id.toLowerCase().includes(search.toLowerCase()) ||
            f.host.toLowerCase().includes(search.toLowerCase());

        const matchesSeverity = selectedSeverities.includes(f.severity.toLowerCase());

        return matchesSearch && matchesSeverity;
    });

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case "critical": return "text-red-600 bg-red-100 dark:bg-red-900/20";
            case "high": return "text-orange-600 bg-orange-100 dark:bg-orange-900/20";
            case "medium": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
            case "low": return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
            default: return "text-gray-600 bg-gray-100 dark:bg-gray-800";
        }
    };

    const getStateBadge = (state: string) => {
        switch (state) {
            case "NEW": return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">NEW</span>;
            case "OPEN": return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">OPEN</span>;
            case "FIXED": return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">FIXED</span>;
            case "REGRESSED": return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">REGRESSED</span>;
            case "FALSE_POSITIVE": return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-500 border border-gray-500/20">FALSE POSITIVE</span>;
            case "ACCEPTED_RISK": return <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">ACCEPTED RISK</span>;
            default: return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-500 border border-gray-500/20">{state}</span>;
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Findings</h1>
                    <p className="text-muted-foreground mt-1">
                        Vulnerabilities detected across your infrastructure.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <a
                        href="http://localhost:3001/api/export"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </a>
                    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                        <span className="text-xs font-medium text-muted-foreground mr-2">Severity:</span>
                        {["critical", "high", "medium", "low", "info"].map((sev) => (
                            <label key={sev} className="flex items-center gap-1.5 text-sm cursor-pointer hover:text-foreground transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedSeverities.includes(sev)}
                                    onChange={() => toggleSeverity(sev)}
                                    className="rounded border-muted-foreground/30 text-primary focus:ring-primary/50"
                                />
                                <span className="capitalize">{sev}</span>
                            </label>
                        ))}
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search findings..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-accent/50 text-muted-foreground font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Severity</th>
                            <th className="px-6 py-4">Vulnerability</th>
                            <th className="px-6 py-4">Host</th>
                            <th className="px-6 py-4">State</th>
                            <th className="px-6 py-4">Last Seen</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                    Loading findings...
                                </td>
                            </tr>
                        ) : filteredFindings.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                    No findings found.
                                </td>
                            </tr>
                        ) : (
                            filteredFindings.map((finding) => (
                                <tr
                                    key={finding.id}
                                    onClick={() => window.location.href = `/findings/${finding.id}`}
                                    className="hover:bg-accent/30 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <span className={clsx("px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider", getSeverityColor(finding.severity))}>
                                            {finding.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground">{finding.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono mt-1">{finding.template_id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                                        {finding.host}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStateBadge(finding.state)}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {new Date(finding.last_seen).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={(e) => deleteFinding(finding.id, e)}
                                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                            title="Delete Finding"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
