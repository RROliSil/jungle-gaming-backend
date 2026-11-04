import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import * as crypto from 'crypto';

/**
 * PASSO 2: Entidade Game (Tabela 'games' no PostgreSQL)
 * Catálogo agnóstico de jogos disponíveis na plataforma.
 * O campo 'slug' (ex: 'even-odd', 'coin-flip') conecta o banco ao motor de regras (GameEngine).
 */
@Entity({ tableName: 'games' })
export class Game {
  @PrimaryKey({ type: 'uuid' })
  id: string = crypto.randomUUID();

  @Property({ unique: true })
  slug!: string;

  @Property()
  name!: string;

  @Property({ default: '' })
  description: string = '';

  @Property({ type: 'double', default: 1 })
  minBet: number = 1;

  @Property({ type: 'double', default: 500 })
  maxBet: number = 500;

  @Property({ type: 'double', default: 2.0 })
  payoutMultiplier: number = 2.0;

  @Property({ default: true })
  isActive: boolean = true;

  /**
   * Coluna JSON no PostgreSQL: permite guardar configurações específicas
   * de cada jogo (ex: { minNumber: 0, maxNumber: 10 }) sem precisar alterar a tabela!
   */
  @Property({ type: 'json' })
  config: Record<string, any> = {};

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
