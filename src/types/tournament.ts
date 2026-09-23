export type Denomination = 5 | 25 | 50 | 100 | 500 | 1000;
export type ChipStack = Record<Denomination, number>;
export interface Level { id: string; smallBlind: number; bigBlind: number; durationSeconds: number; isBreak?: boolean; }
export interface Settings { players: number; totalMinutes: number; levelMinutes?: number; breakMinutes: number; }
export interface Player { id: string; name: string; }
export interface Team { id: string; name: string; memberIds: string[]; }
export interface FinanceSettings { buyIn: number; teamSize: 0 | 2 | 3; teamPot: number; prizePercentages: [number, number, number]; }
export interface FinanceResult { podium: [string, string, string]; winningTeamId?: string; }
export interface Tournament { settings: Settings; players: Player[]; teams: Team[]; finance: FinanceSettings; result?: FinanceResult; stack: ChipStack; levels: Level[]; currentLevel: number; remainingSeconds: number; elapsedSeconds: number; running: boolean; endsAt?: number; }
