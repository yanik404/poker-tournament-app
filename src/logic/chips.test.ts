import { describe, expect, it } from 'vitest';
import { calculateStartingStack, isWithinStock, recommendedStackValue, stackValue, totalUsage } from './chips';

describe('chip allocation', () => {
  it.each(Array.from({ length: 29 }, (_, index) => index + 2))(
    'never exceeds stock for %i players',
    players => expect(isWithinStock(calculateStartingStack(players, 180), players)).toBe(true),
  );

  it('uses a chip-rich 5,000 stack for 7 players over 3 hours', () => {
    const stack = calculateStartingStack(7, 180);
    expect(stack).toEqual({ 5: 10, 25: 12, 50: 9, 100: 12, 500: 6, 1000: 0 });
    expect(stackValue(stack)).toBe(5000);
    expect(totalUsage(stack, 7)).toEqual({ 5: 70, 25: 84, 50: 63, 100: 84, 500: 42, 1000: 0 });
  });

  it('recommends deeper stacks for longer games', () => {
    expect(recommendedStackValue(7, 120)).toBeLessThan(recommendedStackValue(7, 240));
    expect(stackValue(calculateStartingStack(7, 120))).toBeLessThan(stackValue(calculateStartingStack(7, 240)));
  });

  it('adjusts the nominal target for field size at the same duration', () => {
    expect(recommendedStackValue(4, 180)).toBeGreaterThan(recommendedStackValue(10, 180));
  });
});
