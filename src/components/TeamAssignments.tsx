import type { Player, Team } from '../types/tournament';

interface Props { players: Player[]; teams: Team[]; teamSize: 2 | 3; onChange: (teams: Team[]) => void; }
export function TeamAssignments({ players, teams, teamSize, onChange }: Props) {
  const move = (playerId: string, destinationId: string) => {
    const sourceId = teams.find(team => team.memberIds.includes(playerId))?.id;
    const next = teams.map(team => ({ ...team, memberIds: team.memberIds.filter(member => member !== playerId) }));
    const destination = next.find(team => team.id === destinationId);
    if (!destination) return;
    if (destination.memberIds.length >= teamSize) {
      const swapped = destination.memberIds.shift();
      const source = next.find(team => team.id === sourceId);
      if (swapped && source) source.memberIds.push(swapped);
    }
    destination.memberIds.push(playerId);
    onChange(next.filter(team => team.memberIds.length > 0));
  };
  return <div className="assignment-list">{players.map(player => { const current = teams.find(team => team.memberIds.includes(player.id)); return <label key={player.id}><span>{player.name}</span><select aria-label={`Team von ${player.name}`} value={current?.id ?? ''} onChange={event => move(player.id, event.target.value)}>{teams.map(team => <option key={team.id} value={team.id}>{team.name} · {team.memberIds.length}/{teamSize}</option>)}</select></label>; })}</div>;
}
