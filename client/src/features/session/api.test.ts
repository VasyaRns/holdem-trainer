import { beforeEach, expect, it, vi } from "vitest";
import { loadLevel, loadMathStats, openSession, saveAnswer } from "./api";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = String(url);
      if (path === "/api/sessions" && init?.method === "POST") {
        expect(JSON.parse(String(init.body))).toEqual({ drillId: "outs", level: "easy", today: false });
        expect(init.credentials).toBe("include");
        return new Response(JSON.stringify({ id: "session-1", unlocked: ["first_session"] }), { status: 200 });
      }
      if (path === "/api/sessions/session-1/answers" && init?.method === "POST") {
        expect(JSON.parse(String(init.body))).toEqual({
          question: { key: "flush", handId: "h1" },
          response: { value: 8, miss: 1 },
          correct: false,
          durationMs: 400,
        });
        return new Response(JSON.stringify({ id: "answer-1", unlocked: [] }), { status: 200 });
      }
      if (path === "/api/drills/outs/levels/easy") {
        return new Response(JSON.stringify({ total: 12, count: 12, correct: 10, accuracy: 10 / 12 }), { status: 200 });
      }
      return new Response("нет", { status: 404 });
    }),
  );
});

it("открывает сессию, пишет ответ с промахом и читает уровень", async () => {
  await expect(openSession("outs", "easy")).resolves.toEqual({ id: "session-1", unlocked: ["first_session"] });
  await expect(
    saveAnswer("session-1", {
      question: { key: "flush", handId: "h1" },
      response: 8,
      correct: false,
      miss: 1,
      durationMs: 400,
    }),
  ).resolves.toEqual({ id: "answer-1", unlocked: [] });
  await expect(loadLevel("outs", "easy")).resolves.toMatchObject({ total: 12, accuracy: 10 / 12 });
});

it("пока сессия открывается, второй вызов не создаёт ещё одну", async () => {
  let calls = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url) === "/api/sessions" && init?.method === "POST") {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return new Response(JSON.stringify({ id: "session-1", unlocked: [] }), { status: 200 });
      }
      return new Response("нет", { status: 404 });
    }),
  );
  const [first, second] = await Promise.all([openSession("outs", "easy"), openSession("outs", "easy")]);
  expect(first).toEqual(second);
  expect(calls).toBe(1);
});

it("сбой одного тренажёра не стирает остальные", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (String(url).includes("/drills/outs/")) return new Response("нет", { status: 500 });
      return new Response(JSON.stringify({ total: 3, count: 3, correct: 3, accuracy: 1 }), { status: 200 });
    }),
  );
  const body = await loadMathStats();
  expect(body.failed).toBe(true);
  expect(body.stats.some((stat) => stat.drillId === "outs")).toBe(false);
  expect(body.stats.some((stat) => stat.drillId === "rule")).toBe(true);
});

it("ошибка записи не маскируется пустым успехом", async () => {
  await expect(saveAnswer("missing", { question: { key: "flush", handId: "h1" }, response: 9, correct: true, miss: 0, durationMs: 1 })).rejects.toThrow();
});
