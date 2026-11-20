import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Shell } from "@/components/shell";
import { MistakesPage } from "./mistakes-page";

function renderMistakes() {
  const router = createMemoryRouter([{ element: <Shell />, children: [{ path: "mistakes", element: <MistakesPage /> }] }], {
    initialEntries: ["/mistakes"],
  });
  render(<RouterProvider router={router} />);
}

it("пустая очередь не задаёт вопрос", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ mistakes: [] }), { status: 200 })));
  renderMistakes();
  expect(await screen.findByText("Открытых ошибок нет.")).toBeInTheDocument();
  expect(screen.queryByLabelText("Ответ")).not.toBeInTheDocument();
});

it("ошибка из очереди остаётся на экране после промаха", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url) === "/api/mistakes") {
        return new Response(JSON.stringify({ mistakes: [{ drillId: "outs", level: "easy", key: "flush" }] }), { status: 200 });
      }
      if (String(url) === "/api/sessions" && init?.method === "POST") {
        return new Response(JSON.stringify({ id: "session-1", unlocked: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({ id: "answer-1", unlocked: [] }), { status: 200 });
    }),
  );
  renderMistakes();
  const input = await screen.findByLabelText("Ответ");
  fireEvent.change(input, { target: { value: "1" } });
  fireEvent.submit(input.closest("form")!);
  expect(await screen.findByText(/Мимо/)).toBeInTheDocument();
  expect(screen.getByText(/ошибки 1\/1/)).toBeInTheDocument();
});
