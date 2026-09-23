import { describe, expect, it } from 'vitest';
import { calculateStartingStack, isWithinStock, totalUsage } from './chips';
describe('chip allocation', () => {
  it.each(Array.from({ length: 24 }, (_, index) => index + 2))('never exceeds stock for %i players', players => expect(isWithinStock(calculateStartingStack(players), players)).toBe(true));
  it('uses plentiful small chips without using the 1000 chips at the start', () => { const stack = calculateStartingStack(10); expect(totalUsage(stack, 10)[5]).toBe(100); expect(stack[1000]).toBe(0); expect(Object.values(stack).reduce((sum, count) => sum + count, 0)).toBe(40); });
});
