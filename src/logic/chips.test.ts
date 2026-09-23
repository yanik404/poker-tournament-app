import { describe, expect, it } from 'vitest';
import { calculateStartingStack, isWithinStock, stackValue, totalUsage } from './chips';

describe('chip allocation', () => {
  it.each(Array.from({ length: 29 }, (_, index) => index + 2))(
    'never exceeds stock for %i players',
    players => expect(isWithinStock(calculateStartingStack(players), players)).toBe(true),
  );

  it('uses the intended practical 5,000 stack for 7 players', () => {
    const stack = calculateStartingStack(7);
    expect(stack).toEqual({ 5: 10, 25: 8, 50: 7, 100: 9, 500: 3, 1000: 2 });
    expect(stackValue(stack)).toBe(5000);
    expect(totalUsage(stack, 7)).toEqual({ 5: 70, 25: 56, 50: 49, 100: 63, 500: 21, 1000: 14 });
  });
});
