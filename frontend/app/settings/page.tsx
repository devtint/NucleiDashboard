"use client";

import { Save, Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Configure global scan settings and preferences.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Scan Defaults */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        Scan Defaults
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rate Limit (Requests/sec)</label>
                            <input type="number" defaultValue={150} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Concurrency (Templates)</label>
                            <input type="number" defaultValue={25} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Retries</label>
                            <input type="number" defaultValue={1} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm" />
                        </div>
                    </div>
                </div>

                {/* API Configuration */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        API Configuration
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Interactsh Server</label>
                            <input type="text" defaultValue="oast.pro" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">API Key (Optional)</label>
                            <input type="password" placeholder="••••••••" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>
        </div>
    );
}
