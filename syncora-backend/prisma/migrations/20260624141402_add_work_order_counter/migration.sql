-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "NotificationType" ADD VALUE 'CANCELLED';

-- CreateTable
CREATE TABLE "work_order_counters" (
    "id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,

    CONSTRAINT "work_order_counters_pkey" PRIMARY KEY ("id")
);
