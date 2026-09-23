import type { FinanceResult, FinanceSettings, Player, Team } from '../types/tournament';

export const DEFAULT_FINANCE: FinanceSettings = { buyIn: 15, teamSize: 0, teamPot: 70, prizePercentages: [50, 30, 20] };
export const money = (amount: number) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount);
export function createTeams(players: Player[], teamSize: 0 | 2 | 3): Team[] {
  if (!teamSize) return [];
  return Array.from({ length: Math.ceil(players.length / teamSize) }, (_, index) => {
    const members = players.slice(index * teamSize, index * teamSize + teamSize);
    return { id: `team-${index + 1}`, name: `Team ${index + 1}`, memberIds: members.map(player => player.id) };
  });
}
export function teamShare(team: Team, finance: FinanceSettings): number { return team.memberIds.length ? finance.teamPot / team.memberIds.length : 0; }
export function playerContribution(player: Player, teams: Team[], finance: FinanceSettings): number {
  const team = teams.find(candidate => candidate.memberIds.includes(player.id));
  return finance.buyIn + (team ? teamShare(team, finance) : 0);
}
export function mainPrizes(players: Player[], finance: FinanceSettings): number[] {
  const total = players.length * finance.buyIn;
  return finance.prizePercentages.map(percent => Math.round(total * percent) / 100);
}
export function payoutByPlayer(players: Player[], teams: Team[], finance: FinanceSettings, result: FinanceResult): Record<string, number> {
  const payout = Object.fromEntries(players.map(player => [player.id, 0]));
  const prizes = mainPrizes(players, finance);
  result.podium.forEach((playerId, index) => { payout[playerId] = (payout[playerId] ?? 0) + prizes[index]; });
  if (result.winningTeamId) {
    const winner = teams.find(team => team.id === result.winningTeamId);
    if (winner) for (const member of winner.memberIds) payout[member] = (payout[member] ?? 0) + teamShare(winner, finance);
  }
  return payout;
}
export function ledgerKey(name: string) { return `poker-ledger:${name.trim().toLocaleLowerCase('de-CH')}`; }
