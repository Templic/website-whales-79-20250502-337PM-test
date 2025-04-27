import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./main.css";
import "./components/cosmic/cosmic-animations.css";
import "./components/shop/shop-animations.css";
import "./styles/orientation.css";
import { ThemeProvider } from "./components/ui/ThemeProvider";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
