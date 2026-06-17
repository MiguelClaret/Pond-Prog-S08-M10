import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { extname } from 'node:path';
import { UploadedAudioFileEntity } from '../../diary/domain/entities/uploaded-audio-file.entity';
import { IStorageService } from '../domain/interfaces/storage.service.interface';

@Injectable()
export class StorageService implements IStorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: SupabaseClient | null;
  private readonly bucketName: string | null;

  constructor() {
    this.loadEnvironmentFile();
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET ?? null;
    this.client = this.createSupabaseClient();
  }

  async uploadDiaryAudio(patientId: string, file: UploadedAudioFileEntity): Promise<string> {
    if (!this.client || !this.bucketName) {
      throw new InternalServerErrorException(
        'Supabase Storage nao configurado. Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_STORAGE_BUCKET.',
      );
    }

    const filePath = this.buildDiaryAudioPath(patientId, file);

    const { error } = await this.client.storage.from(this.bucketName).upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

    if (error) {
      this.logger.error(`Falha ao enviar audio para o bucket ${this.bucketName}: ${error.message}`);
      throw new InternalServerErrorException('Nao foi possivel enviar o audio do diario.');
    }

    const { data } = this.client.storage.from(this.bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  }

  private loadEnvironmentFile(): void {
    try {
      loadEnvFile();
    } catch {}
  }

  private createSupabaseClient(): SupabaseClient | null {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      this.logger.warn(
        'Supabase Storage nao configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
      );
      return null;
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  private buildDiaryAudioPath(patientId: string, file: UploadedAudioFileEntity): string {
    const extension = this.extractExtension(file.originalname, file.mimetype);
    return `diary-audios/${patientId}/${Date.now()}-${randomUUID()}.${extension}`;
  }

  private extractExtension(originalname: string, mimetype: string): string {
    const fileExtension = extname(originalname).replace('.', '').toLowerCase();

    if (fileExtension) {
      return fileExtension;
    }

    const mimeMapping: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/aac': 'aac',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
    };

    return mimeMapping[mimetype] ?? 'bin';
  }
}
