import { describe, expect, it } from 'vitest';
import { MONEY_DECIMAL_PLACES, roundMoney, sumMoney } from '../../src/domain/calculation/rounding';

describe('money rounding policy', () => {
  it('uses two decimal places', () => {
    expect(MONEY_DECIMAL_PLACES).toBe(2);
  });

  it.each([
    [1.005, 1.01],
    [2.675, 2.68],
    [10.004, 10],
    [10.005, 10.01],
    [-1.005, -1.01],
  ])('rounds %s to %s', (input, expected) => {
    expect(roundMoney(input)).toBe(expected);
  });

  it('rounds sums after floating-point accumulation', () => {
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
  });

  it('rejects non-finite money', () => {
    expect(() => roundMoney(Number.NaN)).toThrow(RangeError);
    expect(() => roundMoney(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
