import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PatientsController } from './controllers/patients.controller';
import { CreatePatientRepository } from './repositories/create-patient.repository';
import { PatientsService } from './services/patients.service';
import { ICreatePatientRepository } from './domain/interfaces/create-patient.repository.interface';
import { IPatientsService } from './domain/interfaces/patients.service.interface';

@Module({
  imports: [AuthModule],
  controllers: [PatientsController],
  providers: [
    PatientsService,
    CreatePatientRepository,
    {
      provide: IPatientsService,
      useExisting: PatientsService,
    },
    {
      provide: ICreatePatientRepository,
      useExisting: CreatePatientRepository,
    },
  ],
})
export class PatientsModule {}
