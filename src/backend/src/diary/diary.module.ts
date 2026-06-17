import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { WeatherModule } from '../weather/weather.module';
import { DiaryController } from './controllers/diary.controller';
import { IDiaryRepository } from './domain/interfaces/diary.repository.interface';
import { IDiaryService } from './domain/interfaces/diary.service.interface';
import { DiaryRepository } from './repositories/diary.repository';
import { DiaryService } from './services/diary.service';

@Module({
  imports: [AuthModule, WeatherModule, StorageModule],
  controllers: [DiaryController],
  providers: [
    DiaryService,
    DiaryRepository,
    {
      provide: IDiaryService,
      useExisting: DiaryService,
    },
    {
      provide: IDiaryRepository,
      useExisting: DiaryRepository,
    },
  ],
})
export class DiaryModule {}
