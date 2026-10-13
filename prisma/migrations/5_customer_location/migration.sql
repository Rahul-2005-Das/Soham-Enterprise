CREATE TABLE "CustomerLocation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "road" TEXT,
  "neighbourhood" TEXT,
  "city" TEXT,
  "state" TEXT,
  "pincode" TEXT,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerLocation_userId_key"
  ON "CustomerLocation"("userId");

ALTER TABLE "CustomerLocation"
  ADD CONSTRAINT "CustomerLocation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;