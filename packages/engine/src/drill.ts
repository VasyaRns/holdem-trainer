import type { LevelId } from "@holdem/domain";

export type Question = {
  handId: string;
  prompt: string;
  payload: unknown;
};

export type Grade = {
  correct: boolean;
  answer: unknown;
  expected: unknown;
  miss: number;
  formula: string;
};

export type DrillModule = {
  id: string;
  title: string;
  levels: LevelId[];
  articleId: string;
  generate: (level: LevelId, random?: () => number, key?: string, avoidPrompt?: string) => Question;
  grade: (question: Question, answer: unknown) => Grade;
};
