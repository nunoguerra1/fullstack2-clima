import { Router, Request, Response } from "express";
import { WebSocketServer, WebSocket } from "ws";

const router = Router();

const connectedClients = new Set<WebSocket>();

router.get("/health", (req: Request, res: Response) => {
    console.log("[NOTIFICATION-SERVICE] Log de monitoramento: Health-check acessado.");
    res.json({ status: "UP", service: "notification-service" });
});

export function setupWebSocket(wss: WebSocketServer) {
    wss.on("connection", (ws: WebSocket) => {
        console.log("[NOTIFICATION-SERVICE] Conexão WebSocket estabelecida com um cliente Frontend.");
        connectedClients.add(ws);

        ws.on("close", () => {
            console.log("[NOTIFICATION-SERVICE] Cliente Frontend desconectado do WebSocket.");
            connectedClients.delete(ws);
        });

        ws.on("error", (error) => {
            console.error("[NOTIFICATION-SERVICE] Erro detectado na conexão de um cliente WS:", error);
        });
    });
}

export function broadcastMessage(message: string) {
    console.log(`[NOTIFICATION-SERVICE] Retransmitindo evento para ${connectedClients.size} cliente(s) ativo(s).`);

    for (const client of connectedClients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

export { router as notifyRoutes };