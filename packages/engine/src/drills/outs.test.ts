import { afterAnswer, gradeCard } from "./make.ts";
import { outs } from "./outs.ts";
import { expect, it } from "vitest";

it("промах возвращает тот же шаблон, два верных подряд отпускают его", () => {
  expect(afterAnswer(0, false)).toEqual({ streak: 0, repeat: true });
  expect(afterAnswer(0, true)).toEqual({ streak: 1, repeat: true });
  expect(afterAnswer(1, true)).toEqual({ streak: 0, repeat: false });
});

it("простой флеш-дро принимает только 9", () => {
  const question = outs.generate("easy", () => 0, "flush");
  expect(outs.grade(question, 9).correct).toBe(true);
  expect(outs.grade(question, 4).correct).toBe(false);
  expect(gradeCard(question.payload as never, 9).formula).toMatch(/13 − 4 = 9/);
});
