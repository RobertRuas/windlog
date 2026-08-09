-- CreateEnum
CREATE TYPE "MailFolderType" AS ENUM ('INBOX', 'SENT', 'DRAFTS', 'SPAM', 'TRASH', 'ARCHIVE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MailProtocol" AS ENUM ('IMAP', 'POP3');

-- CreateEnum
CREATE TYPE "MailRuleCondition" AS ENUM ('FROM', 'TO', 'SUBJECT', 'CONTAINS', 'HAS_ATTACHMENT');

-- CreateEnum
CREATE TYPE "MailRuleAction" AS ENUM ('MOVE_TO_FOLDER', 'FLAG', 'MARK_IMPORTANT', 'MARK_READ', 'LABEL', 'FORWARD', 'AUTO_REPLY', 'MOVE_TO_SPAM', 'DELETE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LogAction" ADD VALUE 'EMAIL_ACCOUNT_CONNECT';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_ACCOUNT_UPDATE';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_ACCOUNT_DISCONNECT';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_SYNC';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_SEND';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_READ';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_MOVE';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_DELETE';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_FOLDER_CREATE';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_FOLDER_UPDATE';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_FOLDER_DELETE';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_RULE_CREATE';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_RULE_UPDATE';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_RULE_DELETE';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_CONTACT_CREATE';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_CONTACT_DELETE';
ALTER TYPE "LogAction" ADD VALUE 'EMAIL_BLOCK_SENDER';

-- CreateTable
CREATE TABLE "MailAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordEnc" TEXT NOT NULL,
    "protocol" "MailProtocol" NOT NULL DEFAULT 'IMAP',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "notifyOnNew" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MailAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MailFolderType" NOT NULL DEFAULT 'CUSTOM',
    "imapPath" TEXT NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MailFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailMessage" (
    "id" TEXT NOT NULL,
    "uid" INTEGER,
    "messageId" TEXT,
    "inReplyTo" TEXT,
    "conversationId" TEXT,
    "from" JSONB,
    "to" JSONB,
    "cc" JSONB,
    "bcc" JSONB,
    "subject" TEXT,
    "preview" TEXT,
    "textBody" TEXT,
    "htmlBody" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "size" INTEGER NOT NULL DEFAULT 0,
    "hasSuspiciousAttachment" BOOLEAN NOT NULL DEFAULT false,
    "accountId" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailAttachment" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "filePath" TEXT,
    "contentId" TEXT,
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailLabel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailMessageLabel" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailMessageLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditionType" "MailRuleCondition" NOT NULL,
    "conditionValue" TEXT,
    "actionType" "MailRuleAction" NOT NULL,
    "actionValue" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MailRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailContact" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "isAuto" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MailContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailContactGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MailContactGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailContactGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailContactGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailSignature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MailSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailBlockedSender" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailBlockedSender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailAutoReply" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "oncePerSender" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "sentTo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailAutoReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MailAccount_userId_key" ON "MailAccount"("userId");

-- CreateIndex
CREATE INDEX "MailAccount_userId_idx" ON "MailAccount"("userId");

-- CreateIndex
CREATE INDEX "MailFolder_accountId_idx" ON "MailFolder"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "MailFolder_accountId_imapPath_key" ON "MailFolder"("accountId", "imapPath");

-- CreateIndex
CREATE INDEX "MailMessage_accountId_folderId_date_idx" ON "MailMessage"("accountId", "folderId", "date");

-- CreateIndex
CREATE INDEX "MailMessage_accountId_conversationId_idx" ON "MailMessage"("accountId", "conversationId");

-- CreateIndex
CREATE INDEX "MailMessage_accountId_isRead_idx" ON "MailMessage"("accountId", "isRead");

-- CreateIndex
CREATE INDEX "MailMessage_folderId_uid_idx" ON "MailMessage"("folderId", "uid");

-- CreateIndex
CREATE INDEX "MailAttachment_messageId_idx" ON "MailAttachment"("messageId");

-- CreateIndex
CREATE INDEX "MailLabel_accountId_idx" ON "MailLabel"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "MailLabel_accountId_name_key" ON "MailLabel"("accountId", "name");

-- CreateIndex
CREATE INDEX "MailMessageLabel_labelId_idx" ON "MailMessageLabel"("labelId");

-- CreateIndex
CREATE UNIQUE INDEX "MailMessageLabel_messageId_labelId_key" ON "MailMessageLabel"("messageId", "labelId");

-- CreateIndex
CREATE INDEX "MailRule_accountId_idx" ON "MailRule"("accountId");

-- CreateIndex
CREATE INDEX "MailContact_userId_idx" ON "MailContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MailContact_userId_email_key" ON "MailContact"("userId", "email");

-- CreateIndex
CREATE INDEX "MailContactGroup_userId_idx" ON "MailContactGroup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MailContactGroup_userId_name_key" ON "MailContactGroup"("userId", "name");

-- CreateIndex
CREATE INDEX "MailContactGroupMember_contactId_idx" ON "MailContactGroupMember"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "MailContactGroupMember_groupId_contactId_key" ON "MailContactGroupMember"("groupId", "contactId");

-- CreateIndex
CREATE INDEX "MailSignature_userId_idx" ON "MailSignature"("userId");

-- CreateIndex
CREATE INDEX "MailBlockedSender_userId_idx" ON "MailBlockedSender"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MailBlockedSender_userId_email_key" ON "MailBlockedSender"("userId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "MailAutoReply_userId_key" ON "MailAutoReply"("userId");

-- CreateIndex
CREATE INDEX "MailAutoReply_userId_idx" ON "MailAutoReply"("userId");

-- AddForeignKey
ALTER TABLE "MailAccount" ADD CONSTRAINT "MailAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailFolder" ADD CONSTRAINT "MailFolder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailMessage" ADD CONSTRAINT "MailMessage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailMessage" ADD CONSTRAINT "MailMessage_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MailFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailAttachment" ADD CONSTRAINT "MailAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailLabel" ADD CONSTRAINT "MailLabel_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailMessageLabel" ADD CONSTRAINT "MailMessageLabel_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailMessageLabel" ADD CONSTRAINT "MailMessageLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "MailLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailRule" ADD CONSTRAINT "MailRule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailContact" ADD CONSTRAINT "MailContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailContactGroup" ADD CONSTRAINT "MailContactGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailContactGroupMember" ADD CONSTRAINT "MailContactGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MailContactGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailContactGroupMember" ADD CONSTRAINT "MailContactGroupMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "MailContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailSignature" ADD CONSTRAINT "MailSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailBlockedSender" ADD CONSTRAINT "MailBlockedSender_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailAutoReply" ADD CONSTRAINT "MailAutoReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
