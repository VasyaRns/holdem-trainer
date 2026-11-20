import { registry } from "../registry.ts";
import { afterAnswer } from "./make.ts";
import { outs } from "./outs.ts";
import { expect, it } from "vitest";

it("промахнутый шаблон возвращается, пока не будет двух верных подряд", () => {
  const missed = afterAnswer(false);
  expect(missed.repeat).toBe(true);
  const once = afterAnswer(true, missed.track);
  expect(once.repeat).toBe(true);
  expect(afterAnswer(true, once.track).repeat).toBe(false);
  expect(afterAnswer(true).repeat).toBe(false);
});

it("два простых флеш-дро отличаются текстом, ответ всё равно 9", () => {
  const first = outs.generate("easy", () => 0, "flush");
  const second = outs.generate("easy", () => 0.99, "flush", first.prompt);
  expect(outs.grade(first, 9).correct).toBe(true);
  expect(outs.grade(second, 9).correct).toBe(true);
  expect(second.prompt).not.toBe(first.prompt);
});

it("средний и сложный уровень дают хотя бы восемь разных спотов", () => {
  for (const drill of registry) {
    if (drill.id === "ranges") continue;
    for (const level of ["medium", "hard"] as const) {
      const prompts = new Set(Array.from({ length: 40 }, (_, index) => drill.generate(level, () => index / 40).prompt));
      expect(prompts.size, `${drill.id} ${level}`).toBeGreaterThanOrEqual(8);
    }
  }
});
