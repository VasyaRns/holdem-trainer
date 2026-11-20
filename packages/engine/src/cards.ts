export const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;
export const SUITS = ["s", "h", "d", "c"] as const;

export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];
export type Card = `${Rank}${Suit}`;

const RANK_SET = new Set<string>(RANKS);
const SUIT_SET = new Set<string>(SUITS);

export function parseCard(text: string): Card {
  const rank = text[0]?.toUpperCase();
  const suit = text[1]?.toLowerCase();
  if (!rank || !suit || text.length !== 2 || !RANK_SET.has(rank) || !SUIT_SET.has(suit)) {
    throw new Error(`Не карта: ${text}`);
  }
  return `${rank}${suit}` as Card;
}

export function fullDeck(): Card[] {
  return RANKS.flatMap((rank) => SUITS.map((suit) => `${rank}${suit}` as Card));
}

export function handClass(first: Card, second: Card): string {
  const [a, b] = [first, second].sort((left, right) => RANKS.indexOf(left[0] as Rank) - RANKS.indexOf(right[0] as Rank));
  if (a[0] === b[0]) return `${a[0]}${b[0]}`;
  return `${a[0]}${b[0]}${a[1] === b[1] ? "s" : "o"}`;
}
