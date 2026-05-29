import React from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./router.jsx";
import "../shared/styles/theme.css";
import "../shared/styles/components.css";
import "../shared/styles/tooltips.css";
import "../features/crucible/styles.css";
import "./app-shell.css";
import { startTooltipRuntime } from "../shared/tooltips/tooltip.runtime.js";

startTooltipRuntime();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
