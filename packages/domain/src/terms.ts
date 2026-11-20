export type Term = {
  id: string;
  title: string;
  text: string;
  group: string;
  articleId?: string;
};

export const TERMS: Term[] = [
  { id: "out", title: "Аут", text: "Карта, которая ещё не открыта и улучшает вашу руку.", group: "руки", articleId: "outs" },
  { id: "equity", title: "Эквити", text: "Ваша доля банка, если дальше все карты откроются без новых ставок.", group: "руки", articleId: "ev" },
  { id: "blocker", title: "Блокер", text: "Карта у вас, из-за которой у оппонента меньше нужных комбо.", group: "руки", articleId: "blocker" },
  { id: "backdoor", title: "Бэкдор", text: "Дро, которому нужны и терн, и ривер. Это около 4%, не девять карт.", group: "руки", articleId: "backdoor" },
  { id: "pot-odds", title: "Пот-оддсы", text: "Цена колла: колл разделить на банк перед вами плюс колл.", group: "торговля", articleId: "pot" },
  { id: "mdf", title: "MDF", text: "Доля диапазона, которую нужно защитить против ставки.", group: "торговля", articleId: "mdf" },
  { id: "alpha", title: "Альфа", text: "Как часто блеф должен пройти, чтобы не терять фишки.", group: "торговля", articleId: "mdf" },
  { id: "spr", title: "SPR", text: "Стек разделить на текущий банк.", group: "торговля", articleId: "spr" },
  { id: "gto", title: "GTO", text: "Частоты, при которых соперник не зарабатывает одной только сменой своей стратегии.", group: "стол", articleId: "solver" },
  { id: "solver", title: "Солвер", text: "Программа, которая ищет такие частоты.", group: "стол", articleId: "solver" },
  { id: "icm", title: "ICM", text: "Пересчёт фишек в долю призовых.", group: "стол", articleId: "icm" },
  { id: "quota", title: "Квота", text: "Сколько ответов нужно, чтобы закрыть уровень.", group: "прогресс", articleId: "quota" },
];

export function filterTerms(query: string): Term[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return TERMS;
  return TERMS.filter((term) => `${term.title} ${term.text}`.toLowerCase().includes(needle));
}
