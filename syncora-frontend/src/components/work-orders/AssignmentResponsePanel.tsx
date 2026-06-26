import { Check, X } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';

interface AssignmentResponsePanelProps {
  respondToAssignment: UseMutationResult<
    unknown,
    Error,
    { id: string; action: 'accept' | 'decline' }
  >;
  handleAssignmentResponse: (action: 'accept' | 'decline') => void;
}

export function AssignmentResponsePanel({
  respondToAssignment,
  handleAssignmentResponse,
}: AssignmentResponsePanelProps) {
  return (
    <div className="border-t border-border pt-4">
      <p className="text-sm font-semibold mb-2">Assignment Response</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleAssignmentResponse('accept')}
          disabled={respondToAssignment.isPending}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Accept
        </button>
        <button
          type="button"
          onClick={() => handleAssignmentResponse('decline')}
          disabled={respondToAssignment.isPending}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Decline
        </button>
        {respondToAssignment.isError && (
          <p className="basis-full text-xs text-red-500">
            {respondToAssignment.error?.message ??
              'Failed to update assignment'}
          </p>
        )}
      </div>
    </div>
  );
}
