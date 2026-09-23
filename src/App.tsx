import { useCallback, useEffect, useState } from 'react';
import { SetupForm } from './components/SetupForm'; import { TournamentPlan } from './components/TournamentPlan'; import { TournamentClock } from './components/TournamentClock';
import { buildBlindStructure } from './logic/blinds'; import { calculateStartingStack, stackValue } from './logic/chips'; import { clearTournament, loadTournament, saveTournament } from './logic/storage'; import { useTournamentTimer } from './hooks/useTournamentTimer'; import type { Settings, Tournament } from './types/tournament';
type Page = 'setup' | 'plan' | 'clock';
const signal = () => { navigator.vibrate?.([180, 80, 180]); const context = new AudioContext(); const oscillator = context.createOscillator(); oscillator.frequency.value = 880; oscillator.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .25); };
export default function App() {
  const [page, setPage] = useState<Page>(() => loadTournament() ? 'clock' : 'setup'); const [tournament, setTournament] = useState<Tournament | null>(() => loadTournament());
  useEffect(() => { if (tournament) saveTournament(tournament); }, [tournament]);
  const create = (settings: Settings) => { const stack = calculateStartingStack(settings.players); const levels = buildBlindStructure(settings.totalMinutes, stackValue(stack), settings.levelMinutes, settings.breakMinutes); setTournament({ settings, stack, levels, currentLevel: 0, remainingSeconds: levels[0].durationSeconds, elapsedSeconds: 0, running: false }); setPage('plan'); };
  const switchLevel = useCallback((direction: 1 | -1, notify = false) => setTournament(old => { if (!old) return old; const nextIndex = Math.max(0, Math.min(old.levels.length - 1, old.currentLevel + direction)); const next = old.levels[nextIndex]; if (nextIndex === old.currentLevel) return old; if (notify) signal(); return { ...old, currentLevel: nextIndex, remainingSeconds: next.durationSeconds, running: false, endsAt: undefined }; }), []);
  const onTick = useCallback((remainingSeconds: number) => setTournament(old => { if (!old || !old.running) return old; const passed = Math.max(0, old.remainingSeconds - remainingSeconds); return { ...old, remainingSeconds, elapsedSeconds: old.elapsedSeconds + passed }; }), []);
  const onEnd = useCallback(() => switchLevel(1, true), [switchLevel]); useTournamentTimer(tournament, onTick, onEnd);
  const toggle = () => setTournament(old => { if (!old) return old; const running = !old.running; return { ...old, running, endsAt: running ? Date.now() + old.remainingSeconds * 1000 : undefined }; });
  const reset = () => { clearTournament(); setTournament(null); setPage('setup'); };
  if (page === 'setup') return <SetupForm onCreate={create}/>;
  if (!tournament) return null;
  if (page === 'plan') return <TournamentPlan settings={tournament.settings} stack={tournament.stack} levels={tournament.levels} onStart={() => { setPage('clock'); toggle(); }} onBack={() => setPage('setup')}/>;
  return <TournamentClock tournament={tournament} onToggle={toggle} onNext={() => switchLevel(1)} onPrevious={() => switchLevel(-1)} onReset={reset}/>;
}
