-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "question" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PairsGame" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "moves" INTEGER NOT NULL,
    "seconds" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PairsGame_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LevelIntro" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LevelIntro_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Answer_playerId_drillId_level_createdAt_idx" ON "Answer"("playerId", "drillId", "level", "createdAt");
CREATE UNIQUE INDEX "Achievement_playerId_key_key" ON "Achievement"("playerId", "key");
CREATE UNIQUE INDEX "LevelIntro_playerId_drillId_level_key" ON "LevelIntro"("playerId", "drillId", "level");

ALTER TABLE "Session" ADD CONSTRAINT "Session_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PairsGame" ADD CONSTRAINT "PairsGame_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LevelIntro" ADD CONSTRAINT "LevelIntro_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
