import { EvenOddEngine } from './even-odd.engine';

/**
 * Teste Unitário do Motor "Par ou Ímpar" (EvenOddEngine)
 * Cobre o requisito da vaga da Jungle Gaming: "escrever ou atualizar os testes relevantes".
 */
describe('EvenOddEngine (Par ou Ímpar)', () => {
  const engine = new EvenOddEngine();

  it('deve validar corretamente entradas válidas (EVEN/ODD e número de 0 a 10)', () => {
    expect(() =>
      engine.validateInput({ choice: 'EVEN', playerNumber: 4 }, { minNumber: 0, maxNumber: 10 }),
    ).not.toThrow();
  });

  it('deve rejeitar escolha inválida ou número fora do limite', () => {
    expect(() =>
      engine.validateInput({ choice: 'INVALID' as any, playerNumber: 4 }, {}),
    ).toThrow();

    expect(() =>
      engine.validateInput({ choice: 'EVEN', playerNumber: 15 }, { minNumber: 0, maxNumber: 10 }),
    ).toThrow();
  });

  it('deve executar uma rodada e retornar status WON ou LOST coerente com a paridade da soma', () => {
    const outcome = engine.executeRound(
      { choice: 'EVEN', playerNumber: 4 },
      { minNumber: 0, maxNumber: 10 },
    );

    const isSumEven = outcome.resultPayload.sum % 2 === 0;
    expect(outcome.resultPayload.sum).toBe(4 + outcome.resultPayload.houseNumber);
    expect(outcome.status).toBe(isSumEven ? 'WON' : 'LOST');
    expect(outcome.provablyFairHash).toHaveLength(64);
  });
});
