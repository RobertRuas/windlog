-- DropForeignKey
ALTER TABLE "public"."ProjectFile" DROP CONSTRAINT "ProjectFile_projectId_fkey";
ALTER TABLE "public"."ProjectFile" DROP CONSTRAINT "ProjectFile_uploadedFileId_fkey";
ALTER TABLE "public"."UploadedFile" DROP CONSTRAINT "UploadedFile_userId_fkey";
ALTER TABLE "public"."UserDocumentFile" DROP CONSTRAINT "UserDocumentFile_documentId_fkey";
ALTER TABLE "public"."UserDocumentFile" DROP CONSTRAINT "UserDocumentFile_uploadedFileId_fkey";

-- DropTable
DROP TABLE "public"."ProjectFile";
DROP TABLE "public"."UserDocumentFile";
DROP TABLE "public"."UploadedFile";
