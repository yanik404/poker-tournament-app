import type { Level } from '../types/tournament';

const roundBlind = (value: number) => {
  const unit = value < 250 ? 5 : value < 1000 ? 25 : value < 5000 ? 100 : 500;
  return Math.max(unit, Math.round(value / unit) * unit);
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
  const playableMinutes = Math.max(4 * levelMinutes, totalMinutes - (hasBreak ? breakMinutes : 0));
  const fullLevels = Math.max(4, Math.floor(playableMinutes / levelMinutes));
  const remainderMinutes = playableMinutes - fullLevels * levelMinutes;
  const playableLevelCount = fullLevels + (remainderMinutes >= 3 ? 1 : 0);

  const safePlayers = Math.max(2, Math.floor(players));
  const totalChips = Math.max(startStack * safePlayers, startStack * 2);
  const startBigBlind = 20;
  const targetFinalBigBlind = Math.max(100, roundBlind(totalChips / 20));
  const breakAfterLevels = Math.max(1, Math.round(60 / levelMinutes));
  const levels: Level[] = [];
  let previousBigBlind = 0;

  for (let i = 0; i < playableLevelCount; i++) {
    const progress = playableLevelCount <= 1 ? 1 : i / (playableLevelCount - 1);
    const rawBigBlind = startBigBlind * Math.pow(targetFinalBigBlind / startBigBlind, progress);
    let bigBlind = roundBlind(rawBigBlind);
    if (i === 0) bigBlind = startBigBlind;
    if (bigBlind <= previousBigBlind && i > 0) bigBlind = previousBigBlind + (previousBigBlind < 250 ? 5 : previousBigBlind < 1000 ? 25 : previousBigBlind < 5000 ? 100 : 500);
    const smallBlind = roundBlind(bigBlind / 2);
    const duration = i < fullLevels ? levelMinutes : remainderMinutes;

    levels.push({
      id: `level-${i + 1}`,
      smallBlind,
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
