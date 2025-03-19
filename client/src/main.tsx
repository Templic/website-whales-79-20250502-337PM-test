import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found");
} else {
  try {
    createRoot(root).render(<App />);
  } catch (error) {
    console.error("Failed to render app:", error);
    root.innerHTML =
      '<div>Failed to load application. Please check console for errors.</div>';
  }
}