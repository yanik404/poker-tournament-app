import { useCallback, useEffect, useState } from 'react';
import { SetupForm } from './components/SetupForm'; import { TournamentPlan } from './components/TournamentPlan'; import { TournamentClock } from './components/TournamentClock'; import { Results } from './components/Results'; import { FinalSettlement } from './components/FinalSettlement';
import { buildBlindStructure } from './logic/blinds'; import { calculateStartingStack, stackValue } from './logic/chips'; import { createBalancedTeams, DEFAULT_FINANCE } from './logic/finances'; import { clearTournament, loadTournament, saveTournament } from './logic/storage'; import { useTournamentTimer } from './hooks/useTournamentTimer'; import type { FinanceSettings, Level, Player, Settings, Tournament } from './types/tournament';
type Page = 'setup' | 'plan' | 'clock' | 'results' | 'final';
export type AudioMode = 'sound' | 'vibrate' | 'mute';
export type AlertSound = 'classic' | 'casino' | 'bell' | 'soft';

const AUDIO_KEY = 'poker-audio-settings-v1';
let sharedAudioContext: AudioContext | null = null;

const unlockAudio = async () => {
  try {
    sharedAudioContext ??= new AudioContext();
    if (sharedAudioContext.state === 'suspended') await sharedAudioContext.resume();
  } catch {
    sharedAudioContext = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.resume();
};

const playNote = (context: AudioContext, frequency: number, start: number, duration: number, volume: number) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
};

const playAlertSound = async (style: AlertSound) => {
  await unlockAudio();
  if (!sharedAudioContext) return;
  try {
    const now = sharedAudioContext.currentTime;
    if (style === 'classic') {
      playNote(sharedAudioContext, 880, now, 0.22, 0.18);
      playNote(sharedAudioContext, 1175, now + 0.22, 0.25, 0.16);
    } else if (style === 'casino') {
      playNote(sharedAudioContext, 523, now, 0.18, 0.16);
      playNote(sharedAudioContext, 659, now + 0.14, 0.18, 0.16);
      playNote(sharedAudioContext, 784, now + 0.28, 0.28, 0.17);
    } else if (style === 'bell') {
      playNote(sharedAudioContext, 1047, now, 0.42, 0.17);
      playNote(sharedAudioContext, 1568, now + 0.05, 0.48, 0.09);
    } else {
      playNote(sharedAudioContext, 660, now, 0.32, 0.10);
      playNote(sharedAudioContext, 880, now + 0.18, 0.34, 0.08);
    }
  } catch {
    // Voice can still announce the blinds if WebAudio is unavailable.
  }
};

