-- A company may have separate campus/internship/experienced candidate portals.
CREATE TABLE "ApplicationPortal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "contentHash" TEXT,
    "lastCheckedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationPortal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ApplicationPortal_companyId_url_key" ON "ApplicationPortal"("companyId", "url");
CREATE INDEX "ApplicationPortal_companyId_idx" ON "ApplicationPortal"("companyId");

-- Preserve every previously configured single portal.
INSERT INTO "ApplicationPortal" ("id", "companyId", "url", "contentHash", "lastCheckedAt", "lastError", "createdAt")
SELECT 'portal_' || "id", "id", "portalUrl", "portalContentHash", "portalLastCheckedAt", "portalLastError", CURRENT_TIMESTAMP
FROM "Company"
WHERE "portalUrl" IS NOT NULL;
