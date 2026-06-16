import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../domain/enums/role.enum';
import { AuthResponseEntity } from '../domain/entities/auth-response.entity';
import { UserEntity } from '../domain/entities/user.entity';
import { LoginAuthDto } from '../domain/dto/login-auth.dto';
import { RegisterAuthDto } from '../domain/dto/register-auth.dto';
import { AuthUserRecord } from '../domain/entities/auth-user-record.entity';
import { IAuthRepository } from '../domain/interfaces/auth.repository.interface';
import { IAuthService } from '../domain/interfaces/auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerAuthDto: RegisterAuthDto): Promise<AuthResponseEntity> {
    try {
      const fullName = registerAuthDto.fullName.trim();
      const email = this.normalizeEmail(registerAuthDto.email);

      const existingUser = await this.authRepository.findByEmail(email);
      if (existingUser) {
        throw new BadRequestException('Ja existe um usuario cadastrado com este email.');
      }

      const passwordHash = await bcrypt.hash(registerAuthDto.password, 10);

      const createdUser = await this.authRepository.create({
        fullName,
        email,
        passwordHash,
        role: Role.PSYCHOLOGIST,
      });

      return await this.buildAuthResponse(createdUser);
    } catch (error) {
      this.handleError(error, 'Erro interno ao cadastrar usuario.');
    }
  }

  async login(loginAuthDto: LoginAuthDto): Promise<AuthResponseEntity> {
    try {
      const email = this.normalizeEmail(loginAuthDto.email);
      const user = await this.authRepository.findByEmail(email);

      if (!user) {
        throw new UnauthorizedException('Email ou senha invalidos.');
      }

      const passwordMatches = await bcrypt.compare(loginAuthDto.password, user.passwordHash);
      if (!passwordMatches) {
        throw new UnauthorizedException('Email ou senha invalidos.');
      }

      return await this.buildAuthResponse(user);
    } catch (error) {
      this.handleError(error, 'Erro interno ao autenticar usuario.');
    }
  }

  async me(userId: string): Promise<UserEntity> {
    try {
      const user = await this.authRepository.findById(userId);

      if (!user) {
        throw new NotFoundException('Usuario autenticado nao encontrado.');
      }

      return this.toUserEntity(user);
    } catch (error) {
      this.handleError(error, 'Erro interno ao buscar usuario autenticado.');
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toUserEntity(user: AuthUserRecord): UserEntity {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private async buildAuthResponse(user: AuthUserRecord): Promise<AuthResponseEntity> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: this.toUserEntity(user),
    };
  }

  private handleError(error: unknown, defaultMessage: string): never {
    if (
      error instanceof BadRequestException ||
      error instanceof UnauthorizedException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    throw new InternalServerErrorException(defaultMessage);
  }
}
