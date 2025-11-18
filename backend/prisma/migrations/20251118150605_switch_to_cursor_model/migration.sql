-- Drop old IndexerCheckpoint table
DROP TABLE IF EXISTS "IndexerCheckpoint";

-- Create new Cursor table (matches example pattern)
CREATE TABLE "Cursor" (
    "id" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "txDigest" TEXT NOT NULL,

    CONSTRAINT "Cursor_pkey" PRIMARY KEY ("id")
);

