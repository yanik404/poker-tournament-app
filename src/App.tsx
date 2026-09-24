import { useCallback, useEffect, useState } from 'react';
import { SetupForm } from './components/SetupForm'; import { TournamentPlan } from './components/TournamentPlan'; import { TournamentClock } from './components/TournamentClock'; import { Results } from './components/Results'; import { FinalSettlement } from './components/FinalSettlement';
import { buildBlindStructure } from './logic/blinds'; import { calculateStartingStack, stackValue } from './logic/chips'; import { createBalancedTeams, DEFAULT_FINANCE } from './logic/finances'; import { clearTournament, loadTournament, saveTournament } from './logic/storage'; import { useTournamentTimer } from './hooks/useTournamentTimer'; import type { FinanceSettings, Level, Player, Settings, Tournament } from './types/tournament';
type Page = 'setup' | 'plan' | 'clock' | 'results' | 'final';

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = 0.95;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const germanVoice = voices.find(voice => voice.lang.toLowerCase().startsWith('de'));
  if (germanVoice) utterance.voice = germanVoice;
  window.speechSynthesis.speak(utterance);
};

const announceLevel = (level: Level, changed = true) => {
  if (level.isBreak) {
    speak('Pause.');
    return;
  }
  const prefix = changed ? 'Blinds erhöht. ' : 'Turnier gestartet. ';
  speak(`${prefix}Small Blind ${level.smallBlind}. Big Blind ${level.bigBlind}.`);
};

const signal = (level: Level) => {
  navigator.vibrate?.([180, 80, 180]);
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    oscillator.frequency.value = 880;
    oscillator.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .25);
  } catch {
    // Speech still works even if the browser blocks the short alert tone.
  }
  announceLevel(level, true);
};

export default function App() {
  const restore = (): Tournament | null => { const saved = loadTournament(); if (!saved) return null; const players = saved.players ?? Array.from({ length: saved.settings.players }, (_, index) => ({ id: `player-${index + 1}`, name: `Spieler ${index + 1}` })); const finance = saved.finance ?? DEFAULT_FINANCE; return { ...saved, players, finance, teams: saved.teams ?? (finance.teamSize ? createBalancedTeams(players) : []) }; };
  const [tournament, setTournament] = useState<Tournament | null>(restore); const [page, setPage] = useState<Page>(() => restore() ? 'clock' : 'setup');
  useEffect(() => { if (tournament) saveTournament(tournament); }, [tournament]);
  const create = (settings: Settings, players: Player[]) => { const stack = calculateStartingStack(settings.players, settings.totalMinutes); const levels = buildBlindStructure(settings.totalMinutes, stackValue(stack), settings.players, settings.levelMinutes, settings.breakMinutes); setTournament({ settings, players, teams: [], finance: DEFAULT_FINANCE, stack, levels, currentLevel: 0, remainingSeconds: levels[0].durationSeconds, elapsedSeconds: 0, running: false }); setPage('plan'); };
  const switchLevel = useCallback((direction: 1 | -1, notify = true) => setTournament(old => { if (!old) return old; const nextIndex = Math.max(0, Math.min(old.levels.length - 1, old.currentLevel + direction)); const next = old.levels[nextIndex]; if (nextIndex === old.currentLevel) return old; if (notify) signal(next); return { ...old, currentLevel: nextIndex, remainingSeconds: next.durationSeconds, running: false, endsAt: undefined }; }), []);
  const onTick = useCallback((remainingSeconds: number) => setTournament(old => { if (!old || !old.running) return old; const passed = Math.max(0, old.remainingSeconds - remainingSeconds); return { ...old, remainingSeconds, elapsedSeconds: old.elapsedSeconds + passed }; }), []);
  const onEnd = useCallback(() => switchLevel(1, true), [switchLevel]); useTournamentTimer(tournament, onTick, onEnd);
  const toggle = () => setTournament(old => { if (!old) return old; const running = !old.running; return { ...old, running, endsAt: running ? Date.now() + old.remainingSeconds * 1000 : undefined }; });
  const reset = () => { clearTournament(); setTournament(null); setPage('setup'); };
  const nextRound = () => { setTournament(old => old ? { ...old, teams: [], finance: DEFAULT_FINANCE, result: undefined, currentLevel: 0, remainingSeconds: old.levels[0].durationSeconds, elapsedSeconds: 0, running: false, endsAt: undefined } : old); setPage('plan'); };
  if (page === 'setup') return <SetupForm onCreate={create}/>;
  if (!tournament) return null;
  if (page === 'plan') return <TournamentPlan settings={tournament.settings} players={tournament.players} stack={tournament.stack} levels={tournament.levels} onStart={(finance: FinanceSettings, teams) => { const firstLevel = tournament.levels[0]; announceLevel(firstLevel, false); setTournament(old => old ? { ...old, finance, teams, running: true, endsAt: Date.now() + old.remainingSeconds * 1000 } : old); setPage('clock'); }} onBack={() => setPage('setup')}/>;
  if (page === 'results') return <Results tournament={tournament} onBack={() => setPage('clock')} onSaved={result => setTournament(old => old ? { ...old, result } : old)} onNextRound={nextRound} onFinish={() => setPage('final')}/>;
  if (page === 'final') return <FinalSettlement tournament={tournament} onNewTournament={reset}/>;
  return <TournamentClock tournament={tournament} onToggle={toggle} onNext={() => switchLevel(1, true)} onPrevious={() => switchLevel(-1, true)} onReset={reset} onEndRound={() => { setTournament(old => old ? { ...old, running: false, endsAt: undefined } : old); setPage('results'); }}/>
}
