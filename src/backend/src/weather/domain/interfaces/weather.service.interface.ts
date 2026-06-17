import { CurrentWeatherEntity } from '../entities/current-weather.entity';

export abstract class IWeatherService {
  abstract getCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeatherEntity>;
}
