import { useCallback, useEffect, useState } from 'react';
import { SetupForm } from './components/SetupForm'; import { TournamentPlan } from './components/TournamentPlan'; import { TournamentClock } from './components/TournamentClock'; import { Results } from './components/Results'; import { FinalSettlement } from './components/FinalSettlement';
import { buildBlindStructure } from './logic/blinds'; import { calculateStartingStack, stackValue } from './logic/chips'; import { createBalancedTeams, DEFAULT_FINANCE } from './logic/finances'; import { clearTournament, loadTournament, saveTournament } from './logic/storage'; import { useTournamentTimer } from './hooks/useTournamentTimer'; import type { FinanceSettings, Player, Settings, Tournament } from './types/tournament';
type Page = 'setup' | 'plan' | 'clock' | 'results' | 'final';

const SOUND_KEY = 'poker-timer-sound-v1';
let sharedAudioContext: AudioContext | null = null;

const unlockAudio = async () => {
  try {
    sharedAudioContext ??= new AudioContext();
    if (sharedAudioContext.state === 'suspended') await sharedAudioContext.resume();
  } catch {
    sharedAudioContext = null;
  }
};

const playBell = async () => {
  await unlockAudio();
  if (!sharedAudioContext) return;
  try {
    const context = sharedAudioContext;
    const now = context.currentTime;
    const ringOffsets = [0, 0.7, 1.4, 2.1];

    ringOffsets.forEach(offset => {
      const start = now + offset;
      [880, 1320, 1760].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index === 0 ? 'triangle' : 'sine';
        oscillator.frequency.value = frequency;
        const volume = index === 0 ? 0.26 : index === 1 ? 0.12 : 0.07;
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.62);
      });
    });
  } catch {
    // Vibration still alerts the players if WebAudio is unavailable.
  }
};

export default function App() {
  const restore = (): Tournament | null => { const saved = loadTournament(); if (!saved) return null; const players = saved.players ?? Array.from({ length: saved.settings.players }, (_, index) => ({ id: `player-${index + 1}`, name: `Spieler ${index + 1}` })); const finance = saved.finance ?? DEFAULT_FINANCE; return { ...saved, players, finance, teams: saved.teams ?? (finance.teamSize ? createBalancedTeams(players) : []) }; };
  const [tournament, setTournament] = useState<Tournament | null>(restore); const [page, setPage] = useState<Page>(() => restore() ? 'clock' : 'setup');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem(SOUND_KEY) !== 'off');
  useEffect(() => { if (tournament) saveTournament(tournament); }, [tournament]);
  useEffect(() => { localStorage.setItem(SOUND_KEY, soundEnabled ? 'on' : 'off'); }, [soundEnabled]);
  const create = (settings: Settings, players: Player[]) => { const stack = calculateStartingStack(settings.players, settings.totalMinutes); const levels = buildBlindStructure(settings.totalMinutes, stackValue(stack), settings.players, settings.levelMinutes, settings.breakMinutes); setTournament({ settings, players, teams: [], finance: DEFAULT_FINANCE, stack, levels, currentLevel: 0, remainingSeconds: levels[0].durationSeconds, elapsedSeconds: 0, running: false }); setPage('plan'); };
  const switchLevel = useCallback((direction: 1 | -1) => setTournament(old => { if (!old) return old; const nextIndex = Math.max(0, Math.min(old.levels.length - 1, old.currentLevel + direction)); const next = old.levels[nextIndex]; if (nextIndex === old.currentLevel) return old; return { ...old, currentLevel: nextIndex, remainingSeconds: next.durationSeconds, running: false, endsAt: undefined }; }), []);
  const onTick = useCallback((remainingSeconds: number) => setTournament(old => { if (!old || !old.running) return old; const passed = Math.max(0, old.remainingSeconds - remainingSeconds); return { ...old, remainingSeconds, elapsedSeconds: old.elapsedSeconds + passed }; }), []);
  const onEnd = useCallback(() => {
    navigator.vibrate?.([450, 180, 450, 180, 450]);
    if (soundEnabled) void playBell();
    setTournament(old => {
      if (!old) return old;
      const nextIndex = old.currentLevel + 1;
      if (nextIndex >= old.levels.length) return { ...old, remainingSeconds: 0, running: false, endsAt: undefined };
      const next = old.levels[nextIndex];
      return {
        ...old,
        currentLevel: nextIndex,
        remainingSeconds: next.durationSeconds,
        running: true,
        endsAt: Date.now() + next.durationSeconds * 1000,
      };
    });
  }, [soundEnabled]);
  useTournamentTimer(tournament, onTick, onEnd);
  const toggle = async () => { if (!tournament?.running && soundEnabled) await unlockAudio(); setTournament(old => { if (!old) return old; const running = !old.running; return { ...old, running, endsAt: running ? Date.now() + old.remainingSeconds * 1000 : undefined }; }); };
  const reset = () => { clearTournament(); setTournament(null); setPage('setup'); };
  const nextRound = () => { setTournament(old => old ? { ...old, teams: [], finance: DEFAULT_FINANCE, result: undefined, currentLevel: 0, remainingSeconds: old.levels[0].durationSeconds, elapsedSeconds: 0, running: false, endsAt: undefined } : old); setPage('plan'); };
  if (page === 'setup') return <SetupForm onCreate={create}/>;
  if (!tournament) return null;
  if (page === 'plan') return <TournamentPlan settings={tournament.settings} players={tournament.players} stack={tournament.stack} levels={tournament.levels} onStart={async (finance: FinanceSettings, teams) => { if (soundEnabled) await unlockAudio(); setTournament(old => old ? { ...old, finance, teams, running: true, endsAt: Date.now() + old.remainingSeconds * 1000 } : old); setPage('clock'); }} onBack={() => setPage('setup')}/>;
  if (page === 'results') return <Results tournament={tournament} onBack={() => setPage('clock')} onSaved={result => setTournament(old => old ? { ...old, result } : old)} onNextRound={nextRound} onFinish={() => setPage('final')}/>;
  if (page === 'final') return <FinalSettlement tournament={tournament} onNewTournament={reset}/>;
  return <TournamentClock tournament={tournament} onToggle={toggle} onNext={() => switchLevel(1)} onPrevious={() => switchLevel(-1)} soundEnabled={soundEnabled} onSoundToggle={() => setSoundEnabled(value => !value)} onReset={reset} onEndRound={() => { setTournament(old => old ? { ...old, running: false, endsAt: undefined } : old); setPage('results'); }}/>
}
