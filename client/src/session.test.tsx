import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Shell } from "@/components/shell";
import { GuidePage } from "@/features/guide/guide-page";
import { SessionPage } from "@/features/session/session-page";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/api/intros") && init?.method !== "POST") {
        return new Response(JSON.stringify({ seen: true }), { status: 200 });
      }
      if (String(url).includes("/api/sessions") && init?.method === "POST" && !String(url).includes("answers")) {
        return new Response(JSON.stringify({ id: "session-1", unlocked: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({ id: "answer-1", unlocked: [] }), { status: 200 });
    }),
  );
});

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <Shell />,
        children: [
          { path: "guide", element: <GuidePage /> },
          { path: "train/:drillId", element: <SessionPage /> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

it("справочник объясняет ICM и не даёт тренировать несуществующий режим", async () => {
  renderAt("/guide");
  expect(screen.getAllByText(/50, 30 и 20/).length).toBeGreaterThan(0);
  expect(screen.getAllByText("Тренажёра пока нет").length).toBeGreaterThan(0);
  const filter = screen.getByLabelText("Фильтр терминов");
  fireEvent.change(filter, { target: { value: "эквити" } });
  expect(screen.getByText("Эквити")).toBeInTheDocument();
  expect(screen.queryByText("Бэкдор")).not.toBeInTheDocument();
});

it("если сессия не открылась, вопрос не начинается", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (String(url).includes("/api/intros")) return new Response(JSON.stringify({ seen: true }), { status: 200 });
      return new Response("нет", { status: 500 });
    }),
  );
  renderAt("/train/outs?level=easy");
  expect(await screen.findByText("Сессия не открылась.")).toBeInTheDocument();
  expect(screen.queryByLabelText("Ответ")).not.toBeInTheDocument();
});

it("средний закрыт, пока простой не набрал квоту", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/api/intros") && init?.method !== "POST") {
        return new Response(JSON.stringify({ seen: true }), { status: 200 });
      }
      if (String(url).includes("/levels/")) {
        return new Response(JSON.stringify({ total: 12, count: 12, correct: 10, accuracy: 0.8 }), { status: 200 });
      }
      return new Response(JSON.stringify({ id: "session-1", unlocked: [] }), { status: 200 });
    }),
  );
  renderAt("/train/outs?level=medium");
  expect(await screen.findByText(/Сейчас 12\/60 и 80%/)).toBeInTheDocument();
  expect(screen.queryByLabelText("Ответ")).not.toBeInTheDocument();
});

it("новое достижение остаётся на вопросе", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/api/intros") && init?.method !== "POST") {
        return new Response(JSON.stringify({ seen: true }), { status: 200 });
      }
      if (String(url).includes("/api/sessions") && init?.method === "POST" && !String(url).includes("answers")) {
        return new Response(JSON.stringify({ id: "session-1", unlocked: ["first_session"] }), { status: 200 });
      }
      return new Response(JSON.stringify({ id: "answer-1", unlocked: [] }), { status: 200 });
    }),
  );
  renderAt("/train/outs?level=easy");
  expect(await screen.findByText(/Первая сессия/)).toBeInTheDocument();
  expect(await screen.findByLabelText("Ответ")).toBeInTheDocument();
});

it("неверный аут показывает формулу и остаётся на вопросе", async () => {
  renderAt("/train/outs?level=easy");
  const input = await screen.findByLabelText("Ответ");
  fireEvent.change(input, { target: { value: "1" } });
  fireEvent.submit(input.closest("form")!);
  expect(await screen.findByText(/Мимо/)).toBeInTheDocument();
});
