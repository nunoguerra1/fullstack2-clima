import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Weather } from "./Weather";

@Entity({ name: "forecast_days" })
export class Forecast {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    date!: string;

    @Column("float")
    maxTemp!: number;

    @Column("float")
    minTemp!: number;

    @Column()
    weatherCode!: number;

    @ManyToOne(() => Weather, (weather) => weather.forecast, { onDelete: "CASCADE" })
    weather!: Weather;
}