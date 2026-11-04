import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { GameEngineOutcome, IGameEngine } from './game-engine.interface';

export type CoinSide = 'HEADS' | 'TAILS';

export interface CoinFlipInput {
  side: CoinSide; // 'HEADS' (Cara) ou 'TAILS' (Coroa)
}

export interface CoinFlipResult {
  chosenSide: CoinSide;
  drawnSide: CoinSide;
  serverSeed: string;
  explanation: string;
}

/**
 * PASSO 4 (Demonstração de Sistema Agnóstico):
 * Segundo motor de jogo ("Cara ou Coroa" / Coin Flip) plugado na mesma interface IGameEngine,
 * provando que adicionar um novo jogo NÃO exige mudar nenhuma tabela SQL, Controller ou WebSocket!
 */
@Injectable()
export class CoinFlipEngine implements IGameEngine<CoinFlipInput, CoinFlipResult> {
  readonly slug = 'coin-flip';

  readonly defaultCatalogData = {
    name: 'Cara ou Coroa (Demo Agnóstico)',
    description: 'Demonstração da arquitetura agnóstica: escolha HEADS (Cara) ou TAILS (Coroa).',
    minBet: 1,
    maxBet: 500,
    payoutMultiplier: 1.95,
    config: {},
  };

  validateInput(input: CoinFlipInput): void {
    if (!input || (input.side !== 'HEADS' && input.side !== 'TAILS')) {
      throw new BadRequestException('No jogo Cara ou Coroa, informe "side": "HEADS" (Cara) ou "TAILS" (Coroa).');
    }
  }

  executeRound(input: CoinFlipInput): GameEngineOutcome<CoinFlipResult> {
    const drawnSide: CoinSide = crypto.randomInt(0, 2) === 0 ? 'HEADS' : 'TAILS';
    const serverSeed = crypto.randomBytes(16).toString('hex');
    const provablyFairHash = crypto
      .createHash('sha256')
      .update(`${serverSeed}:${drawnSide}`)
      .digest('hex');

    const won = input.side === drawnSide;
    const label = (s: CoinSide) => (s === 'HEADS' ? 'CARA' : 'COROA');

    return {
      status: won ? 'WON' : 'LOST',
      resultPayload: {
        chosenSide: input.side,
        drawnSide,
        serverSeed,
        explanation: `Você escolheu ${label(input.side)} e caiu ${label(drawnSide)} -> Você ${won ? 'VENCEU!' : 'PERDEU!'}`,
      },
      provablyFairHash,
    };
  }
}
