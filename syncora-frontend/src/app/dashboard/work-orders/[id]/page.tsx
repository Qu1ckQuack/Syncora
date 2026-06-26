'use client';

import { use, useMemo, useRef, useState } from 'react';
import {
  useRespondToAssignment,
  useWorkOrder,
  useUpdateStatus,
} from '@/lib/hooks/use-work-orders';
import { useEvidence, useUploadEvidence } from '@/lib/hooks/use-evidence';
import { useAuthStore } from '@/lib/auth-store';
import { StatusPill } from '@/components/shared/StatusPill';
import { ProgressTracker } from '@/components/shared/ProgressTracker';
import { CardSkeleton } from '@/components/shared/Skeleton';
import { DetailField } from '@/components/shared/DetailField';
import { EvidenceGallery } from '@/components/work-orders/EvidenceGallery';
import { AssignmentResponsePanel } from '@/components/work-orders/AssignmentResponsePanel';
import { StatusUpdatePanel } from '@/components/work-orders/StatusUpdatePanel';
import { StatusHistoryTimeline } from '@/components/work-orders/StatusHistoryTimeline';
import { getValidTransitions } from '@/lib/status-transitions';
import {
  ArrowLeft,
  Camera,
  Clock,
  ImageIcon,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import type { WorkOrderStatus } from '@/lib/types';

const evidenceUploadStatuses: WorkOrderStatus[] = [
  'ACCEPTED',
  'EN_ROUTE',
  'IN_PROGRESS',
  'DELAYED',
];

export default function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const user = useAuthStore((s) => s.user);
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkOrder(id);
  const updateStatus = useUpdateStatus();
  const respondToAssignment = useRespondToAssignment();
  const uploadEvidence = useUploadEvidence();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  const validTransitions = useMemo(
    () =>
      order
        ? getValidTransitions(order.status, user?.role ?? 'CUSTOMER')
        : [],
    [order, user?.role],
  );

  const isModerator = user?.role === 'HQ';
  const isAssignedTechnician =
    user?.role === 'TECHNICIAN' && order?.technicianId === user.id;
  const canUpdateStatus = isModerator || isAssignedTechnician;
  const canRespondToAssignment =
    isAssignedTechnician && order?.status === 'PENDING';
  const canUploadEvidence =
    isAssignedTechnician &&
    !!order &&
    evidenceUploadStatuses.includes(order.status);
  const { data: evidence, isLoading: evidenceLoading } = useEvidence(
    id,
    !!order && (canUpdateStatus || user?.role === 'CUSTOMER'),
  );

  if (isLoading) return <CardSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-red-500 font-medium">Failed to load work order</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error?.message ?? 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-md bg-syncora-500 px-4 py-2 text-sm font-medium text-white hover:bg-syncora-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!order)
    return <p className="text-muted-foreground">Work order not found.</p>;

  const handleStatusUpdate = () => {
    if (!selectedStatus) return;
    updateStatus.mutate(
      { id, status: selectedStatus },
      { onSuccess: () => setSelectedStatus('') },
    );
  };

  const handleAssignmentResponse = (action: 'accept' | 'decline') => {
    respondToAssignment.mutate({ id, action });
  };

  const handleEvidenceUpload = (file: File | undefined) => {
    if (!file) return;
    uploadEvidence.mutate(
      { workOrderId: id, file },
      {
        onSuccess: () => {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      },
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/dashboard/work-orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Work Orders
      </Link>

      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-mono">
              {order.orderNumber}
            </p>
            <h1 className="text-xl font-bold mt-1">{order.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={order.status} />
            <StatusPill status={order.priority} variant="priority" />
          </div>
        </div>

        {user?.role === 'CUSTOMER' && (
          <ProgressTracker status={order.status} />
        )}

        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          {order.description && (
            <DetailField
              icon={<ImageIcon className="h-3.5 w-3.5" />}
              label="Description"
              value={order.description}
              className="sm:col-span-2"
            />
          )}
          <DetailField
            icon={<User className="h-3.5 w-3.5" />}
            label="Customer"
            value={order.customer?.name ?? '\u2014'}
          />
          <DetailField
            icon={<User className="h-3.5 w-3.5" />}
            label="Technician"
            value={order.technician?.name ?? '\u2014'}
          />
          {order.location && (
            <DetailField
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Location"
              value={order.location}
            />
          )}
          {order.scheduledStart && (
            <DetailField
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Scheduled"
              value={new Date(
                order.scheduledStart,
              ).toLocaleDateString()}
            />
          )}
          {order.actualEnd && (
            <DetailField
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Completed"
              value={new Date(order.actualEnd).toLocaleDateString()}
            />
          )}
          <DetailField
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Created"
            value={new Date(order.createdAt).toLocaleDateString()}
          />
        </div>

        {canRespondToAssignment && (
          <AssignmentResponsePanel
            respondToAssignment={respondToAssignment}
            handleAssignmentResponse={handleAssignmentResponse}
          />
        )}

        {canUpdateStatus && !canRespondToAssignment && (
          <StatusUpdatePanel
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            validTransitions={validTransitions}
            updateStatus={updateStatus}
            handleStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>

      {(canUpdateStatus || user?.role === 'CUSTOMER') && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Proof of Repair</h2>
              <p className="text-xs text-muted-foreground">
                Photos and videos uploaded by the assigned technician.
              </p>
            </div>
            {canUploadEvidence && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    handleEvidenceUpload(event.target.files?.[0])
                  }
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadEvidence.isPending}
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md bg-syncora-500 px-4 text-sm font-medium text-white transition-colors hover:bg-syncora-600 disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  {uploadEvidence.isPending
                    ? 'Uploading...'
                    : 'Add Photo'}
                </button>
              </>
            )}
          </div>
          {uploadEvidence.isError && (
            <p className="text-xs text-red-500">
              {uploadEvidence.error?.message ??
                'Failed to upload evidence'}
            </p>
          )}
          <EvidenceGallery
            evidence={evidence}
            isLoading={evidenceLoading}
          />
        </div>
      )}

      {order.statusHistory && order.statusHistory.length > 0 && (
        <StatusHistoryTimeline entries={order.statusHistory} />
      )}
    </div>
  );
}
