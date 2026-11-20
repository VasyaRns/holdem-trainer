import type { LevelId } from "@holdem/domain";
import type { DrillModule, Grade } from "../drill.ts";

export type Card = {
  key: string;
  prompt: string;
  formula: string;
  kind: "number" | "choice" | "pair";
  expected: number | "call" | "fold" | "either" | [number, number];
};

export function makeDrill(
  id: string,
  title: string,
  articleId: string,
  pools: Record<LevelId, Card[]>,
): DrillModule {
  return {
    id,
    title,
    articleId,
    levels: ["easy", "medium", "hard"],
    generate(level, random = Math.random, key, avoidPrompt) {
      const pool = pools[level];
      const matching = key ? pool.filter((card) => card.key === key) : pool;
      const source = matching.length > 0 ? matching : pool;
      const fresh = source.filter((card) => card.prompt !== avoidPrompt);
      const pile = fresh.length > 0 ? fresh : source;
      const picked = pile[Math.floor(random() * pile.length)]!;
      return {
        handId: crypto.randomUUID(),
        prompt: picked.prompt,
        payload: picked,
      };
    },
    grade(question, answer) {
      return gradeCard(question.payload as Card, answer);
    },
  };
}

export function gradeCard(card: Card, answer: unknown): Grade {
  if (card.kind === "choice") {
    const given = String(answer);
    const correct = card.expected === "either" ? given === "call" || given === "fold" : given === card.expected;
    return { correct, answer: given, expected: card.expected, miss: correct ? 0 : 1, formula: card.formula };
  }
  if (card.kind === "pair") {
    const [left, right] = Array.isArray(answer) ? answer : String(answer).split(/[^\d.-]+/);
    const given: [number, number] = [Number(left), Number(right)];
    const expected = card.expected as [number, number];
    const correct = given[0] === expected[0] && given[1] === expected[1];
    const miss = Math.abs((given[0] || 0) - expected[0]) + Math.abs((given[1] || 0) - expected[1]);
    return { correct, answer: given, expected, miss, formula: card.formula };
  }
  const given = typeof answer === "number" ? answer : Number(String(answer).replace(",", "."));
  const expected = card.expected as number;
  const correct = Number.isFinite(given) && given === expected;
  return {
    correct,
    answer: given,
    expected,
    miss: Number.isFinite(given) ? Math.abs(given - expected) : expected,
    formula: card.formula,
  };
}

export type RepeatTrack = { missed: boolean; streak: number };

export function afterAnswer(
  correct: boolean,
  track: RepeatTrack = { missed: false, streak: 0 },
): { repeat: boolean; track: RepeatTrack } {
  if (!correct) return { repeat: true, track: { missed: true, streak: 0 } };
  if (!track.missed) return { repeat: false, track: { missed: false, streak: 0 } };
  const streak = track.streak + 1;
  if (streak >= 2) return { repeat: false, track: { missed: false, streak: 0 } };
  return { repeat: true, track: { missed: true, streak } };
}
