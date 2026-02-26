import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppLayout from "@/app/layout";
import AppPage from "@/app/page";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppLayout>
      <AppPage />
    </AppLayout>
  </StrictMode>
);
