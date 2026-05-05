# Agent Instructions

## Project Snapshot

- Repository: `Fallstudie-Software-Engineering`
- Project type: university software engineering case study.
- Product goal: hosted modular web platform for digital board games with online play between friends.
- Primary stack: React, TypeScript, Vite, React Router, CSS Modules, Vitest.
- Backend direction: Supabase Auth, Postgres, Row Level Security, Realtime.
- Hosting direction: Vercel.

## Agent Role

Act as a senior software engineer for a maintainable TypeScript web application. Make architectural decisions explicitly, keep modules focused, and keep documentation, naming, interfaces, tests, and user experience aligned with the board game platform.

Use German for course-facing documentation unless the user requests otherwise.

## Operating Rules

- Read `README.md` and this file before changing the repository.
- Check `git status --short` before edits and preserve user changes.
- Follow the existing React/Vite structure instead of replacing it.
- Prefer small, reviewable changes with clear file ownership.
- Keep board games as independent modules connected through the shared game interface.
- Avoid dependencies unless they solve a real project need.
- Keep Supabase credentials in environment variables only.
- Document setup, run, build, test, Supabase, and deployment commands when they change.
- At minimum, run tests and build before claiming implementation work is complete.

## Product Direction

The app should be deployable on Vercel and support online play with friends through invite links. The first production slice uses:

- Email/password login through Supabase Auth for pre-created demo users.
- Invite-link rooms under `/games/:gameId/rooms/:roomId`.
- Postgres tables as the source of truth for rooms, players, and moves.
- Supabase Realtime subscriptions for live room updates.
- Client-side game-rule validation for the course demo, with a future path to server-side validation.

## Target Architecture

```text
src/
  app/
    App.tsx
    router.tsx
  auth/
  games/
    gameRegistry.ts
    types.ts
    <game-name>/
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

## Shared Game Interface

Game modules expose metadata and an entry component through the shared contract. Online games may also expose multiplayer metadata and initial state creation.

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

## Multiplayer Architecture Rules

- `game_rooms` stores room metadata and durable game state JSON.
- `room_players` stores authenticated room membership and player symbols/order.
- `game_moves` stores append-only move payloads.
- Dashboard and generic pages must not know game internals.
- Game-specific rule logic belongs in `src/games/<game-name>/logic/`.
- Shared room services may dispatch to game-specific reducers through `gameId`, but should stay thin.
- RLS should allow authenticated users to create rooms, join waiting rooms through invite links, and read/update only rooms they participate in.
- Do not hardcode Supabase secrets or Vercel URLs.

## Testing Guidance

- Prefer Vitest for pure game logic and utility tests.
- Test game rules separately from React rendering where practical.
- Mock Supabase at the service boundary for unit tests.
- Add component tests for auth gating, dashboard online actions, and error states.
- Run `npm.cmd test` and `npm.cmd run build` before final completion claims.
