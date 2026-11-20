import type { PairsDeck } from "@holdem/engine";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Shell } from "@/components/shell";
import { PairsPage } from "./pairs-page";
import { PAIRS_MISS_MS, PairsTable } from "./pairs-table";

const openHands = {
  AA: { parts: [{ action: "Push", weight: 1, color: "#111" }] },
  AKs: { parts: [{ action: "Open-2bb", weight: 1, color: "#222" }] },
  KQo: { parts: [{ action: "Limp", weight: 1, color: "#333" }] },
  "77": { parts: [{ action: "Push", weight: 1, color: "#444" }] },
  A5s: {
    parts: [
      { action: "Open-2bb", weight: 0.36 },
      { action: "Push", weight: 0.64 },
    ],
  },
  KQs: { parts: [{ action: "пометка тренера", weight: 1 }] },
};

const spot = {
  id: "utg-open-10",
  title: "UTG открытие 10bb",
  hero: "UTG",
  mode: "open",
  opponent: null,
  stack: 10,
};

const deck: PairsDeck = {
  chartId: "utg-open-10",
  level: "easy",
  pairCount: 4,
  previewSeconds: 6,
  cards: [
    { id: "AA:hand", pairId: "AA", side: "hand", text: "AA", color: "#111" },
    { id: "AA:action", pairId: "AA", side: "action", text: "Пуш", color: "#111" },
  ],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function renderPairs(path = "/pairs") {
  const router = createMemoryRouter(
    [
      {
        element: <Shell />,
        children: [
          { path: "pairs", element: <PairsPage /> },
          { path: "pairs/:chartId", element: <PairsPage /> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

it("стол показывает карты, затем закрывает их рубашкой", async () => {
  vi.useFakeTimers();
  render(<PairsTable title="UTG открытие 10bb" stack={10} deck={deck} />);
  expect(screen.getByText("AA")).toBeInTheDocument();
  expect(screen.getByText("Пуш")).toBeInTheDocument();
  expect(screen.getByText("Превью: 6 с")).toBeInTheDocument();
  expect(screen.getByText("10 bb")).toBeInTheDocument();
  expect(screen.getByText("Ходы: 0")).toBeInTheDocument();
  expect(screen.getByText("AA").closest("button")).toHaveAttribute("data-color", "#111");

  await vi.advanceTimersByTimeAsync(5999);
  expect(screen.getByText("AA")).toBeInTheDocument();

  await vi.advanceTimersByTimeAsync(1);
  expect(screen.queryByText("AA")).not.toBeInTheDocument();
  expect(screen.queryByText("Пуш")).not.toBeInTheDocument();
  expect(screen.getAllByLabelText("Рубашка")).toHaveLength(2);
  expect(screen.getByText("Карты закрыты")).toBeInTheDocument();
  expect(screen.getAllByLabelText("Рубашка").every((card) => card.getAttribute("data-color") === "")).toBe(true);
});

function button(id: string): HTMLButtonElement {
  const node = document.querySelector(`[data-card="${id}"]`);
  if (!(node instanceof HTMLButtonElement)) throw new Error(id);
  return node;
}

it("совпавшая пара остаётся, чужая закрывается", async () => {
  vi.useFakeTimers();
  const two: PairsDeck = {
    ...deck,
    pairCount: 2,
    cards: [
      { id: "AA:hand", pairId: "AA", side: "hand", text: "AA", color: "#111" },
      { id: "AA:action", pairId: "AA", side: "action", text: "Пуш", color: "#111" },
      { id: "KQo:hand", pairId: "KQo", side: "hand", text: "KQo", color: "#333" },
      { id: "KQo:action", pairId: "KQo", side: "action", text: "Лимп", color: "#333" },
    ],
  };
  render(<PairsTable title="UTG" stack={10} deck={two} />);
  fireEvent.click(button("AA:hand"));
  expect(screen.getByText("Ходы: 0")).toBeInTheDocument();
  await vi.advanceTimersByTimeAsync(6000);
  fireEvent.click(button("AA:hand"));
  fireEvent.click(button("AA:hand"));
  expect(screen.getByText("Ходы: 0")).toBeInTheDocument();
  fireEvent.click(button("KQo:hand"));
  expect(screen.getByText("AA")).toBeInTheDocument();
  expect(screen.getByText("KQo")).toBeInTheDocument();
  expect(screen.getByText("Ходы: 1")).toBeInTheDocument();
  await vi.advanceTimersByTimeAsync(PAIRS_MISS_MS);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(screen.queryByText("AA")).not.toBeInTheDocument();
  expect(screen.queryByText("KQo")).not.toBeInTheDocument();
  fireEvent.click(button("AA:hand"));
  fireEvent.click(button("AA:action"));
  expect(screen.getByText("Пуш")).toBeInTheDocument();
  fireEvent.click(button("KQo:hand"));
  fireEvent.click(button("KQo:action"));
  expect(screen.getByText("Партия собрана")).toBeInTheDocument();
  expect(screen.getByText("Ходы: 3")).toBeInTheDocument();
  expect(screen.getByText("Звёзды: 2. Зачтена")).toBeInTheDocument();
});

it("ход на каждую пару даёт три звезды", async () => {
  vi.useFakeTimers();
  const finished = vi.fn();
  render(<PairsTable title="UTG открытие 10bb" stack={10} deck={{ ...deck, pairCount: 1 }} onFinish={finished} />);
  await vi.advanceTimersByTimeAsync(6000);
  fireEvent.click(button("AA:hand"));
  fireEvent.click(button("AA:action"));
  expect(screen.getByText("Партия собрана")).toBeInTheDocument();
  expect(screen.getByText("Звёзды: 3. Зачтена")).toBeInTheDocument();
  expect(screen.getByText("AA")).toBeInTheDocument();
  expect(finished).toHaveBeenCalledWith({ moves: 1, seconds: 0, stars: 3, passed: true });
});

it("короткое превью закрывает стол раньше шести секунд", async () => {
  vi.useFakeTimers();
  render(<PairsTable title="CO" stack={15} deck={{ ...deck, previewSeconds: 4 }} />);
  await vi.advanceTimersByTimeAsync(4000);
  expect(screen.queryByText("AA")).not.toBeInTheDocument();
  expect(screen.getByText("Карты закрыты")).toBeInTheDocument();
});

it("без файла не показывает свой чарт", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Чарты не подключены" }), { status: 503 })));
  renderPairs();
  expect(await screen.findByText("Чарты не подключены")).toBeInTheDocument();
  expect(screen.getByText("Своего чарта нет.")).toBeInTheDocument();
  expect(screen.queryByText("AA")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "UTG открытие 10bb" })).not.toBeInTheDocument();
});

it("спот собирает четыре чистые пары и не берёт смешанную клетку", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (String(url) === "/api/charts") return new Response(JSON.stringify({ charts: [spot] }), { status: 200 });
      return new Response(JSON.stringify({ chart: { ...spot, hands: openHands } }), { status: 200 });
    }),
  );
  renderPairs("/pairs/utg-open-10");
  expect(await screen.findByText("UTG открытие 10bb")).toBeInTheDocument();
  expect(screen.getByText("AA")).toBeInTheDocument();
  expect(screen.getByText("AKs")).toBeInTheDocument();
  expect(screen.getByText("Открытие")).toBeInTheDocument();
  expect(screen.queryByText("A5s")).not.toBeInTheDocument();
  expect(screen.queryByText("KQs")).not.toBeInTheDocument();
  expect(screen.queryByText("Open-2bb")).not.toBeInTheDocument();
});

