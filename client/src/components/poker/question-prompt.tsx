import { CardRow, PlayingCard, type Suit } from "./playing-card";

type ShownCard = { rank: string; suit: Suit };

type Group = { label: string; cards: ShownCard[] };

export type QuestionView = { groups: Group[]; ask: string };

function cardsIn(chunk: string): ShownCard[] | null {
  const compact = chunk.replace(/\s+/g, "");
  if (!/^(?:[AKQJT2-9][shdc])+$/i.test(compact) || compact.length % 2 !== 0) return null;
  const cards: ShownCard[] = [];
  for (let index = 0; index < compact.length; index += 2) {
    const token = compact.slice(index, index + 2);
    cards.push({ rank: token[0]?.toUpperCase() ?? "", suit: (token[1]?.toLowerCase() ?? "s") as Suit });
  }
  return cards;
}

function lead(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function one(token: string): ShownCard[] | null {
  return cardsIn(token);
}

export function readQuestion(prompt: string): QuestionView {
  const villain = prompt.match(/^У вас (.+?), у оппонента (.+?), борд (.+?)\. (.+)$/);
  if (villain) {
    const hand = cardsIn(villain[1] ?? "");
    const opponent = cardsIn(villain[2] ?? "");
    const board = cardsIn(villain[3] ?? "");
    if (hand && opponent && board) {
      return {
        groups: [
          { label: "В руке", cards: hand },
          { label: "У оппонента", cards: opponent },
          { label: "На борде", cards: board },
        ],
        ask: lead(villain[4] ?? ""),
      };
    }
  }

  const dead = prompt.match(/^У вас (.+?), борд (.+?), и (.+?) уже видна\. (.+)$/);
  if (dead) {
    const hand = cardsIn(dead[1] ?? "");
    const board = cardsIn(dead[2] ?? "");
    const seen = cardsIn(dead[3] ?? "");
    if (hand && board && seen) {
      return {
        groups: [
          { label: "В руке", cards: hand },
          { label: "На борде", cards: board },
          { label: "Уже видна", cards: seen },
        ],
        ask: lead(dead[4] ?? ""),
      };
    }
  }

  const spot = prompt.match(/^У вас (.+?), борд (.+?)\. (.+)$/);
  if (spot) {
    const hand = cardsIn(spot[1] ?? "");
    const board = cardsIn(spot[2] ?? "");
    if (hand && board) {
      return {
        groups: [
          { label: "В руке", cards: hand },
          { label: "На борде", cards: board },
        ],
        ask: lead(spot[3] ?? ""),
      };
    }
  }

  const boardOnly = prompt.match(/^На борде ([AKQJT2-9][shdc])[.,] (.+)$/i);
  if (boardOnly) {
    const board = one(boardOnly[1] ?? "");
    if (board) return { groups: [{ label: "На борде", cards: board }], ask: lead(boardOnly[2] ?? "") };
  }

  const held = prompt.match(/^У вас ([AKQJT2-9][shdc]) и (.+)$/i);
  if (held) {
    const hand = one(held[1] ?? "");
    if (hand) return { groups: [{ label: "В руке", cards: hand }], ask: lead(`и ${held[2] ?? ""}`) };
  }

  return { groups: [], ask: prompt };
}

export function QuestionPrompt({ prompt }: { prompt: string }) {
  const view = readQuestion(prompt);
  if (view.groups.length === 0) return <h1 className="text-2xl leading-snug">{prompt}</h1>;
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-background p-3 sm:p-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          {view.groups.map((group) => (
            <CardRow key={group.label} label={group.label}>
              {group.cards.map((card, index) => (
                <PlayingCard key={`${group.label}-${card.rank}${card.suit}-${index}`} rank={card.rank} suit={card.suit} />
              ))}
            </CardRow>
          ))}
        </div>
      </div>
      <h1 className="text-2xl leading-snug">{view.ask}</h1>
    </div>
  );
}
