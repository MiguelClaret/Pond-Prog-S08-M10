import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { loadEnvFile } from 'node:process';
import { AuthController } from "./controllers/auth.controller";
import { AuthGuard } from './guards/auth.guard';
import { AuthRepository } from './repositories/auth.repository';
import { AuthService } from './services/auth.service';
import { IAuthRepository } from './domain/interfaces/auth.repository.interface';
import { IAuthService } from './domain/interfaces/auth.service.interface';

try {
  loadEnvFile();
} catch {}

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    AuthGuard,
    {
      provide: IAuthService,
      useExisting: AuthService,
    },
    {
      provide: IAuthRepository,
      useExisting: AuthRepository,
    },
  ],
  exports: [JwtModule, IAuthService, AuthGuard],
})
export class AuthModule {}
