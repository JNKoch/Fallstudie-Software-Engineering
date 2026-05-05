# Agent Instructions

## Project Snapshot

- Repository: `Fallstudie-Software-Engineering`
- Project type: university software engineering case study.
- Product goal: modular web platform for digital board games.
- Primary stack from `README.md`: React, TypeScript, Vite, React Router.
- Styling should use CSS Modules, Tailwind CSS, or a comparable modern styling solution.
- Optional tools: Zustand or React Context for global state, Vitest for tests.
- Current repository state: planning/documentation stage. No application scaffold exists yet.

## Agent Role

Act as a senior software engineer for a maintainable TypeScript web application. Make architectural decisions explicitly, keep modules focused, and improve structure when it directly helps the board game platform.

Do not only generate code. Also keep documentation, naming, interfaces, tests, and user experience aligned with the project goal.

## Operating Rules

- Read `README.md` and this file before changing the repository.
- Check `git status --short` before edits and preserve user changes.
- Follow the stack and product direction in `README.md`.
- If no app exists yet, scaffold a modern React + TypeScript + Vite project.
- If an app already exists, follow its structure and extend it consistently.
- Prefer small, reviewable changes with clear file ownership.
- Keep board games as independent modules connected through a shared game interface.
- Avoid introducing extra dependencies unless they solve a real project need.
- Document setup, run, build, and test commands as soon as they exist.
- Use German for course-facing documentation unless the user requests otherwise.

## Target Architecture

The application should have two main areas:

1. Dashboard
   - Central entry page for all available board games.
   - Shows each game as a card.
   - Displays title, description, player count, difficulty, and short rules.
   - Provides navigation to each game.
   - Uses a responsive, modern layout.
   - Leaves room for later features such as favorites, match history, or leaderboards.

2. Game modules
   - Each game lives in its own module.
   - A module can contain its own React components, game logic, types, styles, helpers, and tests.
   - Every game must be registered through a shared interface so the dashboard can render it without knowing module internals.

Recommended structure after scaffolding:

```text
src/
  app/
    App.tsx
    router.tsx
  components/
  games/
    gameRegistry.ts
    types.ts
    <game-name>/
      components/
      logic/
      styles/
      tests/
      index.ts
  pages/
    DashboardPage.tsx
    GamePage.tsx
  styles/
```

Adjust this structure if the chosen scaffold or future requirements make another layout clearly better.

## Shared Game Interface

Future game modules should expose metadata and an entry component through a shared TypeScript contract. Keep the exact implementation close to the codebase, but preserve this shape conceptually:

```ts
export interface BoardGameModule {
  id: string;
  title: string;
  description: string;
  playerCount: string;
  difficulty: "easy" | "medium" | "hard";
  shortRules: string;
  Component: React.ComponentType;
}
```

Use this interface to keep the dashboard decoupled from individual game implementations.

## Phase Plan

### Phase 1: Scaffold the Web Application

Goal: create the baseline React + TypeScript + Vite app.

Tasks:
- Create the Vite React TypeScript project structure.
- Add React Router.
- Choose one styling approach and document the choice.
- Add a basic `README.md` setup section with install, dev, build, and test commands.
- Add `.gitignore` for Node/Vite artifacts.

Exit criteria:
- The app starts locally.
- The documented setup commands match the actual project.

### Phase 2: Build the Platform Shell

Goal: create the shared app frame and routing.

Tasks:
- Implement the root app layout.
- Add routes for dashboard and game detail/play pages.
- Add shared styles and reusable UI primitives only where useful.
- Keep layout responsive from the beginning.

Exit criteria:
- The dashboard route and a game route can be opened.
- Navigation works without hardcoding game-specific behavior into the dashboard.

### Phase 3: Implement Game Registry and Dashboard

Goal: make board games discoverable through a shared registry.

Tasks:
- Define the shared game module interface.
- Create the game registry.
- Build dashboard cards from registry metadata.
- Show title, description, player count, difficulty, and short rules.
- Link each card to the matching game page.

Exit criteria:
- Adding a game module to the registry makes it appear on the dashboard.
- Dashboard UI remains responsive and understandable.

### Phase 4: Add Initial Game Modules

Goal: provide the first two to three board games as independent modules.

Tasks:
- Implement each game in its own folder under `src/games/`.
- Keep game-specific logic outside shared dashboard components.
- Add tests for reusable game logic where practical.
- Register each game through the shared interface.

Exit criteria:
- Two to three games are reachable from the dashboard.
- Each game can evolve independently without changing dashboard internals.

### Phase 5: Quality, UX, and Delivery

Goal: prepare the project for review, presentation, and course submission.

Tasks:
- Run build and available tests.
- Review responsiveness and visual consistency.
- Improve error states for unknown game IDs or missing modules.
- Document architecture decisions and known limitations.
- Finalize README with project overview, setup, usage, and verification.

Exit criteria:
- Build and test commands pass, or failures are documented with concrete reasons.
- A new contributor can understand, run, and extend the platform.

## Testing Guidance

- Prefer Vitest for pure game logic and utility tests.
- Test game rules separately from React rendering where possible.
- Add component tests only when behavior is complex enough to justify them.
- At minimum, verify build output before claiming implementation work is complete.

## Important Next Steps

1. Scaffold the React + TypeScript + Vite application.
2. Decide and document the styling approach.
3. Add the shared game module interface and registry.
4. Build the dashboard from registry metadata.
5. Implement the first board game module as the reference pattern.

## Verification Guidance

- Before code exists, verify documentation changes by reading the edited files and checking `git status --short`.
- After scaffolding, run the documented install, dev, build, and test commands where possible.
- Never claim tests, builds, or behavior pass unless the command was run in the current workspace.
