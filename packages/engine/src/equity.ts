import { Hand } from "pokersolver";
import { fullDeck, type Card } from "./cards.ts";

export function rulePercent(outs: number, cardsToCome: 1 | 2): number {
  return outs * (cardsToCome === 2 ? 4 : 2);
}

export function cardsToCome(street: "flop" | "turn", allIn: boolean): 1 | 2 {
  if (street === "turn" || !allIn) return 1;
  return 2;
}

export function unseenCount(boardCards: number, villainKnown: boolean): number {
  return 52 - 2 - boardCards - (villainKnown ? 2 : 0);
}

export function hitProbability(outs: number, unseen: number, cardsToCome: 1 | 2): number {
  if (cardsToCome === 1) return outs / unseen;
  const missed = unseen - outs;
  return 1 - (missed * (missed - 1)) / (unseen * (unseen - 1));
}

export function hitPercent(outs: number, unseen: number, cardsToCome: 1 | 2): number {
  return Math.round(hitProbability(outs, unseen, cardsToCome) * 100);
}

export function backdoorFlushProbability(): number {
  return (10 / 47) * (9 / 46);
}

async function boardEquity(hero: [Card, Card], villain: [Card, Card]): Promise<number> {
  const used = new Set<Card>([...hero, ...villain]);
  const rest = fullDeck().filter((card) => !used.has(card));
  let wins = 0;
  let ties = 0;
  let total = 0;
  for (let a = 0; a < rest.length; a += 1) {
    for (let b = a + 1; b < rest.length; b += 1) {
      for (let c = b + 1; c < rest.length; c += 1) {
        for (let d = c + 1; d < rest.length; d += 1) {
          for (let e = d + 1; e < rest.length; e += 1) {
            const board = [rest[a]!, rest[b]!, rest[c]!, rest[d]!, rest[e]!];
            const heroHand = Hand.solve([...hero, ...board]);
            const villainHand = Hand.solve([...villain, ...board]);
            const winners = Hand.winners([heroHand, villainHand]);
            total += 1;
            if (winners.length === 2) ties += 1;
            else if (winners[0] === heroHand) wins += 1;
          }
        }
      }
    }
    await new Promise((resolve) => setImmediate(resolve));
  }
  return (wins + ties / 2) / total;
}

let aaEquity: Promise<number> | null = null;

export function acesVersusKingsEquity(): Promise<number> {
  aaEquity ??= (async () => {
    const twoSuits = await boardEquity(["As", "Ah"], ["Ks", "Kh"]);
    const oneSuit = await boardEquity(["As", "Ah"], ["Ks", "Kd"]);
    const noSuit = await boardEquity(["As", "Ah"], ["Kd", "Kc"]);
    return (6 * twoSuits + 24 * oneSuit + 6 * noSuit) / 36;
  })();
  return aaEquity;
}