it("ошибка списка не прячет уже открытый спот", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (String(url) === "/api/charts") return new Response(JSON.stringify({ error: "Чарты не подключены" }), { status: 503 });
      return new Response(JSON.stringify({ chart: { ...spot, hands: openHands } }), { status: 200 });
    }),
  );
  renderPairs("/pairs/utg-open-10");
  expect(await screen.findByText("AA")).toBeInTheDocument();
  expect(screen.queryByText("Своего чарта нет.")).not.toBeInTheDocument();
});

it("чужой идентификатор спота не собирает стол", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (String(url) === "/api/charts") return new Response(JSON.stringify({ charts: [spot] }), { status: 200 });
      return new Response(JSON.stringify({ chart: { ...spot, id: "другой", hands: openHands } }), { status: 200 });
    }),
  );
  renderPairs("/pairs/utg-open-10");
  expect(await screen.findByText("Спот не найден")).toBeInTheDocument();
  expect(screen.queryByText("AA")).not.toBeInTheDocument();
});

it("защита не превращается в простой стол", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (String(url) === "/api/charts") return new Response(JSON.stringify({ charts: [] }), { status: 200 });
      return new Response(
        JSON.stringify({
          chart: {
            ...spot,
            id: "bb-vs-bu",
            mode: "vs",
            stack: null,
            hands: { AJo: { parts: [{ action: "Call", weight: 1 }] } },
          },
        }),
        { status: 200 },
      );
    }),
  );
  renderPairs("/pairs/bb-vs-bu");
  expect(await screen.findByText("В этом споте нет четырёх чистых действий открытия.")).toBeInTheDocument();
  expect(screen.queryByText("AJo")).not.toBeInTheDocument();
});

