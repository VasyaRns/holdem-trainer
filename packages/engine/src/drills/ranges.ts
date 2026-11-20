import type { LevelId } from "@holdem/domain";
import type { DrillModule, Grade, Question } from "../drill.ts";
import { gradeRange, type RangeQuestion } from "../ranges.ts";

export const ranges: DrillModule = {
  id: "ranges",
  title: "Диапазоны",
  articleId: "chart",
  levels: ["easy", "medium", "hard"],
  generate(level: LevelId): Question {
    return {
      handId: `ranges-${level}`,
      prompt: "Диапазоны спрашивают чарт с API.",
      payload: { chartId: "", hand: "", hero: "", prompt: "", kind: "bucket", choices: ["fold"], expectedAction: "fold", expectedStep: null, formula: "Чарты не в клиенте." },
    };
  },
  grade(question: Question, answer: unknown): Grade {
    const payload = question.payload as RangeQuestion;
    const given = Array.isArray(answer) ? answer : [answer];
    const result = gradeRange(payload, String(given[0] ?? ""), given[1] == null ? undefined : Number(given[1]));
    return { correct: result.correct, answer, expected: payload.expectedAction, miss: result.miss, formula: result.formula };
  },
};
