-- CreateEnum
CREATE TYPE "entry_type" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "payment_mode" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "task_priority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "todo_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "todo_priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "asset_category" AS ENUM ('BANK_ACCOUNT', 'FIXED_DEPOSIT', 'MUTUAL_FUND', 'STOCKS', 'PPF_EPF', 'REAL_ESTATE', 'GOLD_JEWELLERY', 'VEHICLES', 'CASH', 'LOAN_GIVEN', 'OTHER_ASSET', 'CREDIT_CARD_DUE', 'LOAN_TAKEN', 'OTHER_LIABILITY');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" STRING NOT NULL,
    "email" STRING NOT NULL,
    "email_verified" BOOL NOT NULL DEFAULT false,
    "image" STRING,
    "last_backup_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" STRING NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "ip_address" STRING,
    "user_agent" STRING,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" STRING NOT NULL,
    "provider_id" STRING NOT NULL,
    "access_token" STRING,
    "refresh_token" STRING,
    "id_token" STRING,
    "access_token_expires_at" TIMESTAMPTZ(3),
    "refresh_token_expires_at" TIMESTAMPTZ(3),
    "scope" STRING,
    "password" STRING,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" UUID NOT NULL,
    "identifier" STRING NOT NULL,
    "value" STRING NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "money_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "type" "entry_type" NOT NULL,
    "category" STRING(100) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "mode" "payment_mode" NOT NULL,
    "narration" STRING(2000) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "money_entries_pkey" PRIMARY KEY ("user_id","id"),
    CONSTRAINT "money_entries_amount_check" CHECK ("amount" > 0)
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" STRING(200) NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME(0) NOT NULL,
    "notes" STRING(2000) NOT NULL DEFAULT '',
    "alerted" BOOL NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("user_id","id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" STRING(200) NOT NULL,
    "due_date" DATE,
    "priority" "task_priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "task_status" NOT NULL DEFAULT 'PENDING',
    "assignee" STRING(100) NOT NULL DEFAULT '',
    "notes" STRING(5000) NOT NULL DEFAULT '',
    "remarks" STRING(2000) NOT NULL DEFAULT '',
    "alerted" BOOL NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("user_id","id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" STRING(200) NOT NULL,
    "status" "todo_status" NOT NULL DEFAULT 'PENDING',
    "priority" "todo_priority" NOT NULL DEFAULT 'MEDIUM',
    "remarks" STRING(2000) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("user_id","id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" STRING(120) NOT NULL,
    "name_key" STRING(120) NOT NULL,
    "category" "asset_category" NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "notes" STRING(500) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("user_id","id"),
    CONSTRAINT "assets_value_check" CHECK ("value" >= 0)
);

-- CreateTable
CREATE TABLE "backup_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "method" STRING(200) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_logs_pkey" PRIMARY KEY ("user_id","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "accounts"("provider_id", "account_id");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "money_entries_user_id_date_idx" ON "money_entries"("user_id", "date");

-- CreateIndex
CREATE INDEX "events_user_id_date_idx" ON "events"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "assets_user_id_name_key_key" ON "assets"("user_id", "name_key");

-- CreateIndex
CREATE INDEX "backup_logs_user_id_created_at_idx" ON "backup_logs"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "money_entries" ADD CONSTRAINT "money_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_logs" ADD CONSTRAINT "backup_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
