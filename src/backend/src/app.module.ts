import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './infra/database/database.module';
import { PatientsModule } from './patients/patients.module';

@Module({
  imports: [DatabaseModule, AuthModule, PatientsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
