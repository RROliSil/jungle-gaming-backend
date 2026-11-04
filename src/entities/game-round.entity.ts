import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import * as crypto from 'crypto';
import { Player } from './player.entity';
import { Game } from './game.entity';

export type RoundStatus = 'WON' | 'LOST' | 'DRAW';

/**
 * PASSO 2: Entidade GameRound (Tabela 'game_rounds' no PostgreSQL)
 * Registra cada partida/aposta realizada em qualquer jogo da plataforma.
 * Usa colunas JSON ('inputPayload' e 'resultPayload') para ser 100% agnóstico de jogo!
 */
@Entity({ tableName: 'game_rounds' })
export class GameRound {
  @PrimaryKey({ type: 'uuid' })
  id: string = crypto.randomUUID();

  @ManyToOne(() => Player, { deleteRule: 'cascade' })
  player!: Player;

  @ManyToOne(() => Game, { deleteRule: 'cascade' })
  game!: Game;

  @Property({ type: 'double' })
  betAmount!: number;

  @Property({ type: 'double' })
  payoutAmount!: number;

  @Property()
  status!: RoundStatus;

  /**
   * Jogada enviada pelo jogador (agnóstico).
   * Ex no Par ou Ímpar: { choice: 'EVEN', playerNumber: 4 }
   */
  @Property({ type: 'json' })
  inputPayload!: Record<string, any>;

  /**
   * Resultado calculado pelo GameEngine (agnóstico).
   * Ex no Par ou Ímpar: { houseNumber: 3, sum: 7, parity: 'ODD', explanation: '4 + 3 = 7 (ÍMPAR)' }
   */
  @Property({ type: 'json' })
  resultPayload!: Record<string, any>;

  /**
   * Hash SHA-256 de auditoria (Provably Fair) para transparência do sorteio.
   */
  @Property()
  provablyFairHash!: string;

  @Property()
  createdAt: Date = new Date();
}
