import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { RoomPage } from "./RoomPage";

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "user@example.com" } }),
}));

vi.mock("../services/multiplayerService", () => ({
  createAuthedMultiplayerService: () => ({
    loadRoom: vi.fn(async () => null),
    joinRoom: vi.fn(),
    submitMove: vi.fn(),
    subscribeToRoom: vi.fn(() => ({ unsubscribe: vi.fn() })),
  }),
}));

function renderRoomRoute(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/games/:gameId/rooms/:roomId" element={<RoomPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RoomPage", () => {
  it("renders a clear error state for unknown rooms", async () => {
    renderRoomRoute("/games/tic-tac-toe/rooms/missing-room");

    expect(await screen.findByRole("heading", { name: "Raum nicht gefunden" })).toBeInTheDocument();
    expect(screen.getByText("Der Einladungslink ist ungueltig oder der Raum wurde geloescht.")).toBeInTheDocument();
  });
});
