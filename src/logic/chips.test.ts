import { describe, expect, it } from 'vitest';
import { calculateStartingStack, isWithinStock, totalUsage } from './chips';
describe('chip allocation', () => {
  it.each(Array.from({ length: 24 }, (_, index) => index + 2))('never exceeds stock for %i players', players => expect(isWithinStock(calculateStartingStack(players), players)).toBe(true));
  it('uses an equal integer allocation', () => { const stack = calculateStartingStack(10); expect(totalUsage(stack, 10)[5]).toBe(80); });
});
