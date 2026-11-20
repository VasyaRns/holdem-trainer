import { createBrowserRouter } from "react-router-dom";
import { Shell } from "@/components/shell";
import { CatalogPage } from "@/features/catalog/catalog-page";
import { ProgressPage } from "@/features/progress/progress-page";
import { GuidePage } from "@/features/guide/guide-page";
import { MistakesPage } from "@/features/mistakes/mistakes-page";
import { RangePlayPage } from "@/features/ranges/play-page";
import { RangesPage } from "@/features/ranges/ranges-page";
import { StacksPage } from "@/features/ranges/stacks-page";
import { SessionPage } from "@/features/session/session-page";
import { TodayPage } from "@/features/today/today-page";

export const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: "progress", element: <ProgressPage /> },
      { path: "today", element: <TodayPage /> },
      { path: "mistakes", element: <MistakesPage /> },
      { path: "guide", element: <GuidePage /> },
      { path: "ranges/play", element: <RangePlayPage /> },
      { path: "ranges/stacks", element: <StacksPage /> },
      { path: "ranges", element: <RangesPage /> },
      { path: "ranges/:chartId", element: <RangesPage /> },
      { path: "train/:drillId", element: <SessionPage /> },
    ],
  },
]);
