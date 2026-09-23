export type Denomination = 5 | 25 | 50 | 100 | 500 | 1000;
export type ChipStack = Record<Denomination, number>;
export interface Level { id: string; smallBlind: number; bigBlind: number; durationSeconds: number; isBreak?: boolean; }
export interface Settings { players: number; totalMinutes: number; levelMinutes?: number; breakMinutes: number; }
export interface Tournament { settings: Settings; stack: ChipStack; levels: Level[]; currentLevel: number; remainingSeconds: number; elapsedSeconds: number; running: boolean; endsAt?: number; }
