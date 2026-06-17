import { Injectable, Logger } from '@nestjs/common';
import { CurrentWeatherEntity } from '../domain/entities/current-weather.entity';
import { IWeatherService } from '../domain/interfaces/weather.service.interface';

type OpenMeteoCurrentResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
  };
};

@Injectable()
export class WeatherService implements IWeatherService {
  private readonly logger = new Logger(WeatherService.name);

  async getCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeatherEntity> {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code');
    url.searchParams.set('timezone', 'America/Sao_Paulo');

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Open-Meteo respondeu com status ${response.status}.`);
      }

      const data = (await response.json()) as OpenMeteoCurrentResponse;
      const temperature = data.current?.temperature_2m ?? null;
      const humidity = data.current?.relative_humidity_2m ?? null;
      const weatherCode = data.current?.weather_code ?? null;

      return {
        temperature,
        humidity,
        weatherCode,
        description: this.mapWeatherCodeToDescription(weatherCode),
      };
    } catch (error) {
      this.logger.warn(
        `Falha ao consultar clima para latitude=${latitude} longitude=${longitude}.`,
      );

      return {
        temperature: null,
        humidity: null,
        weatherCode: null,
        description: null,
      };
    }
  }

  private mapWeatherCodeToDescription(weatherCode: number | null): string | null {
    if (weatherCode === null) {
      return null;
    }

    const descriptions: Record<number, string> = {
      0: 'Ceu limpo',
      1: 'Principalmente limpo',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Neblina',
      48: 'Neblina com geada',
      51: 'Garoa leve',
      53: 'Garoa moderada',
      55: 'Garoa intensa',
      56: 'Garoa congelante leve',
      57: 'Garoa congelante intensa',
      61: 'Chuva leve',
      63: 'Chuva moderada',
      65: 'Chuva forte',
      66: 'Chuva congelante leve',
      67: 'Chuva congelante forte',
      71: 'Neve leve',
      73: 'Neve moderada',
      75: 'Neve forte',
      77: 'Graos de neve',
      80: 'Pancadas de chuva leves',
      81: 'Pancadas de chuva moderadas',
      82: 'Pancadas de chuva fortes',
      85: 'Pancadas de neve leves',
      86: 'Pancadas de neve fortes',
      95: 'Trovoada',
      96: 'Trovoada com granizo leve',
      99: 'Trovoada com granizo forte',
    };

    return descriptions[weatherCode] ?? 'Clima desconhecido';
  }
}
