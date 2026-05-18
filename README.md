# Fallstudie-Software-Engineering

## Projektueberblick

Dieses Repository enthaelt eine React-TypeScript-Plattform fuer digitale Brettspiele. Die Anwendung ist fuer eine universitaere Software-Engineering-Fallstudie aufgebaut und legt den Schwerpunkt auf modulare Spielmodule, klare Schnittstellen, Online-Spielraeume und eine nachvollziehbare Architektur.

Der erste deploybare Online-Schnitt nutzt Supabase Auth mit vorbereiteten Demo-Accounts und Passwort-Login, Einladungslinks fuer Spielraeume, Postgres als dauerhafte Quelle fuer Raumzustand und Zuege sowie Supabase Realtime fuer Live-Aktualisierungen.

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

- Login per Supabase E-Mail und Passwort fuer vorbereitete Demo-User
- geschuetzter App-Zugriff fuer angemeldete Nutzer
- Dashboard mit registrierten Brettspielen
- gemeinsame `BoardGameModule`-Schnittstelle mit optionaler Online-Unterstuetzung
- Tic-Tac-Toe als erstes online spielbares Modul
- Raum erstellen und Einladungslink unter `/games/tic-tac-toe/rooms/:roomId` teilen
- Raumbeitritt fuer angemeldete Nutzer
- persistenter Raumzustand in Postgres
- Realtime-Subscription auf Raum- und Spieler-Aenderungen
- Tests fuer Tic-Tac-Toe-Logik, Raumzustand, Multiplayer-Service und zentrale UI-Zustaende

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

1. Supabase-Projekt oeffnen.
2. SQL Editor oeffnen.
3. Inhalt von `supabase/schema.sql` ausfuehren.
4. Unter Authentication im Supabase Dashboard Demo-User manuell anlegen.
5. Fuer jeden Demo-User eine E-Mail-Adresse und ein Passwort setzen.
6. Falls E-Mail-Bestaetigung aktiv ist, die Demo-User im Dashboard bestaetigen oder die Bestaetigung fuer die Kursdemo deaktivieren.

Der normale Login nutzt `signInWithPassword` und sendet bei der Anmeldung keine E-Mail. Magic Links sind fuer die Demo nicht der empfohlene Standardpfad.

Entwicklungsserver starten:

```bash
npm run dev
```

Lokaler Test ohne Supabase:

- Wenn keine Supabase-Env-Vars gesetzt sind und der Vite-Dev-Server laeuft, zeigt die Login-Seite den Button `Lokal testen`.
- Dieser Modus erstellt nur eine lokale Demo-Session im Browser.
- Dashboard, Navigation und Spielseiten koennen damit getestet werden.
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

Das Projekt ist als Vite-SPA vorbereitet. `vercel.json` leitet Client-Routen auf `index.html` um, damit Einladungslinks wie `/games/tic-tac-toe/rooms/:roomId` direkt geoeffnet werden koennen.

In Vercel muessen diese Environment Variables gesetzt werden:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Fuer den Passwort-Login sind keine Login-Redirects noetig. Falls spaeter wieder E-Mail-basierte Auth-Flows genutzt werden, muss die Vercel-Domain in Supabase als Redirect URL fuer Auth eingetragen werden.

## Styling-Entscheidung

Die App nutzt CSS Modules. Die visuelle Richtung bleibt Swiss-inspiriert: weisse Flaechen, schwarze 1px-Regeln, linksbuendige Typografie und der rote Akzent `#E4002B`. Dadurch bleibt das Interface ruhig, gut lesbar und fuer weitere Spielmodule erweiterbar.

## Bekannte Grenzen

- Die Spielregeln werden aktuell clientseitig angewendet. Fuer eine robuste produktive Version sollten Zuege serverseitig per Postgres RPC oder Edge Function validiert werden.
- Die erste Online-Version ist fuer kleine Freundesgruppen und die Kursdemo gedacht, nicht fuer kompetitives oder cheat-sicheres Spiel.
- Raumbeitritt und Symbolvergabe sind bewusst einfach gehalten und koennen spaeter ueber RPC atomar gemacht werden.

## Verifikation

Zuletzt verifiziert:

- `npm.cmd test`: 20 Tests erfolgreich
- `npm.cmd run build`: Produktionsbuild erfolgreich
