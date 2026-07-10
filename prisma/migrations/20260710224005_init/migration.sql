-- CreateEnum
CREATE TYPE "Trade" AS ENUM ('PLOMBIER', 'ELECTRICIEN', 'MACON', 'COUVREUR', 'CHAUFFAGISTE', 'MENUISIER', 'PEINTRE', 'MULTI', 'AUTRE');

-- CreateEnum
CREATE TYPE "ConversationState" AS ENUM ('GREETING', 'QUALIFYING', 'CONFIRMING', 'DONE', 'OPTED_OUT', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('SMS', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('HIGH', 'NORMAL', 'LOW', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'QUALIFIED', 'CONTACTED', 'WON', 'LOST', 'SPAM');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "trade" "Trade" NOT NULL,
    "ownerFirstName" TEXT NOT NULL,
    "ownerMobile" TEXT NOT NULL,
    "siret" TEXT,
    "departments" TEXT[],
    "quietHoursStart" INTEGER NOT NULL DEFAULT 21,
    "quietHoursEnd" INTEGER NOT NULL DEFAULT 7,
    "urgentBypassQuiet" BOOLEAN NOT NULL DEFAULT true,
    "planStatus" "PlanStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneLine" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "voiceNumber" TEXT NOT NULL,
    "smsNumber" TEXT NOT NULL,
    "carrier" TEXT,
    "forwardVerifiedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PhoneLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "state" "ConversationState" NOT NULL DEFAULT 'GREETING',
    "promptVersion" TEXT NOT NULL,
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'SMS',
    "body" TEXT NOT NULL,
    "providerId" TEXT,
    "llmRaw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Qualification" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "tradeNeeded" "Trade",
    "urgency" "Urgency" NOT NULL DEFAULT 'UNKNOWN',
    "postalCode" TEXT,
    "description" TEXT NOT NULL,
    "ownerSummary" TEXT NOT NULL,
    "callbackWindow" TEXT,
    "inScopeGeo" BOOLEAN,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallEvent" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "accountId" TEXT NOT NULL,
    "callerPhone" TEXT NOT NULL,
    "providerCallId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneLine_accountId_key" ON "PhoneLine"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneLine_voiceNumber_key" ON "PhoneLine"("voiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneLine_smsNumber_key" ON "PhoneLine"("smsNumber");

-- CreateIndex
CREATE INDEX "Lead_accountId_status_idx" ON "Lead"("accountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_accountId_phone_key" ON "Lead"("accountId", "phone");

-- CreateIndex
CREATE INDEX "Conversation_state_expiresAt_idx" ON "Conversation"("state", "expiresAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Qualification_conversationId_key" ON "Qualification"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "CallEvent_conversationId_key" ON "CallEvent"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "CallEvent_providerCallId_key" ON "CallEvent"("providerCallId");

-- CreateIndex
CREATE INDEX "AuditEvent_accountId_kind_createdAt_idx" ON "AuditEvent"("accountId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneLine" ADD CONSTRAINT "PhoneLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallEvent" ADD CONSTRAINT "CallEvent_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallEvent" ADD CONSTRAINT "CallEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
