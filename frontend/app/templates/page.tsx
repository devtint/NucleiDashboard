"use client";

import { Search, Terminal, FileText, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Template {
    name: string;
    path: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch("http://127.0.0.1:3001/api/templates", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                setTemplates(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
                    <p className="text-muted-foreground mt-1">
                        Browse and manage Nuclei scanning templates.
                    </p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="text-center text-muted-foreground">Loading templates...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.slice(0, 50).map((template, i) => ( // Limit to 50 for performance
                        <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Terminal className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="font-semibold text-sm mb-2 break-all">{template.name}</h3>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => router.push(`/scan?template=${encodeURIComponent(template.path)}`)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-medium"
                                >
                                    <Play className="w-3 h-3" />
                                    Use
                                </button>
                                {/* View Content Button could go here */}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
