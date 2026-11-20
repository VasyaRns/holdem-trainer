import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Shell } from "@/components/shell";
import { RangesPage } from "./ranges-page";

const spot = {
  id: "fixture-open",
  title: "Фикстур, открытие, 10bb",
  hero: "UTG",
  mode: "open",
  opponent: null,
  stack: 10,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderRanges(path = "/ranges") {
  const router = createMemoryRouter(
    [
      {
        element: <Shell />,
        children: [
          { path: "ranges", element: <RangesPage /> },
          { path: "ranges/:chartId", element: <RangesPage /> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

it("список приходит без рук, один спот запрашивается отдельно", async () => {
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      urls.push(String(url));
      if (String(url) === "/api/charts") {
        return new Response(JSON.stringify({ charts: [spot] }), { status: 200 });
      }
      return new Response(
        JSON.stringify({ chart: { ...spot, hands: { AA: { parts: [{ action: "Push", weight: 1 }] } } } }),
        { status: 200 },
      );
    }),
  );
  renderRanges();
  const link = await screen.findByRole("link", { name: "Фикстур, открытие, 10bb" });
  expect(link.getAttribute("href")).toBe("/ranges/fixture-open");
  expect(urls).toEqual(["/api/charts"]);

  renderRanges("/ranges/fixture-open");
  expect(await screen.findByText(/Рук в споте: 1/)).toBeInTheDocument();
  expect(urls.filter((url) => url.startsWith("/api/charts/"))).toEqual(["/api/charts/fixture-open"]);
});

it("ошибка одного спота не прячет список", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (String(url) === "/api/charts") return new Response(JSON.stringify({ charts: [spot] }), { status: 200 });
      return new Response(JSON.stringify({ error: "Спот не найден" }), { status: 404 });
    }),
  );
  renderRanges("/ranges/missing");
  expect(await screen.findByRole("link", { name: "Фикстур, открытие, 10bb" })).toBeInTheDocument();
  expect(await screen.findByText("Спот не найден")).toBeInTheDocument();
  expect(screen.queryByText(/Рук в споте/)).not.toBeInTheDocument();
});

it("без файла не показывает свой чарт", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Чарты не подключены" }), { status: 503 })));
  renderRanges();
  expect(await screen.findByText("Чарты не подключены")).toBeInTheDocument();
  expect(screen.getByText("Своего чарта нет.")).toBeInTheDocument();
  expect(screen.queryByText(/Рук в споте/)).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Простой" })).not.toBeInTheDocument();
});
