import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../auth/domain/enums/role.enum';
import { IStorageService } from '../../storage/domain/interfaces/storage.service.interface';
import { IWeatherService } from '../../weather/domain/interfaces/weather.service.interface';
import { IDiaryRepository } from '../domain/interfaces/diary.repository.interface';
import { DiaryService } from './diary.service';

describe('DiaryService', () => {
  let diaryService: DiaryService;

  const diaryRepositoryMock = {
    create: jest.fn(),
    findByPatientId: jest.fn(),
    findOwnerById: jest.fn(),
    updateShare: jest.fn(),
    remove: jest.fn(),
    patientBelongsToPsychologist: jest.fn(),
    findSharedByPatientId: jest.fn(),
  };

  const weatherServiceMock = {
    getCurrentWeather: jest.fn(),
  };

  const storageServiceMock = {
    uploadDiaryAudio: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiaryService,
        {
          provide: IDiaryRepository,
          useValue: diaryRepositoryMock,
        },
        {
          provide: IWeatherService,
          useValue: weatherServiceMock,
        },
        {
          provide: IStorageService,
          useValue: storageServiceMock,
        },
      ],
    }).compile();

    diaryService = module.get<DiaryService>(DiaryService);
  });

  it('should create diary entry for patient', async () => {
    diaryRepositoryMock.create.mockResolvedValue({ id: 'entry-1' });
    weatherServiceMock.getCurrentWeather.mockResolvedValue({
      temperature: 22.5,
      humidity: 70,
      weatherCode: 2,
      description: 'Parcialmente nublado',
    });

    await diaryService.create(
      {
        text: 'Hoje foi um dia dificil',
        mood: 'ansioso',
        intensity: 4,
        latitude: -23.55,
        longitude: -46.63,
      },
      {
        sub: 'patient-1',
        email: 'patient@example.com',
        role: Role.PATIENT,
      },
    );

    expect(diaryRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'patient-1',
        text: 'Hoje foi um dia dificil',
        mood: 'ansioso',
        intensity: 4,
        weatherTemperature: 22.5,
        weatherDescription: 'Parcialmente nublado',
        latitude: -23.55,
        longitude: -46.63,
      }),
    );
  });

  it('should upload audio and save returned url', async () => {
    diaryRepositoryMock.create.mockResolvedValue({ id: 'entry-1' });
    storageServiceMock.uploadDiaryAudio.mockResolvedValue('https://storage.example.com/audio.m4a');

    await diaryService.create(
      {
        mood: 'calmo',
        intensity: 2,
      },
      {
        sub: 'patient-1',
        email: 'patient@example.com',
        role: Role.PATIENT,
      },
      {
        buffer: Buffer.from('audio'),
        mimetype: 'audio/mp4',
        originalname: 'registro.m4a',
        size: 1234,
      },
    );

    expect(storageServiceMock.uploadDiaryAudio).toHaveBeenCalledWith(
      'patient-1',
      expect.objectContaining({
        originalname: 'registro.m4a',
      }),
    );
    expect(diaryRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUrl: 'https://storage.example.com/audio.m4a',
      }),
    );
  });

  it('should create diary entry without weather when weather lookup fails', async () => {
    diaryRepositoryMock.create.mockResolvedValue({ id: 'entry-1' });
    weatherServiceMock.getCurrentWeather.mockRejectedValue(new Error('weather error'));

    await diaryService.create(
      {
        text: 'Hoje foi um dia dificil',
        mood: 'ansioso',
        intensity: 4,
        latitude: -23.55,
        longitude: -46.63,
      },
      {
        sub: 'patient-1',
        email: 'patient@example.com',
        role: Role.PATIENT,
      },
    );

    expect(diaryRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        weatherTemperature: null,
        weatherDescription: null,
        latitude: -23.55,
        longitude: -46.63,
      }),
    );
  });

  it('should reject create without text and audio', async () => {
    await expect(
      diaryService.create(
        {
          mood: 'triste',
          intensity: 3,
        },
        {
          sub: 'patient-1',
          email: 'patient@example.com',
          role: Role.PATIENT,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject share when authenticated user is not owner', async () => {
    diaryRepositoryMock.findOwnerById.mockResolvedValue({
      id: 'entry-1',
      patientId: 'patient-2',
    });

    await expect(
      diaryService.updateShare(
        'entry-1',
        {
          isSharedWithPsychologist: true,
        },
        {
          sub: 'patient-1',
          email: 'patient@example.com',
          role: Role.PATIENT,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject shared diary when patient does not belong to psychologist', async () => {
    diaryRepositoryMock.patientBelongsToPsychologist.mockResolvedValue(false);

    await expect(
      diaryService.findSharedDiaryByPatient('patient-1', {
        sub: 'psychologist-1',
        email: 'psi@example.com',
        role: Role.PSYCHOLOGIST,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
