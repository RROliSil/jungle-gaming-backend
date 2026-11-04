import { Migration } from '@mikro-orm/migrations';

/**
 * PASSO 2: Migration Inicial (Histórico de versão do Schema SQL no PostgreSQL)
 * Na vaga da Jungle Gaming é pedido: "Evoluir modelos, consultas e migrações com MikroORM e PostgreSQL".
 * O método up() aplica as tabelas e o método down() desfaz (rollback).
 */
export class Migration20261103000000_InitialSchema extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "players" (
        "id" uuid NOT NULL,
        "username" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "balance" double precision NOT NULL DEFAULT 1000,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL,
        CONSTRAINT "players_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "players_username_unique" UNIQUE ("username"),
        CONSTRAINT "players_email_unique" UNIQUE ("email")
      );
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "games" (
        "id" uuid NOT NULL,
        "slug" varchar(255) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" varchar(255) NOT NULL DEFAULT '',
        "min_bet" double precision NOT NULL DEFAULT 1,
        "max_bet" double precision NOT NULL DEFAULT 500,
        "payout_multiplier" double precision NOT NULL DEFAULT 2,
        "is_active" boolean NOT NULL DEFAULT true,
        "config" jsonb NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL,
        CONSTRAINT "games_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "games_slug_unique" UNIQUE ("slug")
      );
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "game_rounds" (
        "id" uuid NOT NULL,
        "player_id" uuid NOT NULL,
        "game_id" uuid NOT NULL,
        "bet_amount" double precision NOT NULL,
        "payout_amount" double precision NOT NULL,
        "status" varchar(255) NOT NULL,
        "input_payload" jsonb NOT NULL,
        "result_payload" jsonb NOT NULL,
        "provably_fair_hash" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL,
        CONSTRAINT "game_rounds_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "game_rounds_player_id_foreign" FOREIGN KEY ("player_id") REFERENCES "players" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT "game_rounds_game_id_foreign" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "game_rounds" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "games" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "players" CASCADE;');
  }
}
