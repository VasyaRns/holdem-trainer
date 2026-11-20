import { registry } from "@holdem/engine";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Shell } from "@/components/shell";
import { CatalogPage } from "@/features/catalog/catalog-page";

function levelResponse(total: number, accuracy: number) {
  return new Response(JSON.stringify({ total, count: total, correct: Math.round(total * accuracy), accuracy }), { status: 200 });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => levelResponse(0, 0)));
});

function renderCatalog() {
  const router = createMemoryRouter(
    [
      {
        element: <Shell />,
        children: [{ index: true, element: <CatalogPage /> }],
      },
    ],
    { initialEntries: ["/"] },
  );
  render(<RouterProvider router={router} />);
}

it("каталог показывает ровно тренажёры из реестра", async () => {
  renderCatalog();

  expect(screen.getByText("Тренажёр холдема")).toBeInTheDocument();
  expect(await screen.findAllByRole("link", { name: "Простой" })).toHaveLength(registry.length);
  expect(screen.queryByRole("link", { name: "Средний" })).not.toBeInTheDocument();
  expect(screen.getAllByText("Средний")).toHaveLength(registry.length);
  expect(screen.queryByText("Тренажёры появятся следующими блоками.")).not.toBeInTheDocument();
});

it("закрытый простой открывает средний и оставляет сложный закрытым", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => levelResponse(String(url).includes("/levels/easy") ? 60 : 0, String(url).includes("/levels/easy") ? 0.9 : 0)),
  );
  renderCatalog();
  expect(await screen.findAllByRole("link", { name: "Средний" })).toHaveLength(registry.length);
  expect(screen.queryByRole("link", { name: "Сложный" })).not.toBeInTheDocument();
});
