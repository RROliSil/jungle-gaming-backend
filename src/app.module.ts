import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as path from 'path';
import mikroOrmConfig from './mikro-orm.config';
import { AppController } from './app.controller';
import { PlayersModule } from './players/players.module';
import { GamesModule } from './games/games.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), 'public'),
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    PlayersModule,
    GamesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
