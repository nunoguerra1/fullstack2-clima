import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Forecast } from "./Forecast";

@Entity({ name: "weather_data" })
export class Weather {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    city!: string;

    @Column("float")
    temperature!: number;

    @Column("float")
    windSpeed!: number;

    @Column()
    isDay!: boolean;

    @Column()
    weatherCode!: number;

    @Column({ nullable: true })
    ownerId!: number;

    @OneToMany(() => Forecast, (forecast) => forecast.weather, { cascade: true, eager: true })
    forecast!: Forecast[];
}