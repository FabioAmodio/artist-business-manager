import { completeAmountsToTotal } from './money';

describe('money distribution', () => {
  it('splits the residual equally while preserving the exact total in cents', () => {
    expect(completeAmountsToTotal([50, 30, undefined, undefined], 100)).toEqual([50, 30, 10, 10]);
    expect(completeAmountsToTotal([undefined, undefined, undefined], 10)).toEqual([3.34, 3.33, 3.33]);
    expect(completeAmountsToTotal([40, 0, null, undefined], 100)).toEqual([40, 0, 30, 30]);
  });

  it('rejects assigned amounts above the total', () => {
    expect(() => completeAmountsToTotal([60, 50, undefined], 100)).toThrowError('Gli importi assegnati superano il prezzo del pacchetto.');
  });
});