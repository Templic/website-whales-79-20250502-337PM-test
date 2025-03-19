import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found");
} else {
  try {
    console.log("Attempting to render React app...");
    const app = createRoot(root);
    app.render(<App />);
    console.log("React app rendered successfully");
  } catch (error) {
    console.error("Failed to render app:", error);
    root.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Application Error</h2>
        <p>Failed to load application. Please check console for errors.</p>
        <pre style="background: #f5f5f5; padding: 10px;">${error?.message || 'Unknown error'}</pre>
      </div>
    `;
  }
}