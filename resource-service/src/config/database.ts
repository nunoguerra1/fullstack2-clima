import "reflect-metadata";
import { DataSource } from "typeorm";
import { Weather } from "../models/Weather";
import { Forecast } from "../models/Forecast";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "admin",
    password: "supersecretpassword",
    database: "clima_resource",
    synchronize: true,
    logging: false,
    entities: [Weather, Forecast],
    extra: {
        max: 10,
        idleTimeoutMillis: 30000
    }
});