import { redisClient } from "../config/redis";

export async function startQueueConsumer(broadcastCallback: (data: string) => void) {
    const subscriber = redisClient.duplicate();

    await subscriber.connect();
    console.log("[NOTIFICATION-SERVICE] Consumidor da fila conectado com sucesso ao Redis.");

    await subscriber.subscribe("weather_events", (message) => {
        console.log(`[NOTIFICATION-SERVICE] Novo evento consumido da fila: ${message}`);

        broadcastCallback(message);
    });
}