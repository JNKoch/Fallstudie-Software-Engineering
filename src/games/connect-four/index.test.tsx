import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { connectFourModule } from "./index";

describe("ConnectFour offline module", () => {
  it("shows the initial local turn status", () => {
    const Component = connectFourModule.Component;

    render(<Component />);

    expect(screen.getByText("Rot ist am Zug.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Neues Spiel" })).toBeInTheDocument();
  });

  it("renders column selectors below the board in column order", () => {
    const Component = connectFourModule.Component;

    render(<Component />);

    const board = screen.getByRole("grid", { name: "4 Gewinnt Spielfeld" });
    const selectors = screen.getByLabelText("Spaltenauswahl");
    const selectorButtons = screen.getAllByRole("button", { name: /Stein in Spalte \d werfen/ });

    expect(board.compareDocumentPosition(selectors) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(selectorButtons.map((button) => button.textContent)).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  });

  it("applies local moves and switches turns", () => {
    const Component = connectFourModule.Component;

    render(<Component />);
    fireEvent.click(screen.getByRole("button", { name: "Stein in Spalte 1 werfen" }));

    expect(screen.getByLabelText("Reihe 6, Spalte 1: Rot")).toBeInTheDocument();
    expect(screen.getByText("Gelb ist am Zug.")).toBeInTheDocument();
  });

  it("shows a winner and resets the local board", () => {
    const Component = connectFourModule.Component;

    render(<Component />);

    fireEvent.click(screen.getByRole("button", { name: "Stein in Spalte 1 werfen" }));
    fireEvent.click(screen.getByRole("button", { name: "Stein in Spalte 2 werfen" }));
    fireEvent.click(screen.getByRole("button", { name: "Stein in Spalte 1 werfen" }));
    fireEvent.click(screen.getByRole("button", { name: "Stein in Spalte 2 werfen" }));
    fireEvent.click(screen.getByRole("button", { name: "Stein in Spalte 1 werfen" }));
    fireEvent.click(screen.getByRole("button", { name: "Stein in Spalte 2 werfen" }));
    fireEvent.click(screen.getByRole("button", { name: "Stein in Spalte 1 werfen" }));

    expect(screen.getByText("Rot hat gewonnen.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stein in Spalte 3 werfen" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Neues Spiel" }));

    expect(screen.getByText("Rot ist am Zug.")).toBeInTheDocument();
    expect(screen.getByLabelText("Reihe 6, Spalte 1: leer")).toBeInTheDocument();
  });
});
