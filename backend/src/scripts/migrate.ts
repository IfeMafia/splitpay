import { prisma } from '../lib/prisma';

const statements = [
  `CREATE TYPE "PoolStatus" AS ENUM ('ACTIVE', 'ARCHIVED')`,
  `CREATE TYPE "PoolRole" AS ENUM ('OWNER', 'MEMBER')`,
  `CREATE TYPE "InvitationType" AS ENUM ('CODE', 'EMAIL')`,
  `CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')`,
  `CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED')`,
  `CREATE TYPE "SplitType" AS ENUM ('EQUAL', 'CUSTOM')`,
  `CREATE TYPE "AllocationStatus" AS ENUM ('ALLOCATED', 'WITHDRAWN')`,
  `CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'REVERSED')`,

  `CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "default_currency" TEXT NOT NULL DEFAULT 'NGN',
    "country" TEXT DEFAULT 'NG',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens"("token")`,

  `CREATE TABLE IF NOT EXISTS "pools" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "pool_members" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "PoolRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pool_members_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "pool_invitations" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "inviter_id" TEXT NOT NULL,
    "type" "InvitationType" NOT NULL DEFAULT 'CODE',
    "code" TEXT,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pool_invitations_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "payment_links" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_links_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "transactions" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "payment_link_id" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "provider" TEXT NOT NULL DEFAULT 'paystack',
    "provider_reference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payer_email" TEXT,
    "payer_name" TEXT,
    "metadata" JSONB,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "transaction_events" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_events_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "split_configurations" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "type" "SplitType" NOT NULL DEFAULT 'EQUAL',
    "configuration" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "split_configurations_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "split_snapshots" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "type" "SplitType" NOT NULL,
    "snapshot_data" JSONB NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "distributable_amount" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "split_snapshots_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "split_allocations" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "pool_member_id" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "AllocationStatus" NOT NULL DEFAULT 'ALLOCATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "split_allocations_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "withdrawals" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "pool_member_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "provider_reference" TEXT,
    "bank_code" TEXT,
    "account_number" TEXT,
    "account_name" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "withdrawal_events" (
    "id" TEXT NOT NULL,
    "withdrawal_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "withdrawal_events_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "ledger_accounts" (
    "id" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "pool_id" TEXT,
    "pool_member_id" TEXT,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "ledger_entries" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
  )`,

  // Constraints & Indexes
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")`,
  `CREATE INDEX IF NOT EXISTS "pools_owner_id_idx" ON "pools"("owner_id")`,
  `CREATE INDEX IF NOT EXISTS "pool_members_pool_id_idx" ON "pool_members"("pool_id")`,
  `CREATE INDEX IF NOT EXISTS "pool_members_user_id_idx" ON "pool_members"("user_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "pool_members_pool_id_user_id_key" ON "pool_members"("pool_id", "user_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "pool_invitations_code_key" ON "pool_invitations"("code")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "pool_invitations_token_key" ON "pool_invitations"("token")`,
  `CREATE INDEX IF NOT EXISTS "pool_invitations_pool_id_idx" ON "pool_invitations"("pool_id")`,
  `CREATE INDEX IF NOT EXISTS "pool_invitations_token_idx" ON "pool_invitations"("token")`,
  `CREATE INDEX IF NOT EXISTS "pool_invitations_code_idx" ON "pool_invitations"("code")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "payment_links_token_key" ON "payment_links"("token")`,
  `CREATE INDEX IF NOT EXISTS "payment_links_pool_id_idx" ON "payment_links"("pool_id")`,
  `CREATE INDEX IF NOT EXISTS "payment_links_token_idx" ON "payment_links"("token")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "transactions_provider_reference_key" ON "transactions"("provider_reference")`,
  `CREATE INDEX IF NOT EXISTS "transactions_pool_id_idx" ON "transactions"("pool_id")`,
  `CREATE INDEX IF NOT EXISTS "transactions_provider_reference_idx" ON "transactions"("provider_reference")`,
  `CREATE INDEX IF NOT EXISTS "transaction_events_transaction_id_idx" ON "transaction_events"("transaction_id")`,
  `CREATE INDEX IF NOT EXISTS "split_configurations_pool_id_idx" ON "split_configurations"("pool_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "split_snapshots_transaction_id_key" ON "split_snapshots"("transaction_id")`,
  `CREATE INDEX IF NOT EXISTS "split_snapshots_pool_id_idx" ON "split_snapshots"("pool_id")`,
  `CREATE INDEX IF NOT EXISTS "split_allocations_snapshot_id_idx" ON "split_allocations"("snapshot_id")`,
  `CREATE INDEX IF NOT EXISTS "split_allocations_pool_member_id_idx" ON "split_allocations"("pool_member_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "withdrawals_provider_reference_key" ON "withdrawals"("provider_reference")`,
  `CREATE INDEX IF NOT EXISTS "withdrawals_pool_id_idx" ON "withdrawals"("pool_id")`,
  `CREATE INDEX IF NOT EXISTS "withdrawals_pool_member_id_idx" ON "withdrawals"("pool_member_id")`,
  `CREATE INDEX IF NOT EXISTS "withdrawal_events_withdrawal_id_idx" ON "withdrawal_events"("withdrawal_id")`,
  `CREATE INDEX IF NOT EXISTS "ledger_entries_account_id_idx" ON "ledger_entries"("account_id")`,
  `CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id")`,
  `CREATE INDEX IF NOT EXISTS "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "audit_log_webhook_entity_idempotency_key" ON "audit_log"("entity_type", "entity_id") WHERE "entity_type" = 'WEBHOOK'`,

  // Foreign keys
  `ALTER TABLE "pools" ADD CONSTRAINT "pools_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "pool_invitations" ADD CONSTRAINT "pool_invitations_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_link_id_fkey" FOREIGN KEY ("payment_link_id") REFERENCES "payment_links"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "transaction_events" ADD CONSTRAINT "transaction_events_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "split_configurations" ADD CONSTRAINT "split_configurations_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "split_snapshots" ADD CONSTRAINT "split_snapshots_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "split_snapshots" ADD CONSTRAINT "split_snapshots_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "split_allocations" ADD CONSTRAINT "split_allocations_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "split_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "split_allocations" ADD CONSTRAINT "split_allocations_pool_member_id_fkey" FOREIGN KEY ("pool_member_id") REFERENCES "pool_members"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_pool_member_id_fkey" FOREIGN KEY ("pool_member_id") REFERENCES "pool_members"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "withdrawal_events" ADD CONSTRAINT "withdrawal_events_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
];

async function run() {
  console.log('Starting direct database schema synchronization...');
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('✓ Success:', sql.slice(0, 45).replace(/\n/g, ' '));
    } catch (err: any) {
      // Ignore if already exists
      if (err.message?.includes('already exists') || err.code === '42710' || err.code === '42P07') {
        console.log('~ Exists:', sql.slice(0, 45).replace(/\n/g, ' '));
      } else {
        console.warn('! Warning:', err.message?.slice(0, 90));
      }
    }
  }
  console.log('Synchronization complete!');
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
