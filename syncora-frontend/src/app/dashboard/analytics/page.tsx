'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAnalyticsOverview, useCompletionTrend, useTechnicianPerformance, useAlertFrequency } from '@/lib/hooks/use-analytics';
import { useAuthStore } from '@/lib/auth-store';
import { StatCards } from '@/components/shared/StatCards';
import { TableSkeleton, CardSkeleton } from '@/components/shared/Skeleton';
import { ClipboardList, Wrench, CheckCircle2, AlertTriangle, Users, Clock } from 'lucide-react';

type Period = 7 | 30 | 90;
type Granularity = 'daily' | 'weekly';

const periodOptions: { label: string; value: Period }[] = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const granularityOptions: { label: string; value: Granularity }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const [days, setDays] = useState<Period>(30);
  const [granularity, setGranularity] = useState<Granularity>('daily');

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: trend, isLoading: trendLoading } = useCompletionTrend(days, granularity);
  const { data: techs, isLoading: techsLoading } = useTechnicianPerformance();
  const { data: alerts, isLoading: alertsLoading } = useAlertFrequency(days);

  const isModerator = user?.role === 'MODERATOR';

  const overviewStats = overview
    ? [
        { title: 'Total Orders', value: overview.totalOrders, icon: ClipboardList, color: 'purple' as const },
        { title: 'In Progress', value: Object.entries(overview.byStatus).filter(([k]) => k === 'IN_PROGRESS' || k === 'EN_ROUTE').reduce((a, [, v]) => a + v, 0), icon: Wrench, color: 'blue' as const },
        { title: 'Completed', value: Object.entries(overview.byStatus).find(([k]) => k === 'COMPLETED')?.[1] ?? 0, icon: CheckCircle2, color: 'green' as const, trend: { value: overview.completionRate, positive: true } },
        { title: 'Pending Urgent', value: overview.pendingUrgent, icon: AlertTriangle, color: 'red' as const },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Operational metrics and performance data
        </p>
      </div>

      <StatCards stats={overviewStats} loading={overviewLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold">Completion Trend</h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-border overflow-hidden">
                {granularityOptions.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGranularity(g.value)}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                      granularity === g.value
                        ? 'bg-syncora-500 text-white'
                        : 'bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <div className="flex rounded-md border border-border overflow-hidden">
                {periodOptions.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setDays(p.value)}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                      days === p.value
                        ? 'bg-syncora-500 text-white'
                        : 'bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {trendLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <CardSkeleton />
            </div>
          ) : !trend?.length ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
              No completed orders in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  labelFormatter={(label) => (typeof label === 'string' ? formatDate(label) : label)}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="count" fill="#7B2FF7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-semibold mb-6">Alert Frequency</h2>
          {alertsLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <CardSkeleton />
            </div>
          ) : !alerts?.length ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
              No alerts in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={alerts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis
                  type="category"
                  dataKey="type"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  width={120}
                  tickFormatter={(v: string) => v.replace(/_/g, ' ')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value, name) => [value, name === 'count' ? 'Count' : name]}
                  labelFormatter={(label) => (typeof label === 'string' ? label.replace(/_/g, ' ') : label)}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {isModerator && (
        <div className="rounded-lg border border-border bg-card">
          <div className="p-6 pb-0">
            <h2 className="text-sm font-semibold">Technician Performance</h2>
          </div>
          {techsLoading ? (
            <div className="p-6">
              <TableSkeleton rows={4} />
            </div>
          ) : !techs?.length ? (
            <div className="p-6 text-sm text-muted-foreground">
              No technicians found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Technician</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Completed</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Avg Time (hrs)</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Active Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {techs.map((tech) => (
                    <tr key={tech.technicianId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span className="font-medium">{tech.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">{tech.completed}</span>
                      </td>
                      <td className="px-6 py-4">
                        {tech.avgTimeHours != null ? (
                          <span className="font-mono text-sm">{tech.avgTimeHours}h</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">{tech.activeOrders}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
