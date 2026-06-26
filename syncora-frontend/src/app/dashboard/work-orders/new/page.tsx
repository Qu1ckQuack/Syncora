'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCreateWorkOrder } from '@/lib/hooks/use-work-orders';
import { useUsers } from '@/lib/hooks/use-users';
import { useAuthStore } from '@/lib/auth-store';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { WORK_TYPES } from '@/lib/work-types';

const LocationPicker = dynamic(
  () => import('@/components/map/location-picker').then((m) => m.LocationPicker),
  { ssr: false },
);

export default function NewWorkOrderPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: customers } = useUsers('CUSTOMER');
  const createOrder = useCreateWorkOrder();

  const [workType, setWorkType] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [customerId, setCustomerId] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [scheduledStart, setScheduledStart] = useState('');
  const [error, setError] = useState('');

  const title = workType === 'Other…' ? customTitle : workType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title) {
      setError('Title is required.');
      return;
    }

    if (user?.role !== 'HQ' && user?.role !== 'CUSTOMER' && !customerId) {
      setError('Customer is required.');
      return;
    }

    createOrder.mutate(
      {
        title,
        description: description || undefined,
        priority,
        customerId: user?.role === 'CUSTOMER' ? user.id : customerId,
        location: location || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
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
            <label className="block text-sm font-medium mb-1">Work Type *</label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-syncora-500"
            >
              <option value="">Select a work type…</option>
              {WORK_TYPES.map((wt) => (
                <option key={wt.value} value={wt.value}>{wt.label}</option>
              ))}
            </select>
          </div>

          {workType === 'Other…' && (
            <div>
              <label className="block text-sm font-medium mb-1">Custom Title *</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-syncora-500"
                placeholder="Describe the work…"
              />
            </div>
          )}

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

            {user?.role !== 'CUSTOMER' ? (
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
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <input
                  type="text"
                  value={user?.name ?? ''}
                  disabled
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-syncora-500"
                placeholder="e.g. 123 Main St, City"
              />
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className={cn(
                  'px-3 py-2 rounded-md border text-sm transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center',
                  showMap
                    ? 'bg-syncora-500 text-white border-syncora-500'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
                aria-label={showMap ? 'Hide map picker' : 'Show map picker'}
              >
                <MapPin className="h-4 w-4" />
              </button>
            </div>
            {showMap && (
              <div className="mt-2">
                <LocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  onLocationChange={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />
              </div>
            )}
            {(latitude != null && longitude != null) && (
              <p className="text-xs text-muted-foreground mt-1">
                Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                <button
                  type="button"
                  onClick={() => { setLatitude(null); setLongitude(null); }}
                  className="ml-2 text-syncora-500 hover:underline"
                >
                  Clear
                </button>
              </p>
            )}
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
              disabled={createOrder.isPending || !title}
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
