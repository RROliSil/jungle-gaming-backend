import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { GameEngineOutcome, IGameEngine } from './game-engine.interface';

export type ParityChoice = 'EVEN' | 'ODD';

export interface EvenOddInput {
  choice: ParityChoice; // 'EVEN' (Par) ou 'ODD' (Ímpar)
  playerNumber: number; // Número escolhido pelo jogador (0 a 10)
}

export interface EvenOddResult {
  playerChoice: ParityChoice;
  playerChoiceLabel: 'PAR' | 'ÍMPAR';
  playerNumber: number;
  houseNumber: number;
  sum: number;
  outcomeParity: ParityChoice;
  outcomeLabel: 'PAR' | 'ÍMPAR';
  serverSeed: string;
  explanation: string;
}

/**
 * PASSO 4: Motor do Jogo "Par ou Ímpar" (EvenOddEngine)
 * Implementa a interface agnóstica IGameEngine.
 */
@Injectable()
export class EvenOddEngine implements IGameEngine<EvenOddInput, EvenOddResult> {
  readonly slug = 'even-odd';

  readonly defaultCatalogData = {
    name: 'Par ou Ímpar',
    description: 'Escolha PAR (EVEN) ou ÍMPAR (ODD) e um número de 0 a 10. Se a soma com o número da casa bater com sua escolha, você dobra a aposta!',
    minBet: 1,
    maxBet: 500,
    payoutMultiplier: 2.0,
    config: {
      minNumber: 0,
      maxNumber: 10,
    },
  };

  validateInput(input: EvenOddInput, gameConfig: Record<string, any>): void {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('O payload da jogada (inputPayload) é obrigatório.');
    }

    if (input.choice !== 'EVEN' && input.choice !== 'ODD') {
      throw new BadRequestException('O campo "choice" deve ser "EVEN" (Par) ou "ODD" (Ímpar).');
    }

    const minNum = Number(gameConfig?.minNumber ?? 0);
    const maxNum = Number(gameConfig?.maxNumber ?? 10);
    const num = Number(input.playerNumber);

    if (!Number.isInteger(num) || num < minNum || num > maxNum) {
      throw new BadRequestException(
        `O campo "playerNumber" deve ser um número inteiro entre ${minNum} e ${maxNum}.`,
      );
    }
  }

  executeRound(input: EvenOddInput, gameConfig: Record<string, any>): GameEngineOutcome<EvenOddResult> {
    const minNum = Number(gameConfig?.minNumber ?? 0);
    const maxNum = Number(gameConfig?.maxNumber ?? 10);
    const playerNumber = Number(input.playerNumber);

    // Sorteio Criptograficamente Seguro (CSPRNG) + Seed para Provably Fair
    const houseNumber = crypto.randomInt(minNum, maxNum + 1);
    const serverSeed = crypto.randomBytes(16).toString('hex');
    const provablyFairHash = crypto
      .createHash('sha256')
      .update(`${serverSeed}:${houseNumber}`)
      .digest('hex');

    const sum = playerNumber + houseNumber;
    const outcomeParity: ParityChoice = sum % 2 === 0 ? 'EVEN' : 'ODD';
    const won = input.choice === outcomeParity;

    const playerChoiceLabel = input.choice === 'EVEN' ? 'PAR' : 'ÍMPAR';
    const outcomeLabel = outcomeParity === 'EVEN' ? 'PAR' : 'ÍMPAR';

    return {
      status: won ? 'WON' : 'LOST',
      resultPayload: {
        playerChoice: input.choice,
        playerChoiceLabel,
        playerNumber,
        houseNumber,
        sum,
        outcomeParity,
        outcomeLabel,
        serverSeed,
        explanation: `Você jogou ${playerNumber} (${playerChoiceLabel}) e a Casa jogou ${houseNumber}. Soma = ${sum} (${outcomeLabel}) -> Você ${won ? 'VENCEU!' : 'PERDEU!'}`,
      },
      provablyFairHash,
    };
  }
}
