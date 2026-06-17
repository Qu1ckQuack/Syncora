'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateWorkOrder } from '@/lib/hooks/use-work-orders';
import { useUsers } from '@/lib/hooks/use-users';
import { useAuthStore } from '@/lib/auth-store';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewWorkOrderPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: customers } = useUsers('CUSTOMER');
  const createOrder = useCreateWorkOrder();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [customerId, setCustomerId] = useState('');
  const [location, setLocation] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [error, setError] = useState('');

  if (user?.role !== 'MODERATOR') {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Only moderators can create work orders.</p>
        <Link href="/dashboard/work-orders" className="text-sm text-syncora-500 hover:underline mt-2 inline-block">
          Back to Work Orders
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !customerId) {
      setError('Title and customer are required.');
      return;
    }

    createOrder.mutate(
      {
        title,
        description: description || undefined,
        priority,
        customerId,
        location: location || undefined,
        scheduledStart: scheduledStart || undefined,
      },
      {
        onSuccess: (order) => {
          router.push(`/dashboard/work-orders/${order.id}`);
        },
        onError: () => {
          setError('Failed to create work order. Please try again.');
        },
      },
    );
  };

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/work-orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Work Orders
      </Link>

      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-bold mb-6">New Work Order</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-syncora-500"
              placeholder="e.g. HVAC Repair"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-syncora-500 min-h-24 resize-y"
              placeholder="Describe the work to be done…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-syncora-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Customer *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-syncora-500"
              >
                <option value="">Select a customer…</option>
                {(customers ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-syncora-500"
              placeholder="e.g. 123 Main St, City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scheduled Start</label>
            <input
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-syncora-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={createOrder.isPending}
              className="rounded-md bg-syncora-500 px-6 py-2 text-sm font-medium text-white hover:bg-syncora-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {createOrder.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {createOrder.isPending ? 'Creating…' : 'Create Order'}
            </button>
            <Link
              href="/dashboard/work-orders"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
