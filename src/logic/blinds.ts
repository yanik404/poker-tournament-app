import type { Level } from '../types/tournament';

const ratios: [number, number][] = [[1,2],[2,5],[5,10],[7.5,15],[10,20],[15,30],[20,40],[30,60],[50,100],[75,150],[100,200],[150,300],[200,400],[300,600],[500,1000],[750,1500],[1000,2000]];
const roundToFive = (n: number) => Math.max(5, Math.round(n / 5) * 5);
export function buildBlindStructure(totalMinutes: number, startStack: number, requestedLevelMinutes?: number, breakMinutes = 0): Level[] {
  const levelMinutes = requestedLevelMinutes && requestedLevelMinutes >= 3 ? requestedLevelMinutes : 15;
  const breaks = breakMinutes > 0 && totalMinutes >= 75 ? 1 : 0;
  const playable = Math.max(4, Math.floor((totalMinutes - breaks * breakMinutes) / levelMinutes));
  const base = startStack >= 1200 ? 10 : 5;
  const levels: Level[] = [];
  for (let i = 0; i < playable; i++) {
    const ratio = ratios[Math.min(i, ratios.length - 1)];
    levels.push({ id: `level-${i + 1}`, smallBlind: roundToFive(ratio[0] * base), bigBlind: roundToFive(ratio[1] * base), durationSeconds: levelMinutes * 60 });
    if (breaks && i === 3) levels.push({ id: 'break-1', smallBlind: 0, bigBlind: 0, durationSeconds: breakMinutes * 60, isBreak: true });
  }
  return levels;
}
