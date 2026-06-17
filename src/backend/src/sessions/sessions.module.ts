import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SessionsController } from './controllers/sessions.controller';
import { ISessionsRepository } from './domain/interfaces/sessions.repository.interface';
import { ISessionsService } from './domain/interfaces/sessions.service.interface';
import { SessionsRepository } from './repositories/sessions.repository';
import { SessionsService } from './services/sessions.service';

@Module({
  imports: [AuthModule],
  controllers: [SessionsController],
  providers: [
    SessionsService,
    SessionsRepository,
    {
      provide: ISessionsService,
      useExisting: SessionsService,
    },
    {
      provide: ISessionsRepository,
      useExisting: SessionsRepository,
    },
  ],
})
export class SessionsModule {}
