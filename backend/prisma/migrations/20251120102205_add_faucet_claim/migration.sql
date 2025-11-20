-- CreateTable
CREATE TABLE "FaucetClaim" (
    "id" UUID NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaucetClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FaucetClaim_walletAddress_key" ON "FaucetClaim"("walletAddress");

-- CreateIndex
CREATE INDEX "FaucetClaim_walletAddress_idx" ON "FaucetClaim"("walletAddress");

-- CreateIndex
CREATE INDEX "FaucetClaim_claimedAt_idx" ON "FaucetClaim"("claimedAt");
