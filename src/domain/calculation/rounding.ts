export const MONEY_DECIMAL_PLACES = 2;
const MONEY_SCALE = 10 ** MONEY_DECIMAL_PLACES;

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError('Money value must be finite.');
  }

  const scaled = Math.abs(value) * MONEY_SCALE;
  const correction = Number.EPSILON * Math.max(1, scaled);
  const rounded = Math.round(scaled + correction) / MONEY_SCALE;

  return Object.is(value, -0) || value < 0 ? -rounded : rounded;
}

export function sumMoney(values: readonly number[]): number {
  return roundMoney(values.reduce((sum, value) => sum + value, 0));
}
