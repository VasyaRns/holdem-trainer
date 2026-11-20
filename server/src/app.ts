import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { loadCharts, summaries, type LoadedCharts } from "./charts.ts";
import { achievementKeys, unresolvedMistakes, type AnswerRow } from "./progress.ts";

const cookieName = "holdem_player";

type Deps = {
  prisma: PrismaClient;
  charts?: LoadedCharts;
};

export function buildApp({ prisma, charts }: Deps): FastifyInstance {
  const app = Fastify({ logger: false });
  const loaded = charts ?? loadCharts(process.env.CHARTS_PATH);

  app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) callback(null, true);
      else callback(new Error("Чужой сайт"), false);
    },
    credentials: true,
  });
  app.register(cookie);

  app.addHook("onRequest", async (request, reply) => {
    if (request.cookies[cookieName]) return;
    const player = await ensurePlayer(prisma);
    reply.setCookie(cookieName, player.id, { path: "/", httpOnly: true, sameSite: "lax" });
    request.cookies[cookieName] = player.id;
  });

  app.get("/api/health", async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  });

  app.get("/api/charts", async (_request, reply) => {
    if (!loaded.ok) return reply.code(503).send({ error: loaded.error });
    return { charts: summaries(loaded) };
  });

  app.get("/api/charts/:id", async (request, reply) => {
    if (!loaded.ok) return reply.code(503).send({ error: loaded.error });
    const { id } = request.params as { id: string };
    const chart = loaded.byId.get(id);
    if (!chart) return reply.code(404).send({ error: "Спот не найден" });
    return { chart };
  });

  app.post("/api/sessions", async (request) => {
    const playerId = request.cookies[cookieName]!;
    const body = request.body as { drillId?: string; level?: string };
    const session = await prisma.session.create({
      data: { playerId, drillId: body.drillId ?? "", level: body.level ?? "easy" },
    });
    const unlocked = await grantAchievements(prisma, playerId);
    return { id: session.id, unlocked };
  });

  app.post("/api/sessions/:id/answers", async (request, reply) => {
    const playerId = request.cookies[cookieName]!;
    const { id } = request.params as { id: string };
    const session = await prisma.session.findFirst({ where: { id, playerId } });
    if (!session) return reply.code(404).send({ error: "Сессия не найдена" });
    const body = request.body as {
      question?: unknown;
      response?: unknown;
      correct?: boolean;
      durationMs?: number;
    };
    if (!body.question || typeof body.correct !== "boolean" || typeof body.durationMs !== "number") {
      return reply.code(400).send({ error: "Неполный ответ" });
    }
    const answer = await prisma.answer.create({
      data: {
        playerId,
        sessionId: session.id,
        drillId: session.drillId,
        level: session.level,
        question: body.question as object,
        response: (body.response ?? {}) as object,
        correct: body.correct,
        durationMs: body.durationMs,
      },
    });
    const unlocked = await grantAchievements(prisma, playerId);
    return { id: answer.id, unlocked };
  });

  app.get("/api/drills/:drillId/levels/:level", async (request) => {
    const playerId = request.cookies[cookieName]!;
    const { drillId, level } = request.params as { drillId: string; level: string };
    const [total, recent] = await Promise.all([
      prisma.answer.count({ where: { playerId, drillId, level } }),
      prisma.answer.findMany({
        where: { playerId, drillId, level },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
    const correct = recent.filter((row) => row.correct).length;
    return {
      total,
      count: recent.length,
      correct,
      accuracy: recent.length === 0 ? 0 : correct / recent.length,
    };
  });

  app.get("/api/mistakes", async (request) => {
    const playerId = request.cookies[cookieName]!;
    const rows = await prisma.answer.findMany({
      where: { playerId },
      orderBy: { createdAt: "asc" },
    });
    const mistakes = unresolvedMistakes(
      rows.map((row) => ({
        drillId: row.drillId,
        correct: row.correct,
        question: row.question as AnswerRow["question"],
        createdAt: row.createdAt,
      })),
    );
    return { mistakes };
  });

  app.get("/api/intros", async (request) => {
    const playerId = request.cookies[cookieName]!;
    const { drillId, level } = request.query as { drillId?: string; level?: string };
    if (!drillId || !level) return { seen: false };
    const intro = await prisma.levelIntro.findUnique({
      where: { playerId_drillId_level: { playerId, drillId, level } },
    });
    return { seen: Boolean(intro) };
  });

  app.post("/api/intros", async (request, reply) => {
    const playerId = request.cookies[cookieName]!;
    const body = request.body as { drillId?: string; level?: string };
    if (!body.drillId || !body.level) return reply.code(400).send({ error: "Неполный разбор" });
    await prisma.levelIntro.createMany({
      data: [{ playerId, drillId: body.drillId, level: body.level }],
      skipDuplicates: true,
    });
    return { seen: true };
  });

  app.post("/api/pairs", async (request, reply) => {
    const playerId = request.cookies[cookieName]!;
    const body = request.body as {
      level?: string;
      chartId?: string;
      moves?: number;
      seconds?: number;
      stars?: number;
      passed?: boolean;
    };
    if (!body.level || !body.chartId || body.moves == null || body.seconds == null || body.stars == null) {
      return reply.code(400).send({ error: "Неполная партия" });
    }
    const game = await prisma.pairsGame.create({
      data: {
        playerId,
        level: body.level,
        chartId: body.chartId,
        moves: body.moves,
        seconds: body.seconds,
        stars: body.stars,
        passed: Boolean(body.passed),
      },
    });
    return { id: game.id };
  });

  app.get("/api/pairs", async (request) => {
    const playerId = request.cookies[cookieName]!;
    const { level } = request.query as { level?: string };
    const games = await prisma.pairsGame.findMany({
      where: { playerId, ...(level ? { level } : {}), passed: true },
    });
    return {
      passedCount: games.length,
      bestSeconds: games.length === 0 ? null : Math.min(...games.map((game) => game.seconds)),
      bestMoves: games.length === 0 ? null : Math.min(...games.map((game) => game.moves)),
    };
  });

  return app;
}

async function ensurePlayer(prisma: PrismaClient) {
  const existing = await prisma.player.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.player.create({ data: {} });
}

async function grantAchievements(prisma: PrismaClient, playerId: string) {
  const [sessionCount, answers] = await Promise.all([
    prisma.session.count({ where: { playerId } }),
    prisma.answer.findMany({ where: { playerId }, orderBy: { createdAt: "desc" } }),
  ]);
  let streak = 0;
  for (const answer of answers) {
    if (!answer.correct) break;
    streak += 1;
  }
  const byDrill = new Map<string, number>();
  for (const answer of answers) {
    if (!answer.correct) continue;
    byDrill.set(answer.drillId, (byDrill.get(answer.drillId) ?? 0) + 1);
  }
  const keys = achievementKeys({
    sessionCount,
    correctStreak: streak,
    maxCorrectInOneDrill: Math.max(0, ...byDrill.values()),
  });
  const unlocked: string[] = [];
  for (const key of keys) {
    const created = await prisma.achievement.createMany({
      data: [{ playerId, key }],
      skipDuplicates: true,
    });
    if (created.count > 0) unlocked.push(key);
  }
  return unlocked;
}
