import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { GameEngineOutcome, IGameEngine } from './game-engine.interface';

export type DiceDirection = 'OVER' | 'UNDER';

export interface DiceInput {
  direction: DiceDirection; // 'OVER' (> 50) ou 'UNDER' (<= 50)
}

export interface DiceResult {
  direction: DiceDirection;
  rolledNumber: number;
  target: number;
  serverSeed: string;
  explanation: string;
}

/**
 * PASSO EXTRA (Fase 2): 3º Motor Agnóstico ("Dados 1 a 100 / Over-Under")
 * Demonstra na prática como um novo jogo com regras próprias é adicionado
 * apenas implementando IGameEngine.
 */
@Injectable()
export class DiceEngine implements IGameEngine<DiceInput, DiceResult> {
  readonly slug = 'dice';

  readonly defaultCatalogData = {
    name: 'Dados 1–100 (Over / Under 50)',
    description: 'Escolha se o dado de 1 a 100 vai cair ACIMA de 50 (OVER) ou ABAIXO/IGUAL a 50 (UNDER).',
    minBet: 1,
    maxBet: 500,
    payoutMultiplier: 1.98,
    config: {
      target: 50,
    },
  };

  validateInput(input: DiceInput): void {
    if (!input || (input.direction !== 'OVER' && input.direction !== 'UNDER')) {
      throw new BadRequestException('No jogo de Dados, informe "direction": "OVER" (> 50) ou "UNDER" (<= 50).');
    }
  }

  executeRound(input: DiceInput, gameConfig: Record<string, any>): GameEngineOutcome<DiceResult> {
    const target = Number(gameConfig?.target ?? 50);
    const rolledNumber = crypto.randomInt(1, 101); // 1 a 100
    const serverSeed = crypto.randomBytes(16).toString('hex');
    const provablyFairHash = crypto
      .createHash('sha256')
      .update(`${serverSeed}:${rolledNumber}`)
      .digest('hex');

    const won =
      (input.direction === 'OVER' && rolledNumber > target) ||
      (input.direction === 'UNDER' && rolledNumber <= target);

    const dirLabel = input.direction === 'OVER' ? `ACIMA de ${target}` : `ATÉ ${target}`;

    return {
      status: won ? 'WON' : 'LOST',
      resultPayload: {
        direction: input.direction,
        rolledNumber,
        target,
        serverSeed,
        explanation: `Você apostou ${dirLabel} e o dado sorteou ${rolledNumber} -> Você ${won ? 'VENCEU!' : 'PERDEU!'}`,
      },
      provablyFairHash,
    };
  }
}
