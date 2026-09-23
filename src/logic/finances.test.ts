import { describe, expect, it } from 'vitest';
import { createBalancedTeams, createTeams, DEFAULT_FINANCE, mainPrizes, payoutByPlayer, playerContribution, totalTeamPot } from './finances';
const players = ['Anna', 'Ben', 'Chris', 'Dora'].map((name, index) => ({ id: String(index), name }));
describe('tournament finances', () => {
  it('charges every player the same team pot', () => { const teams = createTeams(players, 2); expect(playerContribution(players[0], teams, DEFAULT_FINANCE)).toBe(25); expect(playerContribution(players[3], teams, DEFAULT_FINANCE)).toBe(25); });
  it('splits podium money by configured percentages', () => expect(mainPrizes(players, DEFAULT_FINANCE)).toEqual([30, 18, 12]));
  it('credits the complete team pot to every member of the winning team', () => { const teams = createTeams(players, 2); const payout = payoutByPlayer(players, teams, DEFAULT_FINANCE, { podium: ['0','1','2'], winningTeamId: 'team-1' }); expect(totalTeamPot(players, DEFAULT_FINANCE)).toBe(40); expect(payout['0']).toBe(50); expect(payout['1']).toBe(38); });
  it('creates one triple instead of a solo player', () => { const oddPlayers = [...players, { id: '4', name: 'Eli' }]; expect(createBalancedTeams(oddPlayers).map(team => team.memberIds.length)).toEqual([2, 3]); });
});
