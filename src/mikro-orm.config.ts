import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { Player } from './entities/player.entity';
import { Game } from './entities/game.entity';
import { GameRound } from './entities/game-round.entity';

const useEmbedded = process.env.USE_EMBEDDED_POSTGRES !== 'false';
const clientUrl = !useEmbedded && process.env.DATABASE_URL ? process.env.DATABASE_URL : undefined;

export default defineConfig({
  ...(clientUrl
    ? { clientUrl }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5433),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        dbName: useEmbedded ? 'template1' : process.env.DB_NAME || 'junglegaming',
      }),
  pool: {
    min: 1,
    max: useEmbedded ? 1 : 10,
  },
  entities: [Player, Game, GameRound],
  extensions: [Migrator],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
  debug: process.env.NODE_ENV !== 'production',
});
