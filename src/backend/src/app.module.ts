import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DiaryModule } from './diary/diary.module';
import { DatabaseModule } from './infra/database/database.module';
import { PatientsModule } from './patients/patients.module';
import { SessionsModule } from './sessions/sessions.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [DatabaseModule, AuthModule, PatientsModule, DiaryModule, WeatherModule, SessionsModule]
})
export class AppModule {}
