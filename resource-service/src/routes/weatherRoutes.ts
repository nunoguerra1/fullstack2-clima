import { Router, Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Weather } from "../models/Weather";
import { redisClient } from "../config/redis";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = "chave_secreta_compartilhada_super_segura_123";

const authMiddleware = (req: Request, res: Response, next: NextFunction): any => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.error("[RESOURCE-SERVICE] Acesso negado: Token não fornecido.");
        return res.status(401).json({ error: "Acesso negado. Token não fornecido." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded;
        next();
    } catch (error) {
        console.error("[RESOURCE-SERVICE] Acesso negado: Token inválido ou expirado.");
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
};

router.get("/search", authMiddleware, async (req: Request, res: Response): Promise<any> => {
    const { city } = req.query;

    if (!city) {
        return res.status(400).json({ error: "O nome da cidade é obrigatório." });
    }

    try {
        const weatherRepository = AppDataSource.getRepository(Weather);

        const weatherData = await weatherRepository.createQueryBuilder("weather")
            .leftJoinAndSelect("weather.forecast", "forecast")
            .where("LOWER(weather.city) LIKE LOWER(:city)", { city: `%${city.toString().trim()}%` })
            .getOne();

        if (!weatherData) {
            console.warn(`[RESOURCE-SERVICE] Cidade não cadastrada no sistema local: ${city}`);
            return res.status(404).json({ error: "Cidade não encontrada na base de dados da região." });
        }

        const eventPayload = {
            event: "WEATHER_QUERIED",
            city: weatherData.city,
            temperature: weatherData.temperature,
            timestamp: new Date().toISOString()
        };

        await redisClient.publish("weather_events", JSON.stringify(eventPayload));
        console.log(`[RESOURCE-SERVICE] Evento de consulta enviado ao Redis para: ${weatherData.city}`);

        return res.json(weatherData);

    } catch (error) {
        console.error("[RESOURCE-SERVICE] Erro ao buscar clima:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

export { router as weatherRoutes };