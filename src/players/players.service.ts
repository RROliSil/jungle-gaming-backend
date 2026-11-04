import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, wrap } from '@mikro-orm/postgresql';
import { Player } from '../entities/player.entity';
import { CreatePlayerDto, UpdatePlayerDto } from './dto/player.dto';

/**
 * PASSO 3: PlayersService — Camada de Domínio/Persistência do CRUD de Jogadores.
 * Aqui cada método traduz a chamada da API REST para comandos SQL no PostgreSQL via MikroORM:
 * - create()  -> INSERT INTO players ...
 * - findAll() -> SELECT * FROM players ...
 * - findOne() -> SELECT * FROM players WHERE id = $1
 * - update()  -> UPDATE players SET ... WHERE id = $1
 * - remove()  -> DELETE FROM players WHERE id = $1
 */
@Injectable()
export class PlayersService {
  constructor(private readonly em: EntityManager) {}

  /**
   * [C]RUD - CREATE (POST /players -> SQL INSERT)
   */
  async create(dto: CreatePlayerDto): Promise<Player> {
    const existing = await this.em.findOne(Player, {
      $or: [{ username: dto.username }, { email: dto.email }],
    });
    if (existing) {
      throw new BadRequestException('Já existe um jogador com este username ou e-mail.');
    }

    const player = this.em.create(Player, {
      username: dto.username,
      email: dto.email,
      balance: dto.balance ?? 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(player);
    return player;
  }

  /**
   * C[R]UD - READ ALL (GET /players -> SQL SELECT)
   */
  async findAll(): Promise<Player[]> {
    return this.em.find(Player, {}, { orderBy: { createdAt: 'DESC' } });
  }

  /**
   * C[R]UD - READ ONE (GET /players/:id -> SQL SELECT WHERE id = ...)
   */
  async findOne(id: string): Promise<Player> {
    const player = await this.em.findOne(Player, { id });
    if (!player) {
      throw new NotFoundException(`Jogador com ID "${id}" não encontrado.`);
    }
    return player;
  }

  /**
   * CR[U]D - UPDATE (PUT /players/:id -> SQL UPDATE ... SET ... WHERE id = ...)
   */
  async update(id: string, dto: UpdatePlayerDto): Promise<Player> {
    const player = await this.findOne(id);
    wrap(player).assign(dto, { ignoreUndefined: true });
    await this.em.flush();
    return player;
  }

  /**
   * CRU[D] - DELETE (DELETE /players/:id -> SQL DELETE FROM players WHERE id = ...)
   */
  async remove(id: string): Promise<{ deleted: true; id: string; username: string }> {
    const player = await this.findOne(id);
    const username = player.username;
    await this.em.removeAndFlush(player);
    return { deleted: true, id, username };
  }
}
