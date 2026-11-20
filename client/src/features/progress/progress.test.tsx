import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Shell } from "@/components/shell";
import { ProgressPage } from "./progress-page";

function mock(achievements: string[], total = 0, accuracy = 0) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (String(url).includes("/api/achievements")) {
        return new Response(JSON.stringify({ achievements }), { status: 200 });
      }
      return new Response(JSON.stringify({ total, count: Math.min(total, 20), correct: 0, accuracy }), { status: 200 });
    }),
  );
}

function renderProgress() {
  const router = createMemoryRouter([{ element: <Shell />, children: [{ path: "progress", element: <ProgressPage /> }] }], {
    initialEntries: ["/progress"],
  });
  render(<RouterProvider router={router} />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("показывает достижения, которые уже записаны", async () => {
  mock(["first_session", "streak_10"]);
  renderProgress();
  expect(await screen.findByText("Первая сессия")).toBeInTheDocument();
  expect(screen.getByText("Серия 10")).toBeInTheDocument();
});

it("пустой список не выдумывает достижение", async () => {
  mock([]);
  renderProgress();
  expect(await screen.findByText("Достижений пока нет.")).toBeInTheDocument();
});

it("показывает 48/60, одну сессию до квоты и сегодняшний уровень", async () => {
  mock(["first_session"], 48, 0.95);
  renderProgress();
  expect(await screen.findAllByText(/48\/60/)).toHaveLength(7);
  expect(screen.getAllByText(/ещё 1 сессия/)).toHaveLength(7);
  expect(screen.getByRole("link", { name: "Ауты, простой" })).toBeInTheDocument();
});
