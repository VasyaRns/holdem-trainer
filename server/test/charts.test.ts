import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import { expect, it } from "vitest";
import { buildApp } from "../src/app.ts";
import { loadCharts } from "../src/charts.ts";

const fixture = fileURLToPath(new URL("./fixtures/charts.json", import.meta.url));

function fakePrisma(): PrismaClient {
  return {
    $queryRaw: async () => 1,
    player: {
      findFirst: async () => ({ id: "player-1" }),
      create: async () => ({ id: "player-1" }),
    },
  } as unknown as PrismaClient;
}

it("список чартов не отдаёт руки, отсутствующий файл не выдумывает чарт", async () => {
  const app = buildApp({ prisma: fakePrisma(), charts: loadCharts(fixture) });
  const list = await app.inject({ method: "GET", url: "/api/charts" });
  expect(list.statusCode).toBe(200);
  expect(list.json().charts).toEqual([
    {
      id: "fixture-open",
      title: "Фикстур, открытие, 10bb",
      hero: "UTG",
      mode: "open",
      opponent: null,
      stack: 10,
    },
  ]);

  const one = await app.inject({ method: "GET", url: "/api/charts/fixture-open" });
  expect(one.json().chart.hands.AA.parts[0].action).toBe("Push");

  const missing = buildApp({ prisma: fakePrisma(), charts: loadCharts("/нет/такого.json") });
  const denied = await missing.inject({ method: "GET", url: "/api/charts" });
  expect(denied.statusCode).toBe(503);
  expect(denied.json().charts).toBeUndefined();
});

it("здоровье отвечает, когда база жива", async () => {
  const app = buildApp({ prisma: fakePrisma(), charts: loadCharts(undefined) });
  const health = await app.inject({ method: "GET", url: "/api/health" });
  expect(health.statusCode).toBe(200);
  expect(health.json()).toEqual({ ok: true });
});
