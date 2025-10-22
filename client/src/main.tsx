import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { PWAService } from "./lib/pwa";

// Fix HMR WebSocket for Replit HTTPS environment
if (import.meta.hot) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  
  // Override Vite's WebSocket connection
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
    if (typeof url === 'string' && url.includes('/@vite/client')) {
      // Use the correct protocol and host for Replit
      url = `${protocol}//${host}${new URL(url, window.location.href).pathname}`;
    }
    return new originalWebSocket(url, protocols);
  } as any;
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