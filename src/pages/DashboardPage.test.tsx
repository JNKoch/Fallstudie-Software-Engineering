import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("renders game cards from registry metadata", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Digitale Brettspiele" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tic-Tac-Toe" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skip-Bo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "4 Gewinnt" })).toBeInTheDocument();
    expect(screen.getAllByText("2 Spieler")).toHaveLength(2);
    expect(screen.getByText("2-6 Spieler")).toBeInTheDocument();
    expect(screen.getByText("Einfach")).toBeInTheDocument();
    expect(screen.getAllByText("Mittel")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Tic-Tac-Toe öffnen" })).toHaveAttribute(
      "href",
      "/games/tic-tac-toe",
    );
    expect(screen.getByRole("link", { name: "Skip-Bo öffnen" })).toHaveAttribute("href", "/games/skip-bo");
    expect(screen.getByRole("link", { name: "4 Gewinnt öffnen" })).toHaveAttribute(
      "href",
      "/games/connect-four",
    );
    expect(screen.getAllByRole("link", { name: "Online spielen" }).map((link) => link.getAttribute("href"))).toEqual([
      "/games/tic-tac-toe",
      "/games/skip-bo",
      "/games/connect-four",
    ]);
  });
});
