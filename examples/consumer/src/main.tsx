import { ThemeProvider } from "@iroshandezilva/spartant";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

// This example runs its own Tailwind. See src/app.css for the two consumer
// paths and which one applies to you.
import "./app.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
