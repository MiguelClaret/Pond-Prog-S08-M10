import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { loadEnvFile } from 'node:process';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool | null;

  constructor() {
    this.loadEnvironmentFile();
    this.pool = this.createPool();
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new InternalServerErrorException(
        'Banco Supabase nao configurado. Defina SUPABASE_DB_URL no ambiente.',
      );
    }

    return await this.pool.query<T>(sql, params);
  }

  async transaction<T>(
    callback: (
      query: <R extends QueryResultRow = QueryResultRow>(
        sql: string,
        params?: unknown[],
      ) => Promise<QueryResult<R>>,
      client: PoolClient,
    ) => Promise<T>,
  ): Promise<T> {
    if (!this.pool) {
      throw new InternalServerErrorException(
        'Banco Supabase nao configurado. Defina SUPABASE_DB_URL no ambiente.',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await callback(
        async <R extends QueryResultRow = QueryResultRow>(
          sql: string,
          params: unknown[] = [],
        ) => await client.query<R>(sql, params),
        client,
      );

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  isConfigured(): boolean {
    return this.pool !== null;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  private loadEnvironmentFile(): void {
    try {
      loadEnvFile();
    } catch {
      this.logger.warn('Arquivo .env nao encontrado no backend. Usando apenas variaveis do ambiente.');
    }
  }

  private createPool(): Pool | null {
    const connectionString = process.env.SUPABASE_DB_URL;

    if (!connectionString) {
      this.logger.warn('Banco Supabase nao configurado. Defina SUPABASE_DB_URL no ambiente.');
      return null;
    }

    return new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
}
