import { useEffect, useRef } from 'react';
import type { Tournament } from '../types/tournament';

export function useTournamentTimer(tournament: Tournament | null, onTick: (seconds: number) => void, onEnd: () => void) {
  const endRef = useRef(onEnd); endRef.current = onEnd;
  useEffect(() => {
    if (!tournament?.running || !tournament.endsAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((tournament.endsAt! - Date.now()) / 1000));
      onTick(remaining); if (remaining === 0) endRef.current();
    };
    tick(); const id = window.setInterval(tick, 250); return () => clearInterval(id);
  }, [tournament?.running, tournament?.endsAt, onTick]);
}
