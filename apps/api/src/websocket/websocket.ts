import { WebSocketServer, WebSocket, type Server } from "ws";
import type { Server as HTTPServer } from "http";
import type { WSMessage } from "@emma/shared";

// WebSocket server with type-safe message handling
export class WSServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server?: HTTPServer) {
    if (server) {
      this.wss = new WebSocketServer({ server });
    } else {
      const port = parseInt(process.env.WS_PORT || "3001");
      this.wss = new WebSocketServer({ port });
    }
    this.setup();
  }

  private setup(): void {
    this.wss.on("connection", (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(`✅ WebSocket client connected. Total: ${this.clients.size}`);

      ws.on("close", () => {
        this.clients.delete(ws);
        console.log(`❌ WebSocket client disconnected. Total: ${this.clients.size}`);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });
  }

  // Type-safe message broadcasting
  broadcast(message: WSMessage): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  close(): void {
    this.wss.close();
  }
}

// Global WebSocket server instance for worker access
export let globalWSServer: WSServer | null = null;

export function setGlobalWSServer(wss: WSServer): void {
  globalWSServer = wss;
}

export function getGlobalWSServer(): WSServer | null {
  return globalWSServer;
}
