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
    expect(screen.getByRole("heading", { name: "4 Gewinnt" })).toBeInTheDocument();
    expect(screen.getAllByText("2 Spieler")).toHaveLength(2);
    expect(screen.getByText("Einfach")).toBeInTheDocument();
    expect(screen.getByText("Mittel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tic-Tac-Toe oeffnen" })).toHaveAttribute(
      "href",
      "/games/tic-tac-toe",
    );
    expect(screen.getByRole("link", { name: "4 Gewinnt oeffnen" })).toHaveAttribute(
      "href",
      "/games/connect-four",
    );
    expect(screen.getByRole("link", { name: "Online spielen" })).toHaveAttribute(
      "href",
      "/games/tic-tac-toe",
    );
  });
});
