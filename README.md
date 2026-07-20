# Fallstudie-Software-Engineering

## Projektüberblick

Dieses Repository enthält eine React-TypeScript-Plattform für digitale Brettspiele. Die Anwendung ist für eine universitäre Software-Engineering-Fallstudie aufgebaut und legt den Schwerpunkt auf modulare Spielmodule, klare Schnittstellen, Online-Spielräume und eine nachvollziehbare Architektur.

Der erste deploybare Online-Schnitt nutzt Supabase Auth mit vorbereiteten Demo-Accounts und Passwort-Login, Einladungslinks für Spielräume, Postgres als dauerhafte Quelle für Raumzustand und Züge sowie Supabase Realtime für Live-Aktualisierungen. Tic-Tac-Toe und 4 Gewinnt können jeweils von zwei Personen an unterschiedlichen Geräten gespielt werden.

## Stack

- React
- TypeScript
- Vite
- React Router
- CSS Modules
- Vitest
- Supabase Auth, Postgres und Realtime
- Vercel als Hosting-Ziel

## Aktueller Funktionsumfang

- Login per Supabase E-Mail und Passwort für vorbereitete Demo-User
- geschützter App-Zugriff für angemeldete Nutzer
- Dashboard mit registrierten Brettspielen
- gemeinsame `BoardGameModule`-Schnittstelle mit optionaler Online-Unterstützung
- Tic-Tac-Toe und 4 Gewinnt als online spielbare Module
- Raum erstellen und Einladungslink unter `/games/:gameId/rooms/:roomId` teilen
- Raumbeitritt für angemeldete Nutzer
- persistenter Raumzustand in Postgres
- Realtime-Subscription auf Raum- und Spieler-Änderungen
- Tests für Tic-Tac-Toe- und 4-Gewinnt-Logik, Raumzustand, Multiplayer-Service und zentrale UI-Zustände

## Architektur

Die Plattform trennt Dashboard, Routing, Auth, Multiplayer-Service und Spielmodule. Das Dashboard liest nur Metadaten aus der Registry. Spielinterne Regeln bleiben im jeweiligen Spielmodul.

```text
src/
  app/
  auth/
  games/
    gameRegistry.ts
    types.ts
    tic-tac-toe/
      logic/
      styles/
      index.tsx
    connect-four/
      logic/
      styles/
      index.tsx
  lib/
  pages/
  services/
  styles/
supabase/
  schema.sql
```

Die zentrale Schnittstelle:

```ts
export interface BoardGameModule {
  id: string;
  title: string;
  description: string;
  playerCount: string;
  difficulty: "easy" | "medium" | "hard";
  shortRules: string;
  Component: React.ComponentType;
  supportsOnlinePlay?: boolean;
  createInitialState?: () => unknown;
}
```

## Setup

Voraussetzungen:

- Node.js
- npm
- Supabase-Projekt

Installation:

```bash
npm install
```

Env-Datei anlegen:

```bash
cp .env.example .env
```

Folgende Werte aus Supabase eintragen:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Supabase-Schema einrichten:

1. Supabase-Projekt öffnen.
2. SQL Editor öffnen.
3. Inhalt von `supabase/schema.sql` ausführen. Bei einem bestehenden Projekt das vollständige Schema erneut ausführen, damit die 4-Gewinnt-Funktionen und erweiterten Spielersymbole angelegt werden.
4. Unter Authentication im Supabase Dashboard Demo-User manuell anlegen.
5. Für jeden Demo-User eine E-Mail-Adresse und ein Passwort setzen.
6. Falls E-Mail-Bestätigung aktiv ist, die Demo-User im Dashboard bestätigen oder die Bestätigung für die Kursdemo deaktivieren.

Der normale Login nutzt `signInWithPassword` und sendet bei der Anmeldung keine E-Mail. Magic Links sind für die Demo nicht der empfohlene Standardpfad.

Entwicklungsserver starten:

```bash
npm run dev
```

Lokaler Test ohne Supabase:

- Wenn keine Supabase-Env-Vars gesetzt sind und der Vite-Dev-Server läuft, zeigt die Login-Seite den Button `Lokal testen`.
- Dieser Modus erstellt nur eine lokale Demo-Session im Browser.
- Dashboard, Navigation und Spielseiten können damit getestet werden.
- Echte Raum-Persistenz, Passwort-Login und Realtime-Multiplayer brauchen weiterhin ein Supabase-Projekt.

Produktionsbuild:

```bash
npm run build
```

Tests:

```bash
npm test
```

Preview:

```bash
npm run preview
```

## Vercel Deployment

Das Projekt ist als Vite-SPA vorbereitet. `vercel.json` leitet Client-Routen auf `index.html` um, damit Einladungslinks wie `/games/connect-four/rooms/:roomId` direkt geöffnet werden können.

In Vercel müssen diese Environment Variables gesetzt werden:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Für den Passwort-Login sind keine Login-Redirects nötig. Falls später wieder E-Mail-basierte Auth-Flows genutzt werden, muss die Vercel-Domain in Supabase als Redirect URL für Auth eingetragen werden.

## Styling-Entscheidung

Die App nutzt CSS Modules. Die visuelle Richtung bleibt Swiss-inspiriert: weiße Flächen, schwarze 1px-Regeln, linksbündige Typografie und der rote Akzent `#E4002B`. Dadurch bleibt das Interface ruhig, gut lesbar und für weitere Spielmodule erweiterbar.

## Bekannte Grenzen

- Lokale Spiele wenden die Regeln clientseitig an. Online-Züge für Tic-Tac-Toe und 4 Gewinnt werden atomar durch spielbezogene Postgres-RPCs validiert.
- Die erste Online-Version ist für kleine Freundesgruppen und die Kursdemo gedacht, nicht für kompetitives oder cheat-sicheres Spiel.
- Raumbeitritt und Symbolvergabe sind bewusst einfach gehalten und können später über RPC atomar gemacht werden.

## Verifikation

Zuletzt verifiziert:

- `npm.cmd test`: 44 Tests erfolgreich
- `npm.cmd run build`: Produktionsbuild erfolgreich
