import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { GamePage } from "./GamePage";

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "user@example.com" } }),
}));

vi.mock("../services/multiplayerService", () => ({
  createAuthedMultiplayerService: () => ({
    createRoom: vi.fn(async () => ({ id: "room-1" })),
  }),
}));

function renderGameRoute(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/games/:gameId" element={<GamePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GamePage", () => {
  it("renders the selected game module", () => {
    renderGameRoute("/games/tic-tac-toe");

    expect(screen.getByRole("heading", { level: 1, name: "Tic-Tac-Toe" })).toBeInTheDocument();
    expect(screen.getByText("Online spielbares Referenzmodul für die Plattformstruktur.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Raum erstellen" })).toBeInTheDocument();
  });

  it("renders an unknown game state for missing ids", () => {
    renderGameRoute("/games/unknown");

    expect(screen.getByRole("heading", { name: "Spiel nicht gefunden" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zurück zum Dashboard" })).toHaveAttribute("href", "/");
  });
});
