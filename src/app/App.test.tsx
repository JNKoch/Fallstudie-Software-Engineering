import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

const authState = vi.hoisted(() => ({
  session: null as null | { user: { id: string; email: string } },
  user: null as null | { id: string; email: string },
}));

vi.mock("../auth/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    session: authState.session,
    user: authState.user,
    isLoading: false,
    canUseLocalAuth: false,
    signInWithPassword: vi.fn(),
    signInLocally: vi.fn(),
    signOut: vi.fn(),
  }),
}));

describe("App", () => {
  beforeEach(() => {
    authState.session = { user: { id: "user-1", email: "user@example.com" } };
    authState.user = { id: "user-1", email: "user@example.com" };
  });

  it("renders a login screen for unauthenticated users", () => {
    authState.session = null;
    authState.user = null;

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Anmelden" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-Mail-Adresse")).toBeInTheDocument();
    expect(screen.getByLabelText("Passwort")).toBeInTheDocument();
  });

  it("renders the board game platform dashboard", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Digitale Brettspiele" })).toBeInTheDocument();
    expect(screen.getByText("Dashboard für Online-Brettspiele mit Freunden.")).toBeInTheDocument();
  });
});
