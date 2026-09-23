import type { Level } from '../types/tournament';

const ratios: [number, number][] = [[1,2],[2.5,5],[5,10],[7.5,15],[10,20],[15,30],[20,40],[30,60],[50,100],[75,150],[100,200],[150,300],[200,400],[300,600],[500,1000],[750,1500],[1000,2000]];
const roundToFive = (n: number) => Math.max(5, Math.round(n / 5) * 5);
export function buildBlindStructure(totalMinutes: number, startStack: number, requestedLevelMinutes?: number, breakMinutes = 0): Level[] {
  const levelMinutes = requestedLevelMinutes && requestedLevelMinutes >= 3 ? requestedLevelMinutes : 15;
  const breaks = breakMinutes > 0 && totalMinutes >= 75 ? 1 : 0;
  const playableMinutes = Math.max(4 * levelMinutes, totalMinutes - breaks * breakMinutes);
  const fullLevels = Math.max(4, Math.floor(playableMinutes / levelMinutes));
  const remainderMinutes = playableMinutes - fullLevels * levelMinutes;
  const base = startStack >= 1200 ? 10 : 5;
  const levels: Level[] = [];
  for (let i = 0; i < fullLevels; i++) {
    const ratio = ratios[Math.min(i, ratios.length - 1)];
    levels.push({ id: `level-${i + 1}`, smallBlind: roundToFive(ratio[0] * base), bigBlind: roundToFive(ratio[1] * base), durationSeconds: levelMinutes * 60 });
    if (breaks && i === 3) levels.push({ id: 'break-1', smallBlind: 0, bigBlind: 0, durationSeconds: breakMinutes * 60, isBreak: true });
  }
  // Keep the promise made by the duration picker: a final shorter level fills
  // the otherwise unused minutes instead of ending a 3-hour event after 2:50.
  if (remainderMinutes >= 3) {
    const ratio = ratios[Math.min(fullLevels, ratios.length - 1)];
    levels.push({ id: `level-${fullLevels + 1}`, smallBlind: roundToFive(ratio[0] * base), bigBlind: roundToFive(ratio[1] * base), durationSeconds: remainderMinutes * 60 });
  }
  return levels;
}
