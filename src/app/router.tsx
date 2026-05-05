import { Route, Routes } from "react-router-dom";

import { DashboardPage } from "../pages/DashboardPage";
import { GamePage } from "../pages/GamePage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RoomPage } from "../pages/RoomPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<DashboardPage />} />
      <Route path="/games/:gameId" element={<GamePage />} />
      <Route path="/games/:gameId/rooms/:roomId" element={<RoomPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
