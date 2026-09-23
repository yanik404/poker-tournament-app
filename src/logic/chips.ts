import type { ChipStack, Denomination } from '../types/tournament';

export const CHIP_STOCK: ChipStack = { 5: 100, 25: 100, 50: 100, 100: 100, 500: 50, 1000: 50 };
export const DENOMINATIONS: Denomination[] = [5, 25, 50, 100, 500, 1000];
const blank = (): ChipStack => ({ 5: 0, 25: 0, 50: 0, 100: 0, 500: 0, 1000: 0 });
export const stackValue = (stack: ChipStack) => DENOMINATIONS.reduce((total, chip) => total + chip * stack[chip], 0);

/**
 * Practical home-tournament starting stack for this exact 500-chip set.
 *
 * The target mix deliberately uses different quantities per denomination:
 * enough small chips for early blinds, while most of the stack value comes
 * from 100/500/1000 chips. We also try to keep about 15% of each denomination
 * in the case for change and later colour-ups.
 *
 * For 7 players this produces exactly:
 * 10x5, 8x25, 7x50, 9x100, 3x500, 2x1000 = 5,000 per player.
 */
export function calculateStartingStack(players: number): ChipStack {
  const safePlayers = Math.max(2, Math.min(30, Math.floor(players)));
  const stack = blank();

  const target: ChipStack = {
    5: 10,
    25: 8,
    50: 7,
    100: 9,
    500: 3,
    1000: 2,
  };

  for (const chip of DENOMINATIONS) {
    const reserveAwareMax = Math.floor((CHIP_STOCK[chip] * 0.85) / safePlayers);
    const absoluteMax = Math.floor(CHIP_STOCK[chip] / safePlayers);

    // Prefer keeping reserve chips, but never let a denomination disappear
    // solely because of the reserve rule when physical stock still allows one.
    const usableMax = reserveAwareMax > 0 ? reserveAwareMax : absoluteMax;
    stack[chip] = Math.min(target[chip], usableMax);
  }

  return stack;
}

export function totalUsage(stack: ChipStack, players: number): ChipStack {
  const use = blank();
  for (const chip of DENOMINATIONS) use[chip] = stack[chip] * players;
  return use;
}

export function isWithinStock(stack: ChipStack, players: number): boolean {
  return DENOMINATIONS.every(chip => stack[chip] * players <= CHIP_STOCK[chip]);
}
