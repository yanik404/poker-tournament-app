import { describe, expect, it } from 'vitest';
import { createTeams, DEFAULT_FINANCE, mainPrizes, payoutByPlayer, playerContribution } from './finances';
const players = ['Anna', 'Ben', 'Chris', 'Dora'].map((name, index) => ({ id: String(index), name }));
describe('tournament finances', () => {
  it('splits a 70 CHF team pot between two members', () => { const teams = createTeams(players, 2); expect(playerContribution(players[0], teams, DEFAULT_FINANCE)).toBe(50); });
  it('splits podium money by configured percentages', () => expect(mainPrizes(players, DEFAULT_FINANCE)).toEqual([30, 18, 12]));
  it('credits the team pot to every member of the winning team', () => { const teams = createTeams(players, 2); const payout = payoutByPlayer(players, teams, DEFAULT_FINANCE, { podium: ['0','1','2'], winningTeamId: 'team-1' }); expect(payout['0']).toBe(65); expect(payout['1']).toBe(53); });
});
