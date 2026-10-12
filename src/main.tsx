import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { loadTheme } from "./lib/theme";
import "./styles/tokens.css";
import "./styles/themes.generated.css";
import "./styles/ui.css";
import "./styles/themes.css";

// set before first paint so a saved theme does not flash the standard look
document.documentElement.dataset.theme = loadTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
