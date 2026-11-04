import { BadRequestException, Injectable } from '@nestjs/common';
import { IGameEngine } from './game-engine.interface';
import { EvenOddEngine } from './even-odd.engine';
import { CoinFlipEngine } from './coin-flip.engine';
import { DiceEngine } from './dice.engine';

/**
 * PASSO 4: GameEngineRegistry (Padrão Registry / Factory)
 * Mantém um mapa de todos os motores de jogo registrados pelo seu 'slug'.
 * Quando o jogador pede para jogar 'even-odd' (Par ou Ímpar) ou qualquer outro jogo,
 * o Registry entrega o motor correspondente sem usar 'if/else' espalhado pelo sistema.
 */
@Injectable()
export class GameEngineRegistry {
  private readonly engines = new Map<string, IGameEngine>();

  constructor(
    private readonly evenOddEngine: EvenOddEngine,
    private readonly coinFlipEngine: CoinFlipEngine,
    private readonly diceEngine: DiceEngine,
  ) {
    this.register(this.evenOddEngine);
    this.register(this.coinFlipEngine);
    this.register(this.diceEngine);
  }

  register(engine: IGameEngine): void {
    this.engines.set(engine.slug, engine);
  }

  getEngineOrFail(slug: string): IGameEngine {
    const engine = this.engines.get(slug);
    if (!engine) {
      throw new BadRequestException(
        `Motor de jogo para o slug "${slug}" não encontrado. Engines registrados: [${ this.getAvailableSlugs().join(', ') }]`,
      );
    }
    return engine;
  }

  getAllEngines(): IGameEngine[] {
    return Array.from(this.engines.values());
  }

  getAvailableSlugs(): string[] {
    return Array.from(this.engines.keys());
  }
}
