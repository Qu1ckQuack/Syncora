import type { UseMutationResult } from '@tanstack/react-query';
import type { WorkOrderStatus } from '@/lib/types';

const statusLabel = (status: string) =>
  status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

interface StatusUpdatePanelProps {
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  validTransitions: WorkOrderStatus[];
  updateStatus: UseMutationResult<
    unknown,
    Error,
    { id: string; status: string }
  >;
  handleStatusUpdate: () => void;
}

export function StatusUpdatePanel({
  selectedStatus,
  setSelectedStatus,
  validTransitions,
  updateStatus,
  handleStatusUpdate,
}: StatusUpdatePanelProps) {
  return (
    <div className="border-t border-border pt-4">
      <p className="text-sm font-semibold mb-2">Update Status</p>
      <div className="flex items-center gap-2">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-syncora-500"
        >
          <option value="">Select status\u2026</option>
          {validTransitions.map((s) => (
            <option key={s} value={s}>
              {s === 'CANCELLED' ? 'Cancel' : statusLabel(s)}
            </option>
          ))}
        </select>
        <button
          onClick={handleStatusUpdate}
          disabled={!selectedStatus || updateStatus.isPending}
          className="rounded-md bg-syncora-500 px-4 py-2 text-sm font-medium text-white hover:bg-syncora-600 transition-colors disabled:opacity-50"
        >
          {updateStatus.isPending ? 'Updating\u2026' : 'Update'}
        </button>
        {updateStatus.isError && (
          <p className="text-xs text-red-500">
            {updateStatus.error?.message ?? 'Failed to update status'}
          </p>
        )}
      </div>
    </div>
  );
}
