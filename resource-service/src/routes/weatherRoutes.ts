import { Router, Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Weather } from "../models/Weather";
import { Forecast } from "../models/Forecast";
import { redisClient } from "../config/redis";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = "chave_secreta_compartilhada_super_segura_123";

const authMiddleware = (req: Request, res: Response, next: NextFunction): any => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Acesso negado. Token não fornecido." });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
};

router.get("/search", authMiddleware, async (req: Request, res: Response): Promise<any> => {
    const { city } = req.query;
    try {
        const weatherRepository = AppDataSource.getRepository(Weather);

        if (!city) {
            const allData = await weatherRepository.find();
            return res.json(allData);
        }

        const weatherData = await weatherRepository.createQueryBuilder("weather")
            .leftJoinAndSelect("weather.forecast", "forecast")
            .where("LOWER(weather.city) LIKE LOWER(:city)", { city: `%${city.toString().trim()}%` })
            .getOne();

        if (!weatherData) return res.status(404).json({ error: "Cidade não encontrada na base local." });

        return res.json(weatherData);
    } catch (error) {
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

router.post("/", authMiddleware, async (req: Request, res: Response): Promise<any> => {
    const { city, temperature, windSpeed, isDay, weatherCode, forecast } = req.body;
    const user = (req as any).user;

    if (!city || temperature === undefined || !forecast || forecast.length === 0) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes ou previsão vazia." });
    }

    try {
        const weatherRepository = AppDataSource.getRepository(Weather);
        const weather = weatherRepository.create({
            city, temperature, windSpeed, isDay, weatherCode,
            ownerId: user.id,
            forecast: forecast.map((f: any) => {
                const entry = new Forecast();
                entry.date = f.date;
                entry.maxTemp = f.maxTemp;
                entry.minTemp = f.minTemp;
                entry.weatherCode = f.weatherCode;
                return entry;
            })
        });

        await weatherRepository.save(weather);

        await redisClient.publish("weather_events", JSON.stringify({ event: "recurso.criado", city }));

        return res.status(201).json(weather);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao inserir registro." });
    }
});

router.put("/:id", authMiddleware, async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { temperature, windSpeed, weatherCode } = req.body;
    const user = (req as any).user;

    try {
        const weatherRepository = AppDataSource.getRepository(Weather);
        const weather = await weatherRepository.findOne({ where: { id: Number(id) } });

        if (!weather) return res.status(404).json({ error: "Registro não encontrado." });

        if (weather.ownerId !== user.id) {
            console.warn(`[RESOURCE-SERVICE] Bloqueado: Usuário ${user.id} tentou alterar dados pertencentes ao Usuário ${weather.ownerId}`);
            return res.status(403).json({ error: "Proibido: Você não é o proprietário deste registro." });
        }

        weather.temperature = temperature ?? weather.temperature;
        weather.windSpeed = windSpeed ?? weather.windSpeed;
        weather.weatherCode = weatherCode ?? weather.weatherCode;

        await weatherRepository.save(weather);
        await redisClient.publish("weather_events", JSON.stringify({ event: "recurso.atualizado", city: weather.city }));

        return res.json(weather);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao atualizar registro." });
    }
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const user = (req as any).user;

    try {
        const weatherRepository = AppDataSource.getRepository(Weather);
        const weather = await weatherRepository.findOne({ where: { id: Number(id) } });

        if (!weather) return res.status(404).json({ error: "Registro não encontrado." });

        if (weather.ownerId !== user.id) {
            return res.status(403).json({ error: "Proibido: Você não é o proprietário deste registro." });
        }

        await weatherRepository.remove(weather);
        await redisClient.publish("weather_events", JSON.stringify({ event: "recurso.excluido", city: weather.city }));

        return res.json({ message: "Registro excluído com sucesso." });
    } catch (error) {
        return res.status(500).json({ error: "Erro ao excluir registro." });
    }
});

export { router as weatherRoutes };