const chooseEnglishVoice = () => {
  if (!('speechSynthesis' in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter(voice => voice.lang.toLowerCase().startsWith('en'));
  const preferredNames = ['Samantha', 'Google UK English Female', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira', 'Siri Female', 'Ava', 'Serena', 'Karen', 'Moira', 'Tessa'];
  return preferredNames.map(name => english.find(voice => voice.name.toLowerCase().includes(name.toLowerCase()))).find(Boolean)
    ?? english.find(voice => voice.lang.toLowerCase().startsWith('en-gb'))
    ?? english.find(voice => voice.lang.toLowerCase().startsWith('en-us'))
    ?? english[0];
};

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = 0.96;
  utterance.pitch = 1.02;
  utterance.volume = 1;
  const voice = chooseEnglishVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
};

const announceLevel = (level: Level, changed = true) => {
  if (level.isBreak) {
    speak('Break time.');
    return;
  }
  const prefix = changed ? 'Blinds are up. ' : 'Tournament started. ';
  speak(`${prefix}Small blind ${level.smallBlind}. Big blind ${level.bigBlind}.`);
};

export default function App() {
  const restore = (): Tournament | null => { const saved = loadTournament(); if (!saved) return null; const players = saved.players ?? Array.from({ length: saved.settings.players }, (_, index) => ({ id: `player-${index + 1}`, name: `Spieler ${index + 1}` })); const finance = saved.finance ?? DEFAULT_FINANCE; return { ...saved, players, finance, teams: saved.teams ?? (finance.teamSize ? createBalancedTeams(players) : []) }; };
  const loadAudio = () => { try { const saved = JSON.parse(localStorage.getItem(AUDIO_KEY) || '{}'); return { mode: (saved.mode ?? 'sound') as AudioMode, alertSound: (saved.alertSound ?? 'casino') as AlertSound }; } catch { return { mode: 'sound' as AudioMode, alertSound: 'casino' as AlertSound }; } };
  const [tournament, setTournament] = useState<Tournament | null>(restore); const [page, setPage] = useState<Page>(() => restore() ? 'clock' : 'setup');
  const [audioMode, setAudioMode] = useState<AudioMode>(() => loadAudio().mode);
  const [alertSound, setAlertSound] = useState<AlertSound>(() => loadAudio().alertSound);
  useEffect(() => { if (tournament) saveTournament(tournament); }, [tournament]);
  useEffect(() => { localStorage.setItem(AUDIO_KEY, JSON.stringify({ mode: audioMode, alertSound })); }, [audioMode, alertSound]);
  const create = (settings: Settings, players: Player[]) => { const stack = calculateStartingStack(settings.players, settings.totalMinutes); const levels = buildBlindStructure(settings.totalMinutes, stackValue(stack), settings.players, settings.levelMinutes, settings.breakMinutes); setTournament({ settings, players, teams: [], finance: DEFAULT_FINANCE, stack, levels, currentLevel: 0, remainingSeconds: levels[0].durationSeconds, elapsedSeconds: 0, running: false }); setPage('plan'); };
  const notify = useCallback(async (level: Level) => {
    if (audioMode === 'mute') return;
    navigator.vibrate?.([180, 80, 180]);
    if (audioMode === 'vibrate') return;
    await playAlertSound(alertSound);
    announceLevel(level, true);
  }, [audioMode, alertSound]);
  const switchLevel = useCallback((direction: 1 | -1, shouldNotify = true) => setTournament(old => { if (!old) return old; const nextIndex = Math.max(0, Math.min(old.levels.length - 1, old.currentLevel + direction)); const next = old.levels[nextIndex]; if (nextIndex === old.currentLevel) return old; if (shouldNotify) void notify(next); return { ...old, currentLevel: nextIndex, remainingSeconds: next.durationSeconds, running: false, endsAt: undefined }; }), [notify]);
  const onTick = useCallback((remainingSeconds: number) => setTournament(old => { if (!old || !old.running) return old; const passed = Math.max(0, old.remainingSeconds - remainingSeconds); return { ...old, remainingSeconds, elapsedSeconds: old.elapsedSeconds + passed }; }), []);
  const onEnd = useCallback(() => switchLevel(1, true), [switchLevel]); useTournamentTimer(tournament, onTick, onEnd);
  const toggle = () => setTournament(old => { if (!old) return old; const running = !old.running; return { ...old, running, endsAt: running ? Date.now() + old.remainingSeconds * 1000 : undefined }; });
  const reset = () => { clearTournament(); setTournament(null); setPage('setup'); };
  const nextRound = () => { setTournament(old => old ? { ...old, teams: [], finance: DEFAULT_FINANCE, result: undefined, currentLevel: 0, remainingSeconds: old.levels[0].durationSeconds, elapsedSeconds: 0, running: false, endsAt: undefined } : old); setPage('plan'); };
  const previewAlert = async () => {
    if (audioMode === 'mute') return;
    navigator.vibrate?.([100, 70, 100]);
    if (audioMode === 'vibrate') return;
    await playAlertSound(alertSound);
    const level = tournament?.levels[tournament.currentLevel];
    if (level) announceLevel(level, false);
  };
  if (page === 'setup') return <SetupForm onCreate={create}/>;
  if (!tournament) return null;
  if (page === 'plan') return <TournamentPlan settings={tournament.settings} players={tournament.players} stack={tournament.stack} levels={tournament.levels} onStart={async (finance: FinanceSettings, teams) => { const firstLevel = tournament.levels[0]; await unlockAudio(); if (audioMode !== 'mute') navigator.vibrate?.([100, 60, 100]); if (audioMode === 'sound') { await playAlertSound(alertSound); announceLevel(firstLevel, false); } setTournament(old => old ? { ...old, finance, teams, running: true, endsAt: Date.now() + old.remainingSeconds * 1000 } : old); setPage('clock'); }} onBack={() => setPage('setup')}/>;
  if (page === 'results') return <Results tournament={tournament} onBack={() => setPage('clock')} onSaved={result => setTournament(old => old ? { ...old, result } : old)} onNextRound={nextRound} onFinish={() => setPage('final')}/>;
  if (page === 'final') return <FinalSettlement tournament={tournament} onNewTournament={reset}/>;
  return <TournamentClock tournament={tournament} onToggle={toggle} onNext={() => switchLevel(1, true)} onPrevious={() => switchLevel(-1, true)} audioMode={audioMode} alertSound={alertSound} onAudioMode={setAudioMode} onAlertSound={setAlertSound} onPreviewAlert={previewAlert} onReset={reset} onEndRound={() => { setTournament(old => old ? { ...old, running: false, endsAt: undefined } : old); setPage('results'); }}/>
}
