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
    expect(screen.getByText("2 Spieler")).toBeInTheDocument();
    expect(screen.getByText("Einfach")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tic-Tac-Toe oeffnen" })).toHaveAttribute(
      "href",
      "/games/tic-tac-toe",
    );
    expect(screen.getByRole("link", { name: "Online spielen" })).toHaveAttribute(
      "href",
      "/games/tic-tac-toe",
    );
  });
});
