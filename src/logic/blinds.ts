import type { Level } from '../types/tournament';

const STANDARD_BIG_BLINDS = [
  20, 30, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800,
  1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 12000,
  15000, 20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000,
];

const nearestStandardBigBlind = (value: number) => STANDARD_BIG_BLINDS.reduce((best, blind) =>
  Math.abs(blind - value) < Math.abs(best - value) ? blind : best,
STANDARD_BIG_BLINDS[0]);

const smallBlindFor = (bigBlind: number) => {
  const half = bigBlind / 2;
  const unit = bigBlind <= 200 ? 5 : bigBlind <= 1000 ? 25 : bigBlind <= 5000 ? 50 : 500;
  return Math.max(unit, Math.round(half / unit) * unit);
};

/**
 * Builds a time-boxed home-tournament structure.
 *
 * The requested duration determines how many levels are available. Player count
 * and starting stack determine the total chips in play; the final blind target
 * is chosen so that the average heads-up stack is roughly 10 big blinds. That
 * is a practical tournament heuristic, not a promise of the exact finishing
 * minute: actual elimination speed still depends on play.
 */
export function buildBlindStructure(
  totalMinutes: number,
  startStack: number,
  players: number,
  requestedLevelMinutes?: number,
  breakMinutes = 0,
): Level[] {
  const levelMinutes = requestedLevelMinutes && requestedLevelMinutes >= 3 ? requestedLevelMinutes : 15;
  const hasBreak = breakMinutes > 0 && totalMinutes >= 75;
  const playableMinutes = Math.max(1, totalMinutes - (hasBreak ? breakMinutes : 0));
  const fullLevels = Math.max(1, Math.floor(playableMinutes / levelMinutes));
  const remainderMinutes = playableMinutes - fullLevels * levelMinutes;
  const playableLevelCount = fullLevels + (remainderMinutes >= 3 ? 1 : 0);

  const safePlayers = Math.max(2, Math.floor(players));
  const totalChips = Math.max(startStack * safePlayers, startStack * 2);
  const startBigBlind = 20;
  const targetFinalBigBlind = Math.max(100, nearestStandardBigBlind(totalChips / 20));
  const breakAfterLevels = Math.max(1, Math.round(60 / levelMinutes));
  const levels: Level[] = [];
  let previousBigBlind = 0;

  for (let i = 0; i < playableLevelCount; i++) {
    const progress = playableLevelCount <= 1 ? 1 : i / (playableLevelCount - 1);
    const rawBigBlind = startBigBlind * Math.pow(targetFinalBigBlind / startBigBlind, progress);
    let bigBlind = nearestStandardBigBlind(rawBigBlind);
    if (i === 0) bigBlind = startBigBlind;

    if (bigBlind <= previousBigBlind && i > 0) {
      const previousIndex = STANDARD_BIG_BLINDS.indexOf(previousBigBlind);
      bigBlind = STANDARD_BIG_BLINDS[Math.min(STANDARD_BIG_BLINDS.length - 1, previousIndex + 1)];
    }

    const duration = i < fullLevels ? levelMinutes : remainderMinutes;
    levels.push({
      id: `level-${i + 1}`,
      smallBlind: smallBlindFor(bigBlind),
      bigBlind,
      durationSeconds: duration * 60,
    });
    previousBigBlind = bigBlind;

    if (hasBreak && i + 1 === breakAfterLevels && i < playableLevelCount - 1) {
      levels.push({ id: 'break-1', smallBlind: 0, bigBlind: 0, durationSeconds: breakMinutes * 60, isBreak: true });
    }
  }

  return levels;
}
