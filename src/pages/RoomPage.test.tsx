import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { RoomPage } from "./RoomPage";

const loadRoomMock = vi.fn(async () => null);

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "user@example.com" } }),
}));

vi.mock("../services/multiplayerService", () => ({
  createAuthedMultiplayerService: () => ({
    loadRoom: loadRoomMock,
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
  beforeEach(() => {
    loadRoomMock.mockResolvedValue(null);
  });

  it("renders a clear error state for unknown rooms", async () => {
    renderRoomRoute("/games/tic-tac-toe/rooms/missing-room");

    expect(await screen.findByRole("heading", { name: "Raum nicht gefunden" })).toBeInTheDocument();
    expect(screen.getByText("Der Einladungslink ist ungueltig oder der Raum wurde geloescht.")).toBeInTheDocument();
  });

  it("renders the load error when the room cannot be queried", async () => {
    loadRoomMock.mockRejectedValue(new Error("infinite recursion detected in policy for relation room_players"));

    renderRoomRoute("/games/tic-tac-toe/rooms/room-1");

    expect(await screen.findByRole("heading", { name: "Raum konnte nicht geladen werden" })).toBeInTheDocument();
    expect(screen.getByText("infinite recursion detected in policy for relation room_players")).toBeInTheDocument();
  });
});
