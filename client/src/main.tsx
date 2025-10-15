import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { PWAService } from "./lib/pwa";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA Service Worker
if (import.meta.env.PROD) {
  PWAService.registerServiceWorker().catch(console.error);
}