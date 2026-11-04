import { RoundStatus } from '../../entities/game-round.entity';

export interface GameEngineOutcome<TResult = Record<string, any>> {
  status: RoundStatus;
  /**
   * Fator multiplicador aplicado sobre a aposta (0 se perdeu, 1 se empatou, ou payoutMultiplier do jogo se ganhou)
   */
  winMultiplier?: number;
  resultPayload: TResult;
  provablyFairHash: string;
}

/**
 * PASSO 4: Interface IGameEngine (Padrão Strategy)
 * Qualquer jogo da plataforma (Par ou Ímpar, Cara ou Coroa, Dados, Roleta, Crash)
 * implementa este contrato. Assim o Banco de Dados, a API REST e o WebSocket
 * continuam 100% agnósticos — não precisam saber a regra interna de cada jogo!
 */
export interface IGameEngine<TInput = Record<string, any>, TResult = Record<string, any>> {
  readonly slug: string;

  readonly defaultCatalogData: {
    name: string;
    description: string;
    minBet: number;
    maxBet: number;
    payoutMultiplier: number;
    config: Record<string, any>;
  };

  /**
   * Valida se a jogada enviada pelo cliente (inputPayload) é válida para este jogo.
   * Lança BadRequestException caso algum campo esteja incorreto.
   */
  validateInput(input: TInput, gameConfig: Record<string, any>): void;

  /**
   * Executa a lógica da rodada e devolve o resultado padronizado (GameEngineOutcome).
   */
  executeRound(input: TInput, gameConfig: Record<string, any>): GameEngineOutcome<TResult>;
}
