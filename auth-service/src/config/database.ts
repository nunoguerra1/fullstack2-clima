import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../models/User";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "admin",
    password: "supersecretpassword",
    database: "clima_auth",
    synchronize: true,
    logging: false,
    entities: [User],
    extra: {
        max: 10,
        idleTimeoutMillis: 30000
    }
});