import "reflect-metadata";
import express from "express";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "./config/database";
import { redisClient } from "./config/redis";
import { weatherRoutes } from "./routes/weatherRoutes";
import { Weather } from "./models/Weather";
import { Forecast } from "./models/Forecast";

const app = express();
const PORT = 3002;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: { error: "Muitas requisições originadas deste IP." }
});

app.use(limiter);
app.use(cors());
app.use(compression());
app.use(express.json());

app.use("/weather", weatherRoutes);

async function seedDatabase() {
    const weatherRepository = AppDataSource.getRepository(Weather);
    const count = await weatherRepository.count();

    if (count === 0) {
        console.log("[RESOURCE-SERVICE] Populando dados climáticos de Cornélio Procópio e região...");

        const regionData = [
            {
                city: "Cornélio Procópio, Brasil",
                temperature: 24.5,
                windSpeed: 12.3,
                isDay: true,
                weatherCode: 3,
                forecasts: [
                    { date: "2026-06-19", maxTemp: 27.0, minTemp: 16.0, weatherCode: 1 },
                    { date: "2026-06-20", maxTemp: 25.5, minTemp: 15.0, weatherCode: 3 },
                    { date: "2026-06-21", maxTemp: 28.1, minTemp: 17.2, weatherCode: 0 }
                ]
            },
            {
                city: "Londrina, Brasil",
                temperature: 26.1,
                windSpeed: 14.2,
                isDay: true,
                weatherCode: 0,
                forecasts: [
                    { date: "2026-06-19", maxTemp: 29.0, minTemp: 18.0, weatherCode: 0 },
                    { date: "2026-06-20", maxTemp: 30.2, minTemp: 19.5, weatherCode: 1 },
                    { date: "2026-06-21", maxTemp: 27.0, minTemp: 16.0, weatherCode: 2 }
                ]
            },
            {
                city: "Bandeirantes, Brasil",
                temperature: 23.0,
                windSpeed: 10.5,
                isDay: true,
                weatherCode: 51,
                forecasts: [
                    { date: "2026-06-19", maxTemp: 24.0, minTemp: 15.0, weatherCode: 61 },
                    { date: "2026-06-20", maxTemp: 26.0, minTemp: 14.0, weatherCode: 3 },
                    { date: "2026-06-21", maxTemp: 27.5, minTemp: 16.1, weatherCode: 0 }
                ]
            }
        ];

        for (const data of regionData) {
            const weather = new Weather();
            weather.city = data.city;
            weather.temperature = data.temperature;
            weather.windSpeed = data.windSpeed;
            weather.isDay = data.isDay;
            weather.weatherCode = data.weatherCode;

            weather.forecast = data.forecasts.map(f => {
                const forecast = new Forecast();
                forecast.date = f.date;
                forecast.maxTemp = f.maxTemp;
                forecast.minTemp = f.minTemp;
                forecast.weatherCode = f.weatherCode;
                return forecast;
            });

            await weatherRepository.save(weather);
        }
        console.log("[RESOURCE-SERVICE] Base de dados climática inicializada com sucesso!");
    }
}

async function startServer() {
    try {
        await AppDataSource.initialize();
        console.log("[RESOURCE-SERVICE] Banco PostgreSQL conectado com sucesso.");

        await redisClient.connect();
        console.log("[RESOURCE-SERVICE] Conectado ao Redis Pub/Sub com sucesso.");

        await seedDatabase();

        app.listen(PORT, () => {
            console.log(`[RESOURCE-SERVICE] Rodando perfeitamente na porta ${PORT}`);
        });
    } catch (error) {
        console.error("[RESOURCE-SERVICE] Erro fatal na inicialização:", error);
    }
}

startServer();