const mediumHands = {
  AJo: { parts: [{ action: "Call", weight: 1 }] },
  ATs: { parts: [{ action: "3bet 6-8bb", weight: 1 }] },
  KQo: { parts: [{ action: "Call", weight: 1 }] },
  A9o: { parts: [{ action: "Call", weight: 1 }] },
  KJs: { parts: [{ action: "Raise", weight: 1 }] },
  QTs: { parts: [{ action: "Call", weight: 1 }] },
};

function pairsFetch(
  counts: { easy?: number; medium?: number; hard?: number },
  chartBody: unknown,
  best: { seconds: number; moves: number } | null = null,
) {
  return async (url: string) => {
    if (String(url).startsWith("/api/pairs")) {
      const level = new URL(String(url), "http://local").searchParams.get("level");
      const passedCount = level === "medium" ? (counts.medium ?? 0) : level === "hard" ? (counts.hard ?? 0) : (counts.easy ?? 0);
      return new Response(
        JSON.stringify({ passedCount, bestSeconds: best?.seconds ?? null, bestMoves: best?.moves ?? null }),
        { status: 200 },
      );
    }
    if (String(url) === "/api/charts") return new Response(JSON.stringify({ charts: [spot] }), { status: 200 });
    return new Response(JSON.stringify({ chart: chartBody }), { status: 200 });
  };
}

it("экран показывает лучшие время и ходы", async () => {
  vi.stubGlobal("fetch", vi.fn(pairsFetch({ easy: 1 }, { ...spot, hands: openHands }, { seconds: 9, moves: 4 })));
  renderPairs("/pairs");
  expect(await screen.findByText("Лучшее время: 9 с. Лучшие ходы: 4.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /^Простой 1\/12/ })).toBeInTheDocument();
});

it("средний стол закрыт до двенадцати партий, сложный — до шестнадцати", async () => {
  vi.stubGlobal("fetch", vi.fn(pairsFetch({ easy: 11, medium: 15 }, { ...spot, hands: openHands })));
  renderPairs("/pairs");
  expect(await screen.findByRole("link", { name: /^Простой 11\/12/ })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /^Средний/ })).not.toBeInTheDocument();
  expect(screen.getByText("Средний")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /^Сложный/ })).not.toBeInTheDocument();
});

it("квота открывает следующий размер стола", async () => {
  vi.stubGlobal("fetch", vi.fn(pairsFetch({ easy: 12, medium: 16 }, { ...spot, hands: openHands })));
  renderPairs("/pairs");
  expect(await screen.findByRole("link", { name: /^Средний 16\/16/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /^Сложный 0\/20/ })).toBeInTheDocument();
});

it("прямой заход на закрытый стол не собирает колоду", async () => {
  vi.stubGlobal("fetch", vi.fn(pairsFetch({ easy: 12, medium: 15 }, { ...spot, id: "bb-vs-bu", mode: "vs", hands: mediumHands })));
  renderPairs("/pairs/bb-vs-bu?level=hard");
  expect(await screen.findByText("Сложный стол откроется после 16 засчитанных партий на среднем.")).toBeInTheDocument();
  expect(screen.queryByText("ATs")).not.toBeInTheDocument();
  expect(screen.queryByText(/восьми действий/)).not.toBeInTheDocument();
});

it("средний стол называет точное действие и держит превью пять секунд", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      pairsFetch(
        { easy: 12 },
        { ...spot, id: "bb-vs-bu", title: "BB против BU", mode: "vs", stack: null, hands: mediumHands },
      ),
    ),
  );
  renderPairs("/pairs/bb-vs-bu?level=medium");
  expect(await screen.findByText("3bet 6-8bb")).toBeInTheDocument();
  expect(screen.getByText("Превью: 5 с")).toBeInTheDocument();
  expect(screen.getByText("Стек не задан")).toBeInTheDocument();
  expect(screen.queryByText("Открытие")).not.toBeInTheDocument();
});

