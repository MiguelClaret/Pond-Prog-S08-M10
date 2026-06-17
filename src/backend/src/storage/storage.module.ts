import { Module } from '@nestjs/common';
import { IStorageService } from './domain/interfaces/storage.service.interface';
import { StorageService } from './services/storage.service';

@Module({
  providers: [
    StorageService,
    {
      provide: IStorageService,
      useExisting: StorageService,
    },
  ],
  exports: [IStorageService],
})
export class StorageModule {}
