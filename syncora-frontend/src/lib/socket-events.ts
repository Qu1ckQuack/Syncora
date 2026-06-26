export const SOCKET_EVENTS = {
  STATUS_CHANGED: 'workOrder.statusChanged',
  ASSIGNED: 'workOrder.assigned',
  PROOF_UPLOADED: 'workOrder.evidenceAdded',
  RATING_SUBMITTED: 'rating.submitted',
  DEALER_ASSIGNMENT: 'workOrder.dealerAssigned',
  NEW_MESSAGE: 'chat.message',
  NOTIFICATION_NEW: 'notification.new',
  LOCATION_UPDATE: 'location.update',
} as const;
