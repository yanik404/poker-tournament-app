import type { Tournament } from '../types/tournament';

const time = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

const SpeakerIcon = ({ muted }: { muted: boolean }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M4 9v6h4l5 4V5L8 9H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
  {muted ? <>
    <path d="m17 9 4 4M21 9l-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </> : <>
    <path d="M16 9.5a4 4 0 0 1 0 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M18.5 7a7.2 7.2 0 0 1 0 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </>}
</svg>;

export function TournamentClock({ tournament, onToggle, onNext, onPrevious, soundEnabled, onSoundToggle, onReset, onEndRound }: { tournament: Tournament; onToggle: () => void; onNext: () => void; onPrevious: () => void; soundEnabled: boolean; onSoundToggle: () => void; onReset: () => void; onEndRound: () => void }) {
  const level = tournament.levels[tournament.currentLevel];
  const next = tournament.levels[tournament.currentLevel + 1];
  const isBreak = level.isBreak;

  return <main className="clock">
    <header>
      <div className="clock-head-left">
        <button className={`audio-icon ${soundEnabled ? 'sound-on' : 'sound-off'}`} aria-label={soundEnabled ? 'Sound ausschalten' : 'Sound einschalten'} title={soundEnabled ? 'Sound an' : 'Nur Vibration'} onClick={onSoundToggle}>
          <SpeakerIcon muted={!soundEnabled}/>
        </button>
        <span>♠ POKER TOURNAMENT</span>
      </div>
      <button onClick={onReset}>Zurücksetzen</button>
    </header>

    <section className="clock-main"><p className="eyebrow">{isBreak ? 'PAUSE' : `LEVEL ${tournament.currentLevel + 1}`}</p><div className={isBreak ? 'blind break-blind' : 'blind'}>{isBreak ? 'BREAK' : <>{level.smallBlind} <i>/</i> {level.bigBlind}</>}</div><div className="countdown">{time(tournament.remainingSeconds)}</div><p className="elapsed">Vergangen · {time(tournament.elapsedSeconds)}</p><div className="next">NÄCHSTES {next ? <b>{next.isBreak ? 'BREAK' : `${next.smallBlind} / ${next.bigBlind}`}</b> : <b>TURNIER ENDE</b>}</div></section>
    <button className="settle-button" onClick={onEndRound}>Runde beenden & Auszahlung</button>
    <footer><button onClick={onPrevious} disabled={tournament.currentLevel === 0}>‹ Vorheriges</button><button className="primary pause" onClick={onToggle}>{tournament.running ? 'Pause' : 'Weiter'}</button><button onClick={onNext} disabled={!next}>Nächstes ›</button></footer>
  </main>;
}
