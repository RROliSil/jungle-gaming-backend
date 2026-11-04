import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { EntityManager, MikroORM, wrap } from '@mikro-orm/postgresql';
import { Game } from '../entities/game.entity';
import { Player } from '../entities/player.entity';
import { GameRound } from '../entities/game-round.entity';
import { CreateGameDto, PlayRoundDto, UpdateGameDto } from './dto/game.dto';
import { GameEngineRegistry } from './engines/game-engine.registry';

/**
 * PASSO 3 & PASSO 4: GamesService
 * 1. Realiza o CRUD completo do catálogo de jogos (INSERT, SELECT, UPDATE, DELETE).
 * 2. Executa partidas de qualquer jogo de forma agnóstica usando o GameEngineRegistry
 *    dentro de uma transação atômica no PostgreSQL.
 */
@Injectable()
export class GamesService implements OnModuleInit {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly engineRegistry: GameEngineRegistry,
  ) {}

  /**
   * Ao iniciar a aplicação:
   * 1. Garante que as tabelas SQL (players, games, game_rounds) existam no PostgreSQL.
   * 2. Popula (Seed) os jogos padrão ("Par ou Ímpar" e "Cara ou Coroa") e um jogador demo.
   */
  async onModuleInit() {
    await this.em.getConnection().execute(`
      CREATE TABLE IF NOT EXISTS "players" (
        "id" uuid NOT NULL PRIMARY KEY,
        "username" varchar(255) NOT NULL UNIQUE,
        "email" varchar(255) NOT NULL UNIQUE,
        "balance" double precision NOT NULL DEFAULT 1000,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "games" (
        "id" uuid NOT NULL PRIMARY KEY,
        "slug" varchar(255) NOT NULL UNIQUE,
        "name" varchar(255) NOT NULL,
        "description" varchar(255) NOT NULL DEFAULT '',
        "min_bet" double precision NOT NULL DEFAULT 1,
        "max_bet" double precision NOT NULL DEFAULT 500,
        "payout_multiplier" double precision NOT NULL DEFAULT 2,
        "is_active" boolean NOT NULL DEFAULT true,
        "config" jsonb NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "game_rounds" (
        "id" uuid NOT NULL PRIMARY KEY,
        "player_id" uuid NOT NULL REFERENCES "players" ("id") ON DELETE CASCADE,
        "game_id" uuid NOT NULL REFERENCES "games" ("id") ON DELETE CASCADE,
        "bet_amount" double precision NOT NULL,
        "payout_amount" double precision NOT NULL,
        "status" varchar(255) NOT NULL,
        "input_payload" jsonb NOT NULL,
        "result_payload" jsonb NOT NULL,
        "provably_fair_hash" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL
      );
    `);
    this.logger.log('Tabelas SQL criadas/sincronizadas no PostgreSQL com sucesso!');

    const fork = this.em.fork();

    for (const engine of this.engineRegistry.getAllEngines()) {
      const exists = await fork.findOne(Game, { slug: engine.slug });
      if (!exists) {
        const game = fork.create(Game, {
          slug: engine.slug,
          ...engine.defaultCatalogData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        fork.persist(game);
        this.logger.log(`Jogo inicial cadastrado no banco: [${engine.slug}] ${engine.defaultCatalogData.name}`);
      }
    }

    const demoPlayer = await fork.findOne(Player, { username: 'jogador_demo' });
    if (!demoPlayer) {
      const player = fork.create(Player, {
        username: 'jogador_demo',
        email: 'demo@junglegaming.com',
        balance: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      fork.persist(player);
      this.logger.log('Jogador inicial cadastrado: jogador_demo (Saldo: R$ 1000.00)');
    }

    await fork.flush();
  }

  // =========================================================================
  // CRUD DE JOGOS (POST -> INSERT | GET -> SELECT | PUT -> UPDATE | DELETE)
  // =========================================================================

  async create(dto: CreateGameDto): Promise<Game> {
    const existing = await this.em.findOne(Game, { slug: dto.slug });
    if (existing) {
      throw new BadRequestException(`Já existe um jogo com o slug "${dto.slug}".`);
    }

    const game = this.em.create(Game, {
      slug: dto.slug,
      name: dto.name,
      description: dto.description ?? '',
      minBet: dto.minBet ?? 1,
      maxBet: dto.maxBet ?? 500,
      payoutMultiplier: dto.payoutMultiplier ?? 2.0,
      isActive: dto.isActive ?? true,
      config: dto.config ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(game);
    return game;
  }

  async findAll(): Promise<Game[]> {
    return this.em.find(Game, {}, { orderBy: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<Game> {
    const game = await this.em.findOne(Game, { id });
    if (!game) {
      throw new NotFoundException(`Jogo com ID "${id}" não encontrado.`);
    }
    return game;
  }

  async update(id: string, dto: UpdateGameDto): Promise<Game> {
    const game = await this.findOne(id);
    wrap(game).assign(dto, { ignoreUndefined: true });
    await this.em.flush();
    return game;
  }

  async remove(id: string): Promise<{ deleted: true; id: string; slug: string }> {
    const game = await this.findOne(id);
    const slug = game.slug;
    await this.em.removeAndFlush(game);
    return { deleted: true, id, slug };
  }

  // =========================================================================
  // EXECUÇÃO AGNÓSTICA DE PARTIDA (TRANSAÇÃO ATÔMICA NO POSTGRESQL)
  // =========================================================================

  async playRound(dto: PlayRoundDto) {
    // Fork do EntityManager para garantir isolamento em chamadas HTTP ou WebSocket
    const fork = this.em.fork();

    return fork.transactional(async (txEm) => {
      // 1. Busca o jogador no banco (SELECT)
      const player = await txEm.findOne(Player, { id: dto.playerId });
      if (!player) {
        throw new NotFoundException(`Jogador "${dto.playerId}" não encontrado.`);
      }

      // 2. Busca o jogo pelo slug (ex: 'even-odd') no banco (SELECT)
      const game = await txEm.findOne(Game, { slug: dto.gameSlug });
      if (!game) {
        throw new NotFoundException(`Jogo com slug "${dto.gameSlug}" não encontrado no catálogo.`);
      }

      if (!game.isActive) {
        throw new BadRequestException(`O jogo "${game.name}" está temporariamente desativado.`);
      }

      // 3. Valida limites de aposta e saldo da carteira (Wallet)
      if (dto.betAmount < game.minBet || dto.betAmount > game.maxBet) {
        throw new BadRequestException(
          `A aposta deve estar entre R$ ${game.minBet} e R$ ${game.maxBet}.`,
        );
      }

      if (player.balance < dto.betAmount) {
        throw new BadRequestException(
          `Saldo insuficiente! Seu saldo atual é R$ ${player.balance.toFixed(2)}.`,
        );
      }

      // 4. Obtém o motor agnóstico do jogo no Registry e executa a rodada
      const engine = this.engineRegistry.getEngineOrFail(game.slug);
      engine.validateInput(dto.inputPayload, game.config);
      const outcome = engine.executeRound(dto.inputPayload, game.config);

      // 5. Calcula o prêmio (payout) e atualiza o saldo do jogador (UPDATE players)
      let payoutAmount = 0;
      if (outcome.status === 'WON') {
        const multiplier = outcome.winMultiplier ?? game.payoutMultiplier;
        payoutAmount = Number((dto.betAmount * multiplier).toFixed(2));
      } else if (outcome.status === 'DRAW') {
        payoutAmount = dto.betAmount;
      }

      const previousBalance = player.balance;
      player.balance = Number((player.balance - dto.betAmount + payoutAmount).toFixed(2));

      // 6. Registra a partida no histórico (INSERT INTO game_rounds)
      const round = txEm.create(GameRound, {
        player,
        game,
        betAmount: dto.betAmount,
        payoutAmount,
        status: outcome.status,
        inputPayload: dto.inputPayload,
        resultPayload: outcome.resultPayload,
        provablyFairHash: outcome.provablyFairHash,
        createdAt: new Date(),
      });

      await txEm.persistAndFlush([player, round]);

      return {
        roundId: round.id,
        game: {
          id: game.id,
          slug: game.slug,
          name: game.name,
          payoutMultiplier: game.payoutMultiplier,
        },
        player: {
          id: player.id,
          username: player.username,
          previousBalance,
          newBalance: player.balance,
        },
        betAmount: round.betAmount,
        payoutAmount: round.payoutAmount,
        netProfit: Number((round.payoutAmount - round.betAmount).toFixed(2)),
        status: round.status,
        inputPayload: round.inputPayload,
        resultPayload: round.resultPayload,
        provablyFairHash: round.provablyFairHash,
        createdAt: round.createdAt,
      };
    });
  }

  async findRecentRounds(limit = 20): Promise<GameRound[]> {
    return this.em.find(
      GameRound,
      {},
      {
        populate: ['player', 'game'],
        orderBy: { createdAt: 'DESC' },
        limit,
      },
    );
  }

  async deleteRound(roundId: string): Promise<{ deleted: true; id: string }> {
    const round = await this.em.findOne(GameRound, { id: roundId });
    if (!round) {
      throw new NotFoundException(`Partida "${roundId}" não encontrada.`);
    }
    await this.em.removeAndFlush(round);
    return { deleted: true, id: roundId };
  }
}
