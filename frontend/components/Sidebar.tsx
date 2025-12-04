"use client";

import { LayoutDashboard, Radar, ShieldAlert, Settings, Terminal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "New Scan", href: "/scan", icon: Radar },
    { name: "Findings", href: "/findings", icon: ShieldAlert },
    { name: "Templates", href: "/templates", icon: Terminal },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 h-screen bg-card border-r border-border flex flex-col">
            <div className="p-6 border-b border-border">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-primary" />
                    Nuclei<span className="text-primary">Dash</span>
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <div className="bg-accent/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Nuclei Version</p>
                    <p className="text-sm font-mono font-semibold">v3.2.0</p>
                </div>
            </div>
        </div>
    );
}
