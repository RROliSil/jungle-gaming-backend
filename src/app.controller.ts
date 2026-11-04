import { Controller, Get } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

@Controller('health')
export class AppController {
  constructor(private readonly em: EntityManager) {}

  @Get()
  async checkHealth() {
    const dbResult = await this.em.getConnection().execute('SELECT version() as version, current_database() as db');
    return {
      status: 'ok',
      service: 'Jungle Gaming Agnostic Platform',
      database: {
        connected: true,
        mode: process.env.USE_EMBEDDED_POSTGRES !== 'false' ? 'Embedded PostgreSQL (Dev)' : 'External PostgreSQL (Docker / Cloud)',
        info: dbResult[0],
      },
      timestamp: new Date().toISOString(),
    };
  }
}
