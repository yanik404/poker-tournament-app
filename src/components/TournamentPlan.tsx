import { useMemo, useState } from 'react';
import { DENOMINATIONS, stackValue, totalUsage } from '../logic/chips';
import { createBalancedTeams, DEFAULT_FINANCE, mainPrizes, money, playerContribution, totalTeamPot } from '../logic/finances';
import { TeamAssignments } from './TeamAssignments';
import type { ChipStack, FinanceSettings, Level, Player, Settings, Team } from '../types/tournament';

const formatBlind = (level: Level) => level.isBreak ? 'PAUSE' : `${level.smallBlind} / ${level.bigBlind}`;

export function TournamentPlan({ settings, players, stack, levels, onStart, onBack }: { settings: Settings; players: Player[]; stack: ChipStack; levels: Level[]; onStart: (finance: FinanceSettings, teams: Team[]) => void; onBack: () => void }) {
  const use = totalUsage(stack, settings.players);
  const [finance, setFinance] = useState<FinanceSettings>(DEFAULT_FINANCE);
  const [teams, setTeams] = useState<Team[]>([]);
  const prizes = useMemo(() => mainPrizes(players, finance), [players, finance]);
  const prizeTotal = prizes.reduce((sum, prize) => sum + prize, 0);
  const updateMoney = (field: 'buyIn' | 'teamPot', value: number) => setFinance(old => ({ ...old, [field]: Math.max(0, value) }));
  const updatePrize = (index: 0 | 1 | 2, value: number) => setFinance(old => { const percentages = [...old.prizePercentages] as [number, number, number]; percentages[index] = Math.max(0, value); return { ...old, prizePercentages: percentages }; });
  const setTeamMode = (enabled: boolean) => { setFinance(old => ({ ...old, teamSize: enabled ? 2 : 0 })); setTeams(enabled ? createBalancedTeams(players) : []); };
  const prizesValid = finance.prizePercentages.reduce((sum, value) => sum + value, 0) === 100 && finance.prizePercentages[0] >= finance.prizePercentages[1] && finance.prizePercentages[1] >= finance.prizePercentages[2];
  return <main className="screen plan">
    <button className="back" onClick={onBack}>‹ Zurück</button><h1>Dein Turnier</h1>
    <section className="panel"><h2>Startstack pro Spieler</h2><div className="stack-value">{stackValue(stack).toLocaleString('de-CH')} <small>Chips</small></div><div className="chip-grid">{DENOMINATIONS.map(chip => <div key={chip}><b>{chip}</b><span>× {stack[chip]}</span></div>)}</div><h3>Gesamtverbrauch · {settings.players} Spieler</h3><div className="usage">{DENOMINATIONS.map(chip => <span key={chip}>{chip}: <b>{use[chip]}</b>/ {chip === 500 || chip === 1000 ? 50 : 100}</span>)}</div></section>
    <section className="panel"><h2>Turnierkasse</h2>
      <label className="money-input">Buy-in pro Spieler<input aria-label="Buy-in pro Spieler" type="number" min="0" step="1" value={finance.buyIn} onChange={event => updateMoney('buyIn', Number(event.target.value))}/><b>CHF</b></label>
      <label className="select-label">Team-Pot<select aria-label="Team-Modus" value={finance.teamSize ? 'on' : 'off'} onChange={event => setTeamMode(event.target.value === 'on')}><option value="off">Kein Team-Pot</option><option value="on">2er-Teams · bei ungerade 1×3er-Team</option></select></label>
      {finance.teamSize > 0 && <><label className="money-input">Team-Pot pro Spieler<input aria-label="Team-Pot pro Spieler" type="number" min="0" step="1" value={finance.teamPot} onChange={event => updateMoney('teamPot', Number(event.target.value))}/><b>CHF</b></label><p className="hint">Alle zahlen gleich viel ein: Buy-in + Team-Pot. Es gibt nur 2er-Teams; bei ungerader Anzahl wird automatisch ein 3er-Team erstellt.</p><TeamAssignments players={players} teams={teams} onChange={setTeams}/><div className="team-list">{teams.map(team => <div key={team.id}><b>{team.name}</b><span>{team.memberIds.map(id => players.find(player => player.id === id)?.name).join(' · ')}</span><small>{team.memberIds.length} Personen</small></div>)}</div><h3>Team-Pot gesamt {money(totalTeamPot(players, finance))}</h3></>}
      <h3>Einzahlung diese Runde</h3><div className="payment-list">{players.map(player => <span key={player.id}>{player.name}<b>{money(playerContribution(player, teams, finance))}</b></span>)}</div>
      <h3>Preisgeld · Hauptpot {money(finance.buyIn * players.length)}</h3><div className="prize-editor">{([0, 1, 2] as const).map(index => <label key={index}>{index + 1}. Platz · Anteil<input aria-label={`${index + 1}. Platz Prozent`} type="number" min="0" max="100" value={finance.prizePercentages[index]} onChange={event => updatePrize(index, Number(event.target.value))}/><span>{finance.prizePercentages[index]} % = {money(prizes[index])}</span></label>)}</div><p className="hint">Auszahlung gesamt: <b>{money(prizeTotal)}</b> von {money(finance.buyIn * players.length)} Hauptpot.</p>{!prizesValid && <p className="validation">Die drei Anteile müssen genau 100 % ergeben und absteigend sein.</p>}
    </section>
    <section className="panel"><h2>Blind-Plan</h2><ol className="levels">{levels.map((level, index) => <li key={level.id} className={level.isBreak ? 'break' : ''}><span>{level.isBreak ? 'BREAK' : `Level ${index + 1}`}</span><b>{formatBlind(level)}</b><small>{Math.round(level.durationSeconds / 60)} Min.</small></li>)}</ol></section>
    <button className="primary" disabled={!prizesValid} onClick={() => onStart(finance, teams)}>Turnier starten</button>
  </main>;
}
