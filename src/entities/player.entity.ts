import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import * as crypto from 'crypto';

/**
 * PASSO 2: Entidade Player (Tabela 'players' no PostgreSQL)
 * Representa o jogador e sua carteira (balance) na plataforma de iGaming.
 */
@Entity({ tableName: 'players' })
export class Player {
  @PrimaryKey({ type: 'uuid' })
  id: string = crypto.randomUUID();

  @Property({ unique: true })
  username!: string;

  @Property({ unique: true })
  email!: string;

  @Property({ type: 'double', default: 1000 })
  balance: number = 1000;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
