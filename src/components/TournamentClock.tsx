import { useState } from 'react';
import type { Tournament } from '../types/tournament';
import type { AlertSound, AudioMode } from '../App';

const time = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function TournamentClock({ tournament, onToggle, onNext, onPrevious, audioMode, alertSound, onAudioMode, onAlertSound, onPreviewAlert, onReset, onEndRound }: { tournament: Tournament; onToggle: () => void; onNext: () => void; onPrevious: () => void; audioMode: AudioMode; alertSound: AlertSound; onAudioMode: (mode: AudioMode) => void; onAlertSound: (sound: AlertSound) => void; onPreviewAlert: () => void; onReset: () => void; onEndRound: () => void }) {
  const [audioOpen, setAudioOpen] = useState(false);
  const level = tournament.levels[tournament.currentLevel];
  const next = tournament.levels[tournament.currentLevel + 1];
  const isBreak = level.isBreak;
  const icon = audioMode === 'mute' ? '🔇' : audioMode === 'vibrate' ? '📳' : '🔊';

  return <main className="clock">
    <header>
      <div className="clock-head-left">
        <button className="audio-icon" aria-label="Sound settings" title="Sound settings" onClick={() => setAudioOpen(open => !open)}>{icon}</button>
        <span>♠ POKER TOURNAMENT</span>
      </div>
      <button onClick={onReset}>Zurücksetzen</button>
    </header>

    {audioOpen && <div className="audio-popover">
      <div className="audio-popover-head"><b>Audio</b><button aria-label="Close audio settings" onClick={() => setAudioOpen(false)}>×</button></div>
      <div className="audio-modes">
        <button className={audioMode === 'sound' ? 'active' : ''} onClick={() => onAudioMode('sound')}>🔊 Sound + voice</button>
        <button className={audioMode === 'vibrate' ? 'active' : ''} onClick={() => onAudioMode('vibrate')}>📳 Vibrate only</button>
        <button className={audioMode === 'mute' ? 'active' : ''} onClick={() => onAudioMode('mute')}>🔇 Mute</button>
      </div>
      <label className="audio-select">Alert sound
        <select value={alertSound} disabled={audioMode !== 'sound'} onChange={event => onAlertSound(event.target.value as AlertSound)}>
          <option value="casino">Casino chime</option>
          <option value="classic">Classic</option>
          <option value="bell">Bell</option>
          <option value="soft">Soft</option>
        </select>
      </label>
      <p>Voice: natural English female voice when available on this device.</p>
      <button className="audio-preview" disabled={audioMode === 'mute'} onClick={onPreviewAlert}>Preview</button>
    </div>}

    <section className="clock-main"><p className="eyebrow">{isBreak ? 'PAUSE' : `LEVEL ${tournament.currentLevel + 1}`}</p><div className={isBreak ? 'blind break-blind' : 'blind'}>{isBreak ? 'BREAK' : <>{level.smallBlind} <i>/</i> {level.bigBlind}</>}</div><div className="countdown">{time(tournament.remainingSeconds)}</div><p className="elapsed">Vergangen · {time(tournament.elapsedSeconds)}</p><div className="next">NÄCHSTES {next ? <b>{next.isBreak ? 'BREAK' : `${next.smallBlind} / ${next.bigBlind}`}</b> : <b>TURNIER ENDE</b>}</div></section>
    <button className="settle-button" onClick={onEndRound}>Runde beenden & Auszahlung</button>
    <footer><button onClick={onPrevious} disabled={tournament.currentLevel === 0}>‹ Vorheriges</button><button className="primary pause" onClick={onToggle}>{tournament.running ? 'Pause' : 'Weiter'}</button><button onClick={onNext} disabled={!next}>Nächstes ›</button></footer>
  </main>;
}
