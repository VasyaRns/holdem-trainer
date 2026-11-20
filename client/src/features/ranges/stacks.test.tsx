import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { StacksPage } from "./stacks-page";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("смена стека меняет подпись действия", async () => {
  const held: Array<() => void> = [];
  let charts = 0;
  const release = () => held.splice(0).forEach((resolve) => resolve());
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (String(url) === "/api/charts") {
        return new Response(
          JSON.stringify({
            charts: [
              { id: "utg-open-10", title: "UTG 10", hero: "UTG", mode: "open", opponent: null, stack: 10 },
              { id: "utg-open-20", title: "UTG 20", hero: "UTG", mode: "open", opponent: null, stack: 20 },
              { id: "bu-open-10", title: "BU 10", hero: "BU", mode: "open", opponent: null, stack: 10 },
            ],
          }),
          { status: 200 },
        );
      }
      charts += 1;
      if (charts > 2) await new Promise<void>((resolve) => held.push(resolve));
      if (String(url).endsWith("utg-open-10")) {
        return new Response(
          JSON.stringify({
            chart: { hands: { AA: { parts: [{ action: "Push", weight: 1 }] }, AKs: { parts: [{ action: "Open-2bb", weight: 1 }] } } },
          }),
          { status: 200 },
        );
      }
      if (String(url).endsWith("bu-open-10")) {
        return new Response(JSON.stringify({ chart: { hands: { AA: { parts: [{ action: "Limp", weight: 1 }] } } } }), { status: 200 });
      }
      return new Response(JSON.stringify({ chart: { hands: { AA: { parts: [{ action: "Open-2bb", weight: 1 }] } } } }), { status: 200 });
    }),
  );
  const router = createMemoryRouter([{ path: "/ranges/stacks", element: <StacksPage /> }], { initialEntries: ["/ranges/stacks"] });
  render(<RouterProvider router={router} />);
  expect(await screen.findByText(/10bb · Push/)).toBeInTheDocument();
  expect(screen.getByText(/20bb · Open-2bb/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Правый стек"), { target: { value: "10" } });
  expect(screen.queryByText(/bb ·/)).not.toBeInTheDocument();
  release();
  await waitFor(() => expect(screen.getAllByText(/10bb · Push/)).toHaveLength(2));
  expect(screen.queryByText(/Open-2bb/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Рука"), { target: { value: "kAs" } });
  expect(screen.queryByText(/bb ·/)).not.toBeInTheDocument();
  release();
  await waitFor(() => expect(screen.getAllByText(/10bb · Open-2bb/)).toHaveLength(2));
  fireEvent.change(screen.getByLabelText("Позиция"), { target: { value: "BU" } });
  fireEvent.change(screen.getByLabelText("Рука"), { target: { value: "AA" } });
  release();
  await waitFor(() => expect(screen.getAllByText(/10bb · Limp/)).toHaveLength(2));
  expect(screen.queryByText(/20bb/)).not.toBeInTheDocument();
});
