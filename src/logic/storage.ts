import type { Tournament } from '../types/tournament';
const KEY = 'poker-tournament-active-v1';
export const saveTournament = (tournament: Tournament) => localStorage.setItem(KEY, JSON.stringify(tournament));
export const loadTournament = (): Tournament | null => { try { const saved = localStorage.getItem(KEY); return saved ? JSON.parse(saved) as Tournament : null; } catch { return null; } };
export const clearTournament = () => localStorage.removeItem(KEY);
