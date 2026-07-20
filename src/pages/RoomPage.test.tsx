import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { RoomPage } from "./RoomPage";

const loadRoomMock = vi.fn<() => Promise<unknown | null>>(async () => null);
const restartRoomMock = vi.fn<() => Promise<unknown>>();

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "user@example.com" } }),
}));

vi.mock("../services/multiplayerService", () => ({
  createAuthedMultiplayerService: () => ({
    loadRoom: loadRoomMock,
    joinRoom: vi.fn(),
    restartRoom: restartRoomMock,
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
    restartRoomMock.mockReset();
  });

  it("renders a clear error state for unknown rooms", async () => {
    renderRoomRoute("/games/tic-tac-toe/rooms/missing-room");

    expect(await screen.findByRole("heading", { name: "Raum nicht gefunden" })).toBeInTheDocument();
    expect(screen.getByText("Der Einladungslink ist ungültig oder der Raum wurde gelöscht.")).toBeInTheDocument();
  });

  it("renders the load error when the room cannot be queried", async () => {
    loadRoomMock.mockRejectedValue(new Error("infinite recursion detected in policy for relation room_players"));

    renderRoomRoute("/games/tic-tac-toe/rooms/room-1");

    expect(await screen.findByRole("heading", { name: "Raum konnte nicht geladen werden" })).toBeInTheDocument();
    expect(screen.getByText("infinite recursion detected in policy for relation room_players")).toBeInTheDocument();
  });

  it("lets a room participant restart the game in the same room", async () => {
    const finishedRoom = {
      id: "room-1",
      game_id: "tic-tac-toe",
      status: "finished",
      state: {
        board: ["X", "X", "X", null, "O", null, null, "O", null],
        currentPlayer: "X",
        status: "won",
        winner: "X",
      },
      current_player: null,
      winner: "X",
      room_revision: 7,
      room_players: [
        { user_id: "user-1", symbol: "X", player_order: 1 },
        { user_id: "user-2", symbol: "O", player_order: 2 },
      ],
    };
    const restartedRoom = {
      ...finishedRoom,
      status: "active",
      state: {
        board: Array(9).fill(null),
        currentPlayer: "X",
        status: "playing",
        winner: null,
      },
      current_player: "X",
      winner: null,
      room_revision: 8,
    };
    loadRoomMock.mockResolvedValue(finishedRoom);
    restartRoomMock.mockResolvedValue(restartedRoom);

    renderRoomRoute("/games/tic-tac-toe/rooms/room-1");

    const restartButton = await screen.findByRole("button", { name: "Neue Runde" });
    fireEvent.click(restartButton);

    await waitFor(() => {
      expect(restartRoomMock).toHaveBeenCalledWith(finishedRoom);
    });
    expect(await screen.findByText("X ist am Zug.")).toBeInTheDocument();
  });
});
