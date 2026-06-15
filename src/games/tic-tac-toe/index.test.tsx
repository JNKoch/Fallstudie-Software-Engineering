import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ticTacToeModule } from "./index";

describe("TicTacToe offline module", () => {
  it("shows the initial local turn status", () => {
    const Component = ticTacToeModule.Component;

    render(<Component />);

    expect(screen.getByText("X ist am Zug.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Neues Spiel" })).toBeInTheDocument();
  });

  it("applies local moves and switches turns", () => {
    const Component = ticTacToeModule.Component;

    render(<Component />);
    fireEvent.click(screen.getByRole("button", { name: "Feld 1" }));

    expect(screen.getByRole("button", { name: "Feld 1" })).toHaveTextContent("X");
    expect(screen.getByText("O ist am Zug.")).toBeInTheDocument();
  });

  it("shows a winner and resets the local board", () => {
    const Component = ticTacToeModule.Component;

    render(<Component />);

    fireEvent.click(screen.getByRole("button", { name: "Feld 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Feld 4" }));
    fireEvent.click(screen.getByRole("button", { name: "Feld 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Feld 5" }));
    fireEvent.click(screen.getByRole("button", { name: "Feld 3" }));

    expect(screen.getByText("X hat gewonnen.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Feld 6" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Neues Spiel" }));

    expect(screen.getByText("X ist am Zug.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Feld 1" })).toHaveTextContent("");
  });
});
