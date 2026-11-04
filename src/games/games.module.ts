import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Game } from '../entities/game.entity';
import { GameRound } from '../entities/game-round.entity';
import { Player } from '../entities/player.entity';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GameGateway } from './game.gateway';
import { EvenOddEngine } from './engines/even-odd.engine';
import { CoinFlipEngine } from './engines/coin-flip.engine';
import { DiceEngine } from './engines/dice.engine';
import { GameEngineRegistry } from './engines/game-engine.registry';

@Module({
  imports: [MikroOrmModule.forFeature([Game, GameRound, Player])],
  controllers: [GamesController],
  providers: [
    EvenOddEngine,
    CoinFlipEngine,
    DiceEngine,
    GameEngineRegistry,
    GamesService,
    GameGateway,
  ],
  exports: [GamesService, GameEngineRegistry],
})
export class GamesModule {}
