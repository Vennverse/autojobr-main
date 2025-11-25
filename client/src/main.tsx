
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { PWAService } from "./lib/pwa";
import { clarity } from "react-microsoft-clarity";

// Initialize Microsoft Clarity
const clarityId = import.meta.env.VITE_CLARITY_ID;
if (clarityId) {
  try {
    clarity.init(clarityId);
    console.log("Microsoft Clarity initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Microsoft Clarity:", error);
  }
} else {
  console.warn("VITE_CLARITY_ID not found - Microsoft Clarity will not be enabled");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA Service Worker
if (import.meta.env.PROD) {
  PWAService.registerServiceWorker().catch(console.error);
}
