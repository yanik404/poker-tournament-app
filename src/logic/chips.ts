import type { ChipStack, Denomination } from '../types/tournament';

export const CHIP_STOCK: ChipStack = { 5: 100, 25: 100, 50: 100, 100: 100, 500: 50, 1000: 50 };
export const DENOMINATIONS: Denomination[] = [5, 25, 50, 100, 500, 1000];

/** Exact colours of the physical GONSER A-165 set (colour names from GONSER). */
export const CHIP_COLOURS: Record<Denomination, { name: string; hex: string; text: string }> = {
  5: { name: 'Rot', hex: '#c62828', text: '#ffffff' },
  25: { name: 'Grün', hex: '#2e7d32', text: '#ffffff' },
  50: { name: 'Blau', hex: '#1565c0', text: '#ffffff' },
  100: { name: 'Schwarz', hex: '#16191d', text: '#ffffff' },
  500: { name: 'Gelb', hex: '#f2c230', text: '#171717' },
  1000: { name: 'Hellgrün', hex: '#8bcf78', text: '#10200d' },
};

const blank = (): ChipStack => ({ 5: 0, 25: 0, 50: 0, 100: 0, 500: 0, 1000: 0 });
export const stackValue = (stack: ChipStack) => DENOMINATIONS.reduce((total, chip) => total + chip * stack[chip], 0);

// A player does not need an unlimited number of one denomination. These caps keep
// the stack practical while still deliberately using lots of physical chips.
const PRACTICAL_MAX: ChipStack = { 5: 10, 25: 12, 50: 10, 100: 12, 500: 8, 1000: 8 };

const durationBaseValue = (minutes: number) => {
  const safe = Math.max(60, Math.min(480, minutes));
  const points: Array<[number, number]> = [
    [60, 2000], [120, 3000], [180, 5000], [240, 6500],
    [300, 8000], [360, 9500], [420, 10500], [480, 12000],
  ];
  for (let i = 1; i < points.length; i++) {
    const [rightMinutes, rightValue] = points[i];
    if (safe <= rightMinutes) {
      const [leftMinutes, leftValue] = points[i - 1];
      const ratio = (safe - leftMinutes) / (rightMinutes - leftMinutes);
      return leftValue + ratio * (rightValue - leftValue);
    }
  }
  return points[points.length - 1][1];
};

/**
 * Recommended nominal stack value.
 *
 * PokerStars' home-game guidance identifies player count, starting stack and
 * blind speed as the main duration levers, but there is no official formula
 * that guarantees an exact finishing time. This is therefore a transparent
 * home-tournament heuristic: longer games get deeper stacks, while smaller
 * fields can use somewhat deeper stacks and larger fields somewhat shallower
 * stacks for the same requested duration.
 */
export function recommendedStackValue(players: number, totalMinutes: number): number {
  const safePlayers = Math.max(2, Math.min(30, Math.floor(players)));
  const playerFactor = Math.max(0.75, Math.min(1.3, Math.sqrt(7 / safePlayers)));
  return Math.max(1500, Math.round((durationBaseValue(totalMinutes) * playerFactor) / 500) * 500);
}

const chipCount = (stack: ChipStack) => DENOMINATIONS.reduce((sum, chip) => sum + stack[chip], 0);

/**
 * Builds an identical starting stack for every player from the exact GONSER
 * A-165 inventory. It aims for the duration/player target above and, among
 * stacks with the same value, deliberately chooses the one with the most
 * useful physical chips. Roughly 10% of each denomination is kept in reserve
 * where possible for change and later colour-ups.
 */
export function calculateStartingStack(players: number, totalMinutes = 180): ChipStack {
  const safePlayers = Math.max(2, Math.min(30, Math.floor(players)));
  const targetValue = recommendedStackValue(safePlayers, totalMinutes);
  const maxPerPlayer = blank();

  for (const chip of DENOMINATIONS) {
    const reserveAware = Math.floor((CHIP_STOCK[chip] * 0.9) / safePlayers);
    const absolute = Math.floor(CHIP_STOCK[chip] / safePlayers);
    const available = reserveAware > 0 ? reserveAware : absolute;
    maxPerPlayer[chip] = Math.min(PRACTICAL_MAX[chip], available);
  }

  // Bounded knapsack. For every reachable value keep the solution containing
  // the greatest number of chips. This directly implements "as many chips as
  // makes sense" without exceeding the desired stack value or physical stock.
  let states = new Map<number, ChipStack>([[0, blank()]]);
  for (const chip of DENOMINATIONS) {
    const next = new Map<number, ChipStack>();
    for (const [value, current] of states) {
      for (let count = 0; count <= maxPerPlayer[chip]; count++) {
        const newValue = value + count * chip;
        if (newValue > targetValue) break;
        const candidate = { ...current, [chip]: count } as ChipStack;
        const existing = next.get(newValue);
        if (!existing || chipCount(candidate) > chipCount(existing)) next.set(newValue, candidate);
      }
    }
    states = next;
  }

  if (states.has(targetValue)) return states.get(targetValue)!;
  const bestValue = Math.max(...states.keys());
  return states.get(bestValue) ?? blank();
}

export function totalUsage(stack: ChipStack, players: number): ChipStack {
  const use = blank();
  for (const chip of DENOMINATIONS) use[chip] = stack[chip] * players;
  return use;
}

export function isWithinStock(stack: ChipStack, players: number): boolean {
  return DENOMINATIONS.every(chip => stack[chip] * players <= CHIP_STOCK[chip]);
}
