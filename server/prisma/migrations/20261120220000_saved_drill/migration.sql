CREATE TABLE "SavedDrill" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedDrill_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedDrill_playerId_chartId_key" ON "SavedDrill"("playerId", "chartId");

ALTER TABLE "SavedDrill" ADD CONSTRAINT "SavedDrill_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
