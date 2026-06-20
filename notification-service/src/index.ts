import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { notifyRoutes, setupWebSocket, broadcastMessage } from "./routes/notifyRoutes";
import { startQueueConsumer } from "./models/queueConsumer";

const app = express();
const PORT = 3003;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: "Muitas requisições vindas deste IP." }
});

app.use(limiter);
app.use(cors());
app.use(compression());
app.use(express.json());

app.use("/", notifyRoutes);

setupWebSocket(wss);

startQueueConsumer(broadcastMessage).catch((err) => {
    console.error("[NOTIFICATION-SERVICE] Erro crítico ao rodar o consumidor da fila:", err);
});

server.listen(PORT, () => {
    console.log(`[NOTIFICATION-SERVICE] Servidor e WebSocket rodando perfeitamente na porta ${PORT}`);
});