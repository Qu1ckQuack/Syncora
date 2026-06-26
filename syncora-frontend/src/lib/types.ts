export type Role = 'HQ' | 'TECHNICIAN' | 'CUSTOMER' | 'DEALER';

export type TechnicianStatus = 'ONLINE' | 'BUSY' | 'OFFLINE';

export type WorkOrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EN_ROUTE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DELAYED'
  | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type EvidenceType = 'PHOTO' | 'VIDEO';

export type NotificationType =
  | 'JOB_ASSIGNED'
  | 'EN_ROUTE'
  | 'IN_PROGRESS'
  | 'DELAY_ALERT'
  | 'JOB_COMPLETED'
  | 'CANCELLED'
  | 'DEALER_ASSIGNMENT'
  | 'SYSTEM_ERROR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  technicianStatus: TechnicianStatus | null;
  avatarUrl: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    workOrdersAsTechnician?: number;
    workOrdersAsCustomer?: number;
  };
}

export interface Evidence {
  id: string;
  workOrderId: string;
  technicianId: string;
  url: string;
  type: EvidenceType;
  createdAt: string;
  technician?: Pick<User, 'id' | 'name'>;
}

export interface Rating {
  id: string;
  workOrderId: string;
  customerId: string;
  technicianId: string;
  score: number;
  comment: string | null;
  createdAt: string;
  customer?: Pick<User, 'id' | 'name'>;
  technician?: Pick<User, 'id' | 'name'>;
}

export interface Conversation {
  id: string;
  workOrderId: string;
  participantIds: string[];
  createdAt: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: Pick<User, 'id' | 'name' | 'role'>;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: Priority;
  technicianId: string | null;
  customerId: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  createdAt: string;
  updatedAt: string;
  technician?: { id: string; name: string } | null;
  customer?: { id: string; name: string; email: string } | null;
  statusHistory?: StatusHistory[];
}

export interface StatusHistory {
  id: string;
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus;
  changedById: string;
  workOrderId: string;
  note?: string | null;
  createdAt: string;
  changedBy?: Partial<User>;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  workOrderId: string | null;
  createdAt: string;
  workOrder?: { id: string; orderNumber: string; title: string } | null;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  email: boolean;
  push: boolean;
  status: boolean;
  assignment: boolean;
}

export interface TechnicianLocation {
  id: string;
  technicianId: string;
  workOrderId: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  technician?: { id: string; name: string };
}

export interface AnalyticsOverview {
  totalOrders: number;
  byStatus: Record<string, number>;
  pendingUrgent: number;
  completionRate: number;
  avgCompletionHours: number | null;
  unreadAlerts: number;
}

export interface CompletionTrend {
  date: string;
  count: number;
}

export interface TechnicianPerformance {
  technicianId: string;
  name: string;
  completed: number;
  avgTimeHours: number | null;
  activeOrders: number;
}

export interface AlertFrequency {
  type: NotificationType;
  count: number;
}
