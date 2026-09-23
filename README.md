# Poker Tournament App

Eine schlanke, installierbare PWA für private Texas-Hold’em-Turniere. Sie berechnet einen gleichmässigen Startstack aus einem realen Poker-Set, erstellt einen passenden Blind-Plan und stellt eine grosse, handytaugliche Tournament Clock bereit.

## Funktionen

- Chip-Berechnung für den vorhandenen Bestand: 100× 5/25/50/100, 50× 500/1000. Kein Vorschlag überschreitet den Bestand.
- Blind-Struktur passend zu Startstack, Turnierdauer, Leveldauer und optionaler Pause nach 60 Minuten.
- Grossformatige Uhr mit Start, Pause, Weiter, Level vor/zurück und Reset.
- Signalton und Vibration beim automatischen Levelwechsel (falls das Gerät dies unterstützt).
- Persistente Wiederaufnahme: Einstellungen, Struktur, Level, Restzeit und Pausenstatus werden in `localStorage` gespeichert. Die Uhr verwendet einen absoluten Endzeitpunkt, damit ein Reload oder geschlossener Browser korrekt berücksichtigt wird.
- Turnierkasse mit Spielernamen, frei wählbarem Buy-in und automatischer Verteilung des Hauptpots auf Platz 1–3 (50/30/20).
- Optionaler Team-Modus: Es werden 2er-Teams gebildet; bei einer ungeraden Spielerzahl entsteht automatisch genau ein 3er-Team. Der Team-Pot wird pro Spieler erhoben, damit alle exakt gleich viel einzahlen, und vollständig dem Gewinnerteam gutgeschrieben.
- Lokale Saldo-Historie: Einzahlungen und Gewinne werden pro Spielername weitergeführt und bei der nächsten Runde wieder angezeigt.
- Klarer Rundenabschluss: „Runde beenden“ öffnet die Platzierungen und den Teamgewinner. Danach lässt sich direkt die nächste Runde mit neuen Pot-Beträgen starten oder das Turnier mit einem Zahlungsvorschlag abschliessen.
- Offline-PWA mit Service Worker, Web-App-Manifest und eigenem Poker-Icon.

## Lokale Installation

```bash
npm install
npm run dev
```

Für einen Produktionsbuild:

```bash
npm run build
```

Tests ausführen:

```bash
npm test
```

## Als App installieren

Die Seite einmal im Browser öffnen. In Chrome auf Android erscheint üblicherweise **„App installieren“** im Browser-Menü; alternativ den Hinweis auf dem Startbildschirm verwenden. Die App wird im Fullscreen-Modus gestartet. Nach dem ersten Aufruf sind die App-Dateien offline im Cache verfügbar.

## Projektstruktur

- `src/logic/` – Chip-Verteilung, Blind-Plan und Speicherung
- `src/hooks/` – robuste, endzeitpunktbasierte Timer-Logik
- `src/components/` – Setup, Plan und Tournament Clock
- `src/types/` – gemeinsame TypeScript-Typen

## Hinweise zur Turnierlogik

Startstacks sind pro Spieler identisch, enthalten bewusst ausreichend kleine Chips und werden bei höheren Spielerzahlen automatisch kleiner, damit keine Denomination überzogen wird. Die Blind-Struktur beginnt für normale Stacks mit 10/20 und steigert sich im bewährten Turnier-Rhythmus. Eine optionale Pause wird nach vier Blind-Levels eingefügt.
