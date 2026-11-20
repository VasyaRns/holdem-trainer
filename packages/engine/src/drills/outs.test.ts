import { afterAnswer } from "./make.ts";
import { outs } from "./outs.ts";
import { expect, it } from "vitest";

it("после верного ответа берётся новый спот, после ошибки — тот же навык", () => {
  expect(afterAnswer(false)).toEqual({ repeat: true });
  expect(afterAnswer(true)).toEqual({ repeat: false });
});

it("два простых флеш-дро отличаются текстом, ответ всё равно 9", () => {
  const first = outs.generate("easy", () => 0, "flush");
  const second = outs.generate("easy", () => 0.99, "flush", first.prompt);
  expect(outs.grade(first, 9).correct).toBe(true);
  expect(outs.grade(second, 9).correct).toBe(true);
  expect(second.prompt).not.toBe(first.prompt);
});
