import { PrismaClient, Role, WorkOrderStatus, Priority, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const seedPassword = process.env.SEED_PASSWORD || 'dev-password-change-me';
  if (!process.env.SEED_PASSWORD && process.env.NODE_ENV === 'production') {
    throw new Error('SEED_PASSWORD environment variable must be set in production');
  }
  const hash = await bcrypt.hash(seedPassword, 10);

  const hq = await prisma.user.upsert({
    where: { email: 'hq@syncora.dev' },
    update: {},
    create: {
      email: 'hq@syncora.dev',
      passwordHash: hash,
      name: 'Alice HQ',
      role: Role.HQ,
      phone: '+1 555 0100',
      address: '100 Syncora HQ',
    },
  });

  const dealer = await prisma.user.upsert({
    where: { email: 'dealer@syncora.dev' },
    update: {},
    create: {
      email: 'dealer@syncora.dev',
      passwordHash: hash,
      name: 'Dana Dealer',
      role: Role.DEALER,
      phone: '+1 555 0103',
      address: '300 Dealer Ave',
    },
  });

  const tech1 = await prisma.user.upsert({
    where: { email: 'tech1@syncora.dev' },
    update: {},
    create: {
      email: 'tech1@syncora.dev',
      passwordHash: hash,
      name: 'Bob Technician',
      role: Role.TECHNICIAN,
      technicianStatus: 'ONLINE',
      phone: '+1 555 0101',
      address: '200 Field Service Rd',
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: 'tech2@syncora.dev' },
    update: {},
    create: {
      email: 'tech2@syncora.dev',
      passwordHash: hash,
      name: 'Carol Technician',
      role: Role.TECHNICIAN,
      technicianStatus: 'BUSY',
      phone: '+1 555 0102',
      address: '201 Field Service Rd',
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: 'customer1@syncora.dev' },
    update: {},
    create: {
      email: 'customer1@syncora.dev',
      passwordHash: hash,
      name: 'Dave Customer',
      role: Role.CUSTOMER,
      phone: '+1 555 0201',
      address: '123 Main St, Suite 300',
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'customer2@syncora.dev' },
    update: {},
    create: {
      email: 'customer2@syncora.dev',
      passwordHash: hash,
      name: 'Eve Customer',
      role: Role.CUSTOMER,
      phone: '+1 555 0202',
      address: '456 Oak Ave',
    },
  });

  const now = new Date();
  const day = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d;
  };

  const orders = [
    {
      orderNumber: 'SYN-1001',
      title: 'HVAC Repair - Office Building',
      description: 'AC unit on floor 3 is not cooling. Check refrigerant levels.',
      status: WorkOrderStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      customerId: customer1.id,
      technicianId: tech1.id,
      location: '123 Main St, Suite 300',
      scheduledStart: day(0),
      scheduledEnd: day(0),
      actualStart: day(0),
      statusHistory: [
        { fromStatus: null, toStatus: WorkOrderStatus.PENDING, note: 'Order created' },
        { fromStatus: WorkOrderStatus.PENDING, toStatus: WorkOrderStatus.EN_ROUTE, note: 'Technician dispatched' },
        { fromStatus: WorkOrderStatus.EN_ROUTE, toStatus: WorkOrderStatus.IN_PROGRESS, note: 'Arrived on site' },
      ],
    },
    {
      orderNumber: 'SYN-1002',
      title: 'Electrical Wiring - Residential',
      description: 'New circuit breaker panel installation in basement.',
      status: WorkOrderStatus.PENDING,
      priority: Priority.MEDIUM,
      customerId: customer2.id,
      technicianId: null,
      location: '456 Oak Ave',
      scheduledStart: day(1),
      scheduledEnd: day(1),
      statusHistory: [
        { fromStatus: null, toStatus: WorkOrderStatus.PENDING, note: 'Order created' },
      ],
    },
    {
      orderNumber: 'SYN-1003',
      title: 'Plumbing Leak - Kitchen',
      description: 'Pipe under sink is leaking. Requires urgent repair.',
      status: WorkOrderStatus.EN_ROUTE,
      priority: Priority.URGENT,
      customerId: customer1.id,
      technicianId: tech2.id,
      location: '789 Pine Rd, Apt 4B',
      scheduledStart: day(0),
      scheduledEnd: day(0),
      statusHistory: [
        { fromStatus: null, toStatus: WorkOrderStatus.PENDING, note: 'Order created' },
        { fromStatus: WorkOrderStatus.PENDING, toStatus: WorkOrderStatus.EN_ROUTE, note: 'Technician dispatched urgently' },
      ],
    },
    {
      orderNumber: 'SYN-1004',
      title: 'Router Installation - Small Business',
      description: 'Set up new network infrastructure for retail store.',
      status: WorkOrderStatus.COMPLETED,
      priority: Priority.LOW,
      customerId: customer2.id,
      technicianId: tech1.id,
      location: '321 Market St',
      scheduledStart: day(-2),
      scheduledEnd: day(-2),
      actualStart: day(-2),
      actualEnd: day(-2),
      statusHistory: [
        { fromStatus: null, toStatus: WorkOrderStatus.PENDING, note: 'Order created' },
        { fromStatus: WorkOrderStatus.PENDING, toStatus: WorkOrderStatus.EN_ROUTE, note: 'Technician dispatched' },
        { fromStatus: WorkOrderStatus.EN_ROUTE, toStatus: WorkOrderStatus.IN_PROGRESS, note: 'Work started' },
        { fromStatus: WorkOrderStatus.IN_PROGRESS, toStatus: WorkOrderStatus.COMPLETED, note: 'Installation complete' },
      ],
    },
    {
      orderNumber: 'SYN-1005',
      title: 'Security Camera Setup',
      description: 'Install 4 outdoor cameras and configure monitoring app.',
      status: WorkOrderStatus.DELAYED,
      priority: Priority.MEDIUM,
      customerId: customer1.id,
      technicianId: tech2.id,
      location: '123 Main St, Suite 300',
      scheduledStart: day(-1),
      scheduledEnd: day(-1),
      statusHistory: [
        { fromStatus: null, toStatus: WorkOrderStatus.PENDING, note: 'Order created' },
        { fromStatus: WorkOrderStatus.PENDING, toStatus: WorkOrderStatus.EN_ROUTE, note: 'Technician dispatched' },
        { fromStatus: WorkOrderStatus.EN_ROUTE, toStatus: WorkOrderStatus.IN_PROGRESS, note: 'Work started' },
        {
          fromStatus: WorkOrderStatus.IN_PROGRESS,
          toStatus: WorkOrderStatus.DELAYED,
          note: 'Additional parts needed, ordered',
        },
      ],
    },
    {
      orderNumber: 'SYN-1006',
      title: 'Smart Thermostat Upgrade',
      description: 'Replace old thermostat with new smart model.',
      status: WorkOrderStatus.PENDING,
      priority: Priority.LOW,
      customerId: customer2.id,
      technicianId: null,
      location: '456 Oak Ave',
      scheduledStart: day(3),
      scheduledEnd: day(3),
      statusHistory: [
        { fromStatus: null, toStatus: WorkOrderStatus.PENDING, note: 'Order created' },
      ],
    },
  ];

  for (const order of orders) {
    const { statusHistory, ...orderData } = order;

    const created = await prisma.workOrder.upsert({
      where: { orderNumber: orderData.orderNumber },
      update: {},
      create: orderData,
    });

    const baseTime = orderData.scheduledStart?.getTime() ?? Date.now();
    for (const [index, entry] of statusHistory.entries()) {
      await prisma.statusHistory.create({
        data: {
          workOrderId: created.id,
          fromStatus: entry.fromStatus ?? undefined,
          toStatus: entry.toStatus,
          changedById: entry.toStatus === WorkOrderStatus.PENDING ? hq.id : (orderData.technicianId ?? hq.id),
          note: entry.note,
          createdAt: new Date(baseTime - (statusHistory.length - index) * 3600000),
        },
      });
    }
  }

  const allOrders = await prisma.workOrder.findMany();

  const notifications = [
    { userId: tech1.id, type: NotificationType.JOB_ASSIGNED, title: 'New Job Assigned', message: 'HVAC Repair - Office Building has been assigned to you.', workOrderId: allOrders.find(o => o.orderNumber === 'SYN-1001')!.id },
    { userId: tech2.id, type: NotificationType.JOB_ASSIGNED, title: 'New Job Assigned', message: 'Plumbing Leak - Kitchen has been assigned to you.', workOrderId: allOrders.find(o => o.orderNumber === 'SYN-1003')!.id },
    { userId: customer1.id, type: NotificationType.EN_ROUTE, title: 'Technician En Route', message: 'Bob Technician is on the way for HVAC Repair.', workOrderId: allOrders.find(o => o.orderNumber === 'SYN-1001')!.id },
    { userId: customer1.id, type: NotificationType.DELAY_ALERT, title: 'Job Delayed', message: 'Security Camera Setup is delayed due to missing parts.', workOrderId: allOrders.find(o => o.orderNumber === 'SYN-1005')!.id },
    { userId: customer2.id, type: NotificationType.JOB_COMPLETED, title: 'Job Completed', message: 'Router Installation was completed successfully.', workOrderId: allOrders.find(o => o.orderNumber === 'SYN-1004')!.id },
  ];

  await prisma.notification.deleteMany({});
  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }

  const auditEntries = [
    { action: 'LOGIN', entityType: 'USER', entityId: hq.id, userId: hq.id },
    { action: 'LOGIN', entityType: 'USER', entityId: dealer.id, userId: dealer.id },
    { action: 'LOGIN', entityType: 'USER', entityId: tech1.id, userId: tech1.id },
    { action: 'LOGIN', entityType: 'USER', entityId: customer1.id, userId: customer1.id },
    { action: 'WORK_ORDER_CREATED', entityType: 'WORK_ORDER', entityId: allOrders.find(o => o.orderNumber === 'SYN-1001')!.id, userId: hq.id },
    { action: 'WORK_ORDER_CREATED', entityType: 'WORK_ORDER', entityId: allOrders.find(o => o.orderNumber === 'SYN-1002')!.id, userId: hq.id },
    { action: 'ASSIGNMENT', entityType: 'WORK_ORDER', entityId: allOrders.find(o => o.orderNumber === 'SYN-1001')!.id, userId: hq.id, metadata: { technicianId: tech1.id } },
    { action: 'ASSIGNMENT', entityType: 'WORK_ORDER', entityId: allOrders.find(o => o.orderNumber === 'SYN-1003')!.id, userId: hq.id, metadata: { technicianId: tech2.id } },
    { action: 'STATUS_UPDATE', entityType: 'WORK_ORDER', entityId: allOrders.find(o => o.orderNumber === 'SYN-1004')!.id, userId: tech1.id, metadata: { from: 'IN_PROGRESS', to: 'COMPLETED' } },
  ];

  await prisma.auditLog.deleteMany({});
  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }

  const allUsers = await prisma.user.findMany();
  for (const u of allUsers) {
    await prisma.notificationPreference.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id },
    });
  }

  await prisma.workOrderCounter.upsert({
    where: { id: 'order_seq' },
    update: { seq: 1006 },
    create: { id: 'order_seq', seq: 1006 },
  });

  console.log('Seed completed successfully');
  console.log(`  Users: ${await prisma.user.count()}`);
  console.log(`  Work Orders: ${await prisma.workOrder.count()}`);
  console.log(`  Status History: ${await prisma.statusHistory.count()}`);
  console.log(`  Notifications: ${await prisma.notification.count()}`);
  console.log(`  Notification Preferences: ${await prisma.notificationPreference.count()}`);
  console.log(`  Audit Logs: ${await prisma.auditLog.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
