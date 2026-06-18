import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Forecast } from "./Forecast";

@Entity({ name: "weather_data" })
export class Weather {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    city!: string;

    @Column("float")
    temperature!: number;

    @Column("float")
    windSpeed!: number;

    @Column()
    isDay!: boolean;

    @Column()
    weatherCode!: number;

    @OneToMany(() => Forecast, (forecast) => forecast.weather, { cascade: true, eager: true })
    forecast!: Forecast[];
}