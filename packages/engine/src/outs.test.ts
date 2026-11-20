import { expect, it } from "vitest";
import { flushDrawOuts, rankOuts, winningOuts } from "./outs.ts";

it("флеш-дро даёт 9, бэкдор не считается девяткой", () => {
  expect(flushDrawOuts(["Ah", "Kh"], ["Qh", "7h", "2s"])).toBe(9);
  expect(flushDrawOuts(["Ah", "Kh"], ["Qh", "2s", "3c"])).toBeNull();
});

it("видимая карта той же масти снимает аут", () => {
  expect(flushDrawOuts(["Ah", "Kh"], ["Qh", "7h", "2s"], ["Jh"])).toBe(8);
});

it("двустороннее — 8, гатшот — 4, блокер ранга снимает одну", () => {
  expect(rankOuts(["Q", "7"])).toBe(8);
  expect(rankOuts(["5"])).toBe(4);
  expect(rankOuts(["Q", "7"], ["7h"])).toBe(7);
});

it("против открытой руки пара тузов и королей тоже выигрывает, не только червы", () => {
  const outs = winningOuts(["Ah", "Kh"], ["2c", "3d"], ["Qh", "7h", "2s"]);
  const hearts = outs.filter((card) => card.endsWith("h"));
  expect(hearts).toHaveLength(9);
  expect(outs).toEqual(expect.arrayContaining(["As", "Ad", "Ac", "Ks", "Kd", "Kc"]));
  expect(outs).toHaveLength(15);
});
