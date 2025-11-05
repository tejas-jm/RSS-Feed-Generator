-- CreateTable
CREATE TABLE IF NOT EXISTS "Feed" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "listSelector" TEXT,
  "fields" JSON NOT NULL,
  "transform" JSON,
  "schedule" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "maxItems" INTEGER NOT NULL DEFAULT 50,
  "dedupKey" TEXT NOT NULL DEFAULT 'link',
  "isPaused" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FeedRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "feedId" TEXT NOT NULL,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" DATETIME,
  "status" TEXT NOT NULL,
  "message" TEXT,
  "itemCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "FeedRun_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FeedItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "feedId" TEXT NOT NULL,
  "guid" TEXT NOT NULL,
  "title" TEXT,
  "link" TEXT,
  "description" TEXT,
  "date" DATETIME,
  "image" TEXT,
  "author" TEXT,
  "category" TEXT,
  "tags" JSON NOT NULL,
  "custom" JSON,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedItem_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FeedItem_feedId_guid_idx" ON "FeedItem" ("feedId", "guid");
