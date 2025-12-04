"use client";

import { Activity, Shield, Zap, AlertTriangle, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";

// Assuming StatCard component is defined elsewhere or will be added.
// For the purpose of this change, we'll assume it's a functional component
// that accepts title, value, change, icon, and trend props.
// If StatCard is not defined, this code will result in a runtime error.
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
}

function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  let iconColorClass = "text-primary";
  if (trend === "up") iconColorClass = "text-green-500";
  if (trend === "down") iconColorClass = "text-red-500";
  if (trend === "neutral") iconColorClass = "text-gray-500";

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
        {Icon && <Icon className={`w-4 h-4 ${iconColorClass}`} />}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{change}</p>
    </div>
  );
}


export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_vulnerabilities: 0,
    active_scans: 0,
    critical_issues: 0,
    recent_scans: [] as any[],
    critical_findings: [] as any[],
  });

  useEffect(() => {
    const fetchStats = () => {
      fetch("http://localhost:3001/api/stats")
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch((err) => console.error("Failed to fetch stats:", err));
    };

    fetchStats(); // Initial fetch
    const interval = setInterval(fetchStats, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your security posture and recent scans.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Vulnerabilities"
          value={stats.total_vulnerabilities.toLocaleString()}
          change="+12% from last week"
          icon={Shield}
          trend="up"
        />
        <StatCard
          title="Active Scans"
          value={stats.active_scans.toString()}
          change="Currently processing"
          icon={Activity}
          trend="neutral"
        />
        <StatCard
          title="Critical Issues"
          value={stats.critical_issues.toString()}
          change="Requires immediate attention"
          icon={AlertTriangle}
          trend="down"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Scans</h3>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {stats.recent_scans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scans found.</p>
            ) : (
              stats.recent_scans.map((scan: any) => (
                <div key={scan.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{scan.target}</p>
                    <p className="text-xs text-muted-foreground">{new Date(scan.created_at).toLocaleString()}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${scan.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      scan.status === 'running' ? 'bg-blue-500/10 text-blue-500' :
                        scan.status === 'stopped' ? 'bg-gray-500/10 text-gray-500' :
                          'bg-red-500/10 text-red-500'
                    }`}>
                    {scan.status.toUpperCase()}
                    {scan.status === 'running' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetch(`http://localhost:3001/api/scan/${scan.id}/stop`, { method: 'POST' })
                            .then(res => {
                              if (!res.ok) throw new Error('Failed to stop scan');
                              // Optimistically update UI or let polling handle it
                            })
                            .catch(err => console.error(err));
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        title="Stop Scan"
                      >
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Critical Issues */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Top Critical Issues</h3>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {stats.critical_findings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No critical issues found. Great job!</p>
            ) : (
              stats.critical_findings.map((finding: any) => (
                <div key={finding.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                  <div className="max-w-[70%]">
                    <p className="font-medium text-sm truncate" title={finding.name}>{finding.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{finding.host}</p>
                  </div>
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                    {finding.severity.toUpperCase()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
