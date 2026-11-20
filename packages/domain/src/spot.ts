export const POSITIONS = ["UTG", "MP", "MP1", "HIJ", "CO", "BU", "SB", "BB"] as const;

export type Position = (typeof POSITIONS)[number];

export type Street = "preflop" | "flop" | "turn" | "river";

export type Spot = {
  position: Position | null;
  stackBb: number | null;
  opponent: Position | null;
  street: Street | null;
  board: string[];
  hand: string | null;
  payouts: number[];
  playersLeftToPrizes: number | null;
  otherStacksBb: number[];
};

export function emptySpot(): Spot {
  return {
    position: null,
    stackBb: null,
    opponent: null,
    street: null,
    board: [],
    hand: null,
    payouts: [],
    playersLeftToPrizes: null,
    otherStacksBb: [],
  };
}
