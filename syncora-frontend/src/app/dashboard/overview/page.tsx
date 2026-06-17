export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Active Jobs</p>
          <p className="text-3xl font-bold mt-1">—</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Pending Alerts</p>
          <p className="text-3xl font-bold mt-1">—</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Online Technicians</p>
          <p className="text-3xl font-bold mt-1">—</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Completions Today</p>
          <p className="text-3xl font-bold mt-1">—</p>
        </div>
      </div>
    </div>
  );
}
