import "reflect-metadata";
import express from "express";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "./config/database";
import { authRoutes } from "./routes/authRoutes";
import { User } from "./models/User";
import bcrypt from "bcrypt";

const app = express();
const PORT = 3001;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Muitas requisições originadas deste IP, tente novamente mais tarde." }
});

app.use(limiter);
app.use(cors());
app.use(compression());
app.use(express.json());

app.use("/auth", authRoutes);

AppDataSource.initialize()
    .then(async () => {
        console.log("[AUTH-SERVICE] Banco de dados PostgreSQL conectado com sucesso!");

        const userRepository = AppDataSource.getRepository(User);
        const userCount = await userRepository.count();

        if (userCount === 0) {
            console.log("[AUTH-SERVICE] Populando banco de dados com usuários de teste...");

            const testUsers = [
                { username: "anderson_prof", password: "password123" },
                { username: "aluno_clima", password: "clima456" }
            ];

            for (const u of testUsers) {
                const hashedPassword = await bcrypt.hash(u.password, 10);
                const user = userRepository.create({ username: u.username, password: hashedPassword });
                await userRepository.save(user);
            }
            console.log("[AUTH-SERVICE] Usuários de teste criados com sucesso! (Senhas criptografadas)");
        }

        app.listen(PORT, () => {
            console.log(`[AUTH-SERVICE] Rodando perfeitamente na porta ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("[AUTH-SERVICE] Erro fatal ao inicializar banco de dados:", error);
    });