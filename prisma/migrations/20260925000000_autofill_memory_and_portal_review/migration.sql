-- Keep confirmed answers even if the resume version they were first written
-- with is deleted. AI drafts remain tied to their original resume for reuse.
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutofillAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "resumeVersionId" TEXT,
    "questionLabel" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'essay',
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "contextKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutofillAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AutofillAnswer_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AutofillAnswer" ("id", "userId", "resumeVersionId", "questionLabel", "answer", "kind", "confirmed", "contextKey", "createdAt", "updatedAt")
SELECT "id", "userId", "resumeVersionId", "questionLabel", "answer", "kind", "confirmed", "contextKey", "createdAt", "updatedAt" FROM "AutofillAnswer";
DROP TABLE "AutofillAnswer";
ALTER TABLE "new_AutofillAnswer" RENAME TO "AutofillAnswer";
CREATE INDEX "AutofillAnswer_userId_resumeVersionId_idx" ON "AutofillAnswer"("userId", "resumeVersionId");
CREATE INDEX "AutofillAnswer_userId_resumeVersionId_contextKey_idx" ON "AutofillAnswer"("userId", "resumeVersionId", "contextKey");
CREATE INDEX "AutofillAnswer_userId_confirmed_contextKey_idx" ON "AutofillAnswer"("userId", "confirmed", "contextKey");
PRAGMA foreign_keys=ON;

ALTER TABLE "Application" ADD COLUMN "portalSuggestedStage" TEXT;
ALTER TABLE "Application" ADD COLUMN "portalSuggestedAt" DATETIME;
