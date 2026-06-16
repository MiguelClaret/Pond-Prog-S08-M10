import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Role } from '../domain/enums/role.enum';
import { IAuthRepository } from '../domain/interfaces/auth.repository.interface';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;

  const authRepositoryMock = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findPatientProfileByEmail: jest.fn(),
    create: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: IAuthRepository,
          useValue: authRepositoryMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should register a psychologist when email is available', async () => {
    authRepositoryMock.findByEmail.mockResolvedValue(null);
    authRepositoryMock.findPatientProfileByEmail.mockResolvedValue(null);
    authRepositoryMock.create.mockResolvedValue({
      id: 'user-1',
      fullName: 'Dra. Maria',
      email: 'maria@example.com',
      passwordHash: 'hashed-password',
      role: Role.PSYCHOLOGIST,
      createdAt: new Date('2026-06-16T10:00:00.000Z'),
    });
    jwtServiceMock.signAsync.mockResolvedValue('jwt-token');

    const hashMock = bcrypt.hash as jest.Mock;
    hashMock.mockResolvedValue('hashed-password');

    const result = await authService.register({
      fullName: 'Dra. Maria',
      email: 'maria@example.com',
      password: 'strong-password',
    });

    expect(authRepositoryMock.create).toHaveBeenCalledWith({
      fullName: 'Dra. Maria',
      email: 'maria@example.com',
      passwordHash: 'hashed-password',
      role: Role.PSYCHOLOGIST,
    });
    expect(result.accessToken).toBe('jwt-token');
    expect(result.user.role).toBe(Role.PSYCHOLOGIST);

    hashMock.mockReset();
  });

  it('should reject register when email already exists', async () => {
    authRepositoryMock.findByEmail.mockResolvedValue({
      id: 'user-1',
    });

    await expect(
      authService.register({
        fullName: 'Dra. Maria',
        email: 'maria@example.com',
        password: 'strong-password',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject login with invalid password', async () => {
    authRepositoryMock.findByEmail.mockResolvedValue({
      id: 'user-1',
      fullName: 'Dra. Maria',
      email: 'maria@example.com',
      passwordHash: 'hashed-password',
      role: Role.PSYCHOLOGIST,
      createdAt: new Date('2026-06-16T10:00:00.000Z'),
    });

    const compareMock = bcrypt.compare as jest.Mock;
    compareMock.mockResolvedValue(false);

    await expect(
      authService.login({
        email: 'maria@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    compareMock.mockReset();
  });

  it('should return authenticated user on me', async () => {
    authRepositoryMock.findById.mockResolvedValue({
      id: 'user-1',
      fullName: 'Dra. Maria',
      email: 'maria@example.com',
      passwordHash: 'hashed-password',
      role: Role.PSYCHOLOGIST,
      createdAt: new Date('2026-06-16T10:00:00.000Z'),
    });

    const result = await authService.me('user-1');

    expect(result.email).toBe('maria@example.com');
  });

  it('should fail on me when user does not exist', async () => {
    authRepositoryMock.findById.mockResolvedValue(null);

    await expect(authService.me('missing-user')).rejects.toBeInstanceOf(NotFoundException);
  });
});
