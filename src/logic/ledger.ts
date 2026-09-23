import { ledgerKey } from './finances';
import type { Player } from '../types/tournament';
export const readBalance = (player: Player): number => Number(localStorage.getItem(ledgerKey(player.name)) ?? 0);
export function writeBalance(player: Player, amount: number) { localStorage.setItem(ledgerKey(player.name), String(Math.round(amount * 100) / 100)); }
