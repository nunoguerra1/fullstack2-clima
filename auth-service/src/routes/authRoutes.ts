import { Router, Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { JWT_SECRET, JWT_EXPIRES_IN, tokenBlacklist } from "../config/auth";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", async (req: Request, res: Response): Promise<any> => {
    const { username, password } = req.body;

    if (!username || !password) {
        console.error("[AUTH-SERVICE] Erro de validação: Usuário ou senha ausentes.");
        return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { username } });

        if (!user) {
            console.warn(`[AUTH-SERVICE] Tentativa de login inválida para o usuário: ${username}`);
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.warn(`[AUTH-SERVICE] Senha incorreta para o usuário: ${username}`);
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        console.log(`[AUTH-SERVICE] Usuário autenticado com sucesso: ${username}`);
        return res.json({ token, user: { id: user.id, username: user.username } });

    } catch (error) {
        console.error("[AUTH-SERVICE] Erro interno no servidor durante login:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

router.post("/logout", (req: Request, res: Response): any => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(400).json({ error: "Token não fornecido." });
    }

    const token = authHeader.split(" ")[1];
    if (token) {
        tokenBlacklist.add(token);
        console.log("[AUTH-SERVICE] Token revogado com sucesso no logout.");
    }

    return res.json({ message: "Logout realizado com sucesso." });
});

export { router as authRoutes };