import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { router } from "@/back-office/routes/router";
import { AppThemeProvider } from "@/shared/theme/AppThemeProvider";
import "@/shared/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppThemeProvider>
      <RouterProvider router={router} />
    </AppThemeProvider>
  </StrictMode>,
);
