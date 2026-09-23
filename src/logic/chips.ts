import type { ChipStack, Denomination } from '../types/tournament';

export const CHIP_STOCK: ChipStack = { 5: 100, 25: 100, 50: 100, 100: 100, 500: 50, 1000: 50 };
export const DENOMINATIONS: Denomination[] = [5, 25, 50, 100, 500, 1000];
const blank = (): ChipStack => ({ 5: 0, 25: 0, 50: 0, 100: 0, 500: 0, 1000: 0 });
export const stackValue = (stack: ChipStack) => DENOMINATIONS.reduce((total, chip) => total + chip * stack[chip], 0);

/**
 * Creates identical, chip-rich starting stacks without exceeding physical stock.
 * The small denominations are deliberately favoured: this feels like real poker
 * while keeping a manageable maximum of roughly 50 chips per player.
 */
export function calculateStartingStack(players: number): ChipStack {
  const safePlayers = Math.max(2, Math.min(30, Math.floor(players)));
  const stack = blank();
  const smallChipCount = Math.min(12, Math.floor(CHIP_STOCK[5] / safePlayers));
  for (const chip of [5, 25, 50, 100] as Denomination[]) stack[chip] = smallChipCount;
  // Larger tables need one 500 chip to retain a practical stack value once
  // the supply of small chips has been shared among everybody.
  if (safePlayers <= 6 || safePlayers >= 13) stack[500] = Math.min(1, Math.floor(CHIP_STOCK[500] / safePlayers));
  return stack;
}
export function totalUsage(stack: ChipStack, players: number): ChipStack {
  const use = blank(); for (const chip of DENOMINATIONS) use[chip] = stack[chip] * players; return use;
}
export function isWithinStock(stack: ChipStack, players: number): boolean {
  return DENOMINATIONS.every(chip => stack[chip] * players <= CHIP_STOCK[chip]);
}
