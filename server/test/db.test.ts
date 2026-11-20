import { PrismaClient } from "@prisma/client";
import { afterAll, expect, it } from "vitest";
import { buildApp } from "../src/app.ts";
import { loadCharts } from "../src/charts.ts";
import { fileURLToPath } from "node:url";

const databaseUrl = process.env.DATABASE_URL;
const fixture = fileURLToPath(new URL("./fixtures/charts.json", import.meta.url));

it.skipIf(!databaseUrl)("сессия, ответ и партия пишутся в Postgres", async () => {
  const prisma = new PrismaClient();
  await prisma.answer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.pairsGame.deleteMany();
  await prisma.levelIntro.deleteMany();
  const app = buildApp({ prisma, charts: loadCharts(fixture) });
  const session = await app.inject({ method: "POST", url: "/api/sessions", payload: { drillId: "outs", level: "easy" } });
  expect(session.statusCode).toBe(200);
  expect(session.json().unlocked).toContain("first_session");
  const sessionId = session.json().id as string;
  const cookie = session.cookies.find((item) => item.name === "holdem_player");
  expect(cookie?.value).toBeTruthy();

  const answer = await app.inject({
    method: "POST",
    url: `/api/sessions/${sessionId}/answers`,
    cookies: { holdem_player: cookie!.value },
    payload: { question: { key: "flush", handId: "h1" }, response: 9, correct: true, durationMs: 1200 },
  });
  expect(answer.statusCode).toBe(200);

  const recent = await app.inject({
    method: "GET",
    url: "/api/drills/outs/levels/easy",
    cookies: { holdem_player: cookie!.value },
  });
  expect(recent.json()).toMatchObject({ count: 1, correct: 1, accuracy: 1 });

  const pairs = await app.inject({
    method: "POST",
    url: "/api/pairs",
    cookies: { holdem_player: cookie!.value },
    payload: { level: "easy", chartId: "fixture-open", moves: 4, seconds: 12, stars: 3, passed: true },
  });
  expect(pairs.statusCode).toBe(200);
  const best = await app.inject({
    method: "GET",
    url: "/api/pairs?level=easy",
    cookies: { holdem_player: cookie!.value },
  });
  expect(best.json()).toMatchObject({ passedCount: 1, bestSeconds: 12, bestMoves: 4 });

  await prisma.$disconnect();
});

afterAll(() => undefined);
