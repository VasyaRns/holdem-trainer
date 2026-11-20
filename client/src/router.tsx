import { createBrowserRouter } from "react-router-dom";
import { Shell } from "@/components/shell";
import { CatalogPage } from "@/features/catalog/catalog-page";
import { ProgressPage } from "@/features/progress/progress-page";
import { EmptyTrainPage } from "@/features/session/empty-train-page";

export const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: "progress", element: <ProgressPage /> },
      { path: "train/:drillId", element: <EmptyTrainPage /> },
    ],
  },
]);
