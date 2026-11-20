import { registry } from "@holdem/engine";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Shell } from "@/components/shell";
import { CatalogPage } from "@/features/catalog/catalog-page";

it("каталог показывает ровно тренажёры из реестра", () => {
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

  expect(screen.getByText("Тренажёр холдема")).toBeInTheDocument();

  const drillLinks = screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("/train/"));
  expect(drillLinks).toHaveLength(registry.length * 3);

  const placeholder = screen.queryByText("Тренажёры появятся следующими блоками.");
  if (registry.length === 0) {
    expect(placeholder).toBeInTheDocument();
  } else {
    expect(placeholder).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Простой" })).toHaveLength(registry.length);
  }
});
