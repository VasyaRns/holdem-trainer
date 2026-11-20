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
  expect(screen.getByText(/50, 30 и 20/)).toBeInTheDocument();
  expect(screen.getAllByText("Тренажёра пока нет").length).toBeGreaterThan(0);
  const filter = screen.getByLabelText("Фильтр терминов");
  fireEvent.change(filter, { target: { value: "эквити" } });
  expect(screen.getByText("Эквити")).toBeInTheDocument();
  expect(screen.queryByText("Бэкдор")).not.toBeInTheDocument();
});

it("неверный аут показывает формулу и остаётся на вопросе", async () => {
  renderAt("/train/outs?level=easy");
  const input = await screen.findByLabelText("Ответ");
  fireEvent.change(input, { target: { value: "1" } });
  fireEvent.submit(input.closest("form")!);
  expect(await screen.findByText(/Мимо/)).toBeInTheDocument();
});
