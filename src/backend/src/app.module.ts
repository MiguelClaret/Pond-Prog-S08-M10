import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DiaryModule } from './diary/diary.module';
import { DatabaseModule } from './infra/database/database.module';
import { PatientsModule } from './patients/patients.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [DatabaseModule, AuthModule, PatientsModule, DiaryModule, WeatherModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
