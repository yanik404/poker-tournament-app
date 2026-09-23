import type { ChipStack, Denomination } from '../types/tournament';

export const CHIP_STOCK: ChipStack = { 5: 100, 25: 100, 50: 100, 100: 100, 500: 50, 1000: 50 };
export const DENOMINATIONS: Denomination[] = [5, 25, 50, 100, 500, 1000];
const blank = (): ChipStack => ({ 5: 0, 25: 0, 50: 0, 100: 0, 500: 0, 1000: 0 });
export const stackValue = (stack: ChipStack) => DENOMINATIONS.reduce((total, chip) => total + chip * stack[chip], 0);

/** Creates identical, table-friendly starting stacks without exceeding physical stock. */
export function calculateStartingStack(players: number): ChipStack {
  const safePlayers = Math.max(2, Math.min(30, Math.floor(players)));
  const stack = blank();
  // Enough change for the opening blinds, then use larger denominations efficiently.
  const preferred: ChipStack = safePlayers <= 6
    ? { 5: 10, 25: 8, 50: 4, 100: 8, 500: 2, 1000: 0 }
    : safePlayers <= 10
      ? { 5: 8, 25: 8, 50: 4, 100: 7, 500: 1, 1000: 0 }
      : { 5: 6, 25: 6, 50: 3, 100: 5, 500: 1, 1000: 0 };
  for (const chip of DENOMINATIONS) stack[chip] = Math.min(preferred[chip], Math.floor(CHIP_STOCK[chip] / safePlayers));
  // Guarantee a useful stack if an unusually high player count exhausts small chips.
  if (stackValue(stack) === 0) stack[1000] = Math.max(1, Math.floor(CHIP_STOCK[1000] / safePlayers));
  return stack;
}
export function totalUsage(stack: ChipStack, players: number): ChipStack {
  const use = blank(); for (const chip of DENOMINATIONS) use[chip] = stack[chip] * players; return use;
}
export function isWithinStock(stack: ChipStack, players: number): boolean {
  return DENOMINATIONS.every(chip => stack[chip] * players <= CHIP_STOCK[chip]);
}
