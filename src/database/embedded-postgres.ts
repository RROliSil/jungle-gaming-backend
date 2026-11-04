import { Logger } from '@nestjs/common';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const logger = new Logger('EmbeddedPostgres');
let socketServer: PGLiteSocketServer | null = null;
let pgInstance: PGlite | null = null;

export async function startEmbeddedPostgresIfNeeded(): Promise<void> {
  if (process.env.USE_EMBEDDED_POSTGRES === 'false') {
    logger.log('USE_EMBEDDED_POSTGRES=false -> Conectando ao PostgreSQL externo (Docker / Neon / Supabase)');
    return;
  }

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 5433);

  logger.log(`Iniciando motor PostgreSQL 16 embutido em ${host}:${port}...`);

  pgInstance = await PGlite.create();

  socketServer = new PGLiteSocketServer({
    db: pgInstance,
    host,
    port,
  });

  await socketServer.start();
  logger.log(`PostgreSQL 16 embutido pronto e escutando conexões TCP em ${host}:${port}!`);
}

export async function stopEmbeddedPostgres(): Promise<void> {
  if (socketServer) {
    await socketServer.stop();
    socketServer = null;
  }
  if (pgInstance) {
    await pgInstance.close();
    pgInstance = null;
  }
}
