import type { FinanceResult, FinanceSettings, Player, Team } from '../types/tournament';

export const DEFAULT_FINANCE: FinanceSettings = { buyIn: 15, teamSize: 0, teamPot: 10, prizePercentages: [50, 30, 20] };
export const money = (amount: number) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount);
export function createTeams(players: Player[], teamSize: 0 | 2 | 3): Team[] {
  if (!teamSize) return [];
  return Array.from({ length: Math.ceil(players.length / teamSize) }, (_, index) => {
    const members = players.slice(index * teamSize, index * teamSize + teamSize);
    return { id: `team-${index + 1}`, name: `Team ${index + 1}`, memberIds: members.map(player => player.id) };
  });
}
/** Builds pairs, with exactly one three-person team when the player count is odd. */
export function createBalancedTeams(players: Player[]): Team[] {
  if (players.length < 2) return [];
  const tripleAtEnd = players.length % 2 === 1;
  const pairCount = tripleAtEnd ? Math.floor(players.length / 2) - 1 : players.length / 2;
  const teams: Team[] = [];
  for (let index = 0; index < pairCount; index++) teams.push({ id: `team-${index + 1}`, name: `Team ${index + 1}`, memberIds: players.slice(index * 2, index * 2 + 2).map(player => player.id), maxMembers: 2 });
  if (tripleAtEnd) { const start = pairCount * 2; teams.push({ id: `team-${teams.length + 1}`, name: `Team ${teams.length + 1}`, memberIds: players.slice(start, start + 3).map(player => player.id), maxMembers: 3 }); }
  return teams;
}
export const totalTeamPot = (players: Player[], finance: FinanceSettings) => players.length * finance.teamPot;
export function playerContribution(player: Player, teams: Team[], finance: FinanceSettings): number {
  return finance.buyIn + (teams.some(candidate => candidate.memberIds.includes(player.id)) ? finance.teamPot : 0);
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
    if (winner) { const share = totalTeamPot(players, finance) / winner.memberIds.length; for (const member of winner.memberIds) payout[member] = (payout[member] ?? 0) + share; }
  }
  return payout;
}
export function ledgerKey(name: string) { return `poker-ledger:${name.trim().toLocaleLowerCase('de-CH')}`; }
