export const ACHIEVEMENTS = [
  { key: "first_session", title: "Первая сессия" },
  { key: "streak_10", title: "Серия 10" },
  { key: "fifty_correct", title: "50 верных в одном тренажёре" },
  { key: "medium_open", title: "Открыт средний" },
  { key: "hard_open", title: "Открыт сложный" },
  { key: "accurate_30", title: "90% на 30 вопросах" },
  { key: "easy_sweep", title: "Все простые уровни закрыты" },
  { key: "week", title: "Семь дней подряд" },
  { key: "pairs_clean", title: "Простые «Пары» без лишнего хода" },
] as const;

export function achievementTitle(key: string): string {
  return ACHIEVEMENTS.find((item) => item.key === key)?.title ?? key;
}
