ALTER TABLE "AutofillAnswer" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'essay';
ALTER TABLE "AutofillAnswer" ADD COLUMN "confirmed" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "AutofillAnswer_userId_confirmed_contextKey_idx" ON "AutofillAnswer"("userId", "confirmed", "contextKey");
