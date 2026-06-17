import { Module } from '@nestjs/common';
import { IWeatherService } from './domain/interfaces/weather.service.interface';
import { WeatherService } from './services/weather.service';

@Module({
  providers: [
    WeatherService,
    {
      provide: IWeatherService,
      useExisting: WeatherService,
    },
  ],
  exports: [IWeatherService],
})
export class WeatherModule {}
