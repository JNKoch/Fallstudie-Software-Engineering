import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginPage } from "./LoginPage";

const authMock = vi.hoisted(() => ({
  signInLocally: vi.fn(),
  signInWithPassword: vi.fn(),
  canUseLocalAuth: true,
  isSupabaseConfigured: true,
}));

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    signInWithPassword: authMock.signInWithPassword,
    signInLocally: authMock.signInLocally,
    canUseLocalAuth: authMock.canUseLocalAuth,
  }),
}));

vi.mock("../lib/supabaseClient", () => ({
  get isSupabaseConfigured() {
    return authMock.isSupabaseConfigured;
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    authMock.signInLocally.mockReset();
    authMock.signInWithPassword.mockReset();
    authMock.canUseLocalAuth = true;
    authMock.isSupabaseConfigured = true;
  });

  it("submits email and password for demo user login", async () => {
    authMock.signInWithPassword.mockResolvedValue(undefined);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("E-Mail-Adresse"), {
      target: { value: "demo@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Passwort"), {
      target: { value: "demo-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

    expect(authMock.signInWithPassword).toHaveBeenCalledWith(
      "demo@example.test",
      "demo-password",
    );
    await waitFor(() => {
      expect(screen.getByText("Anmeldung erfolgreich.")).toBeInTheDocument();
    });
  });

  it("offers a local test login when Supabase is not configured in development", () => {
    authMock.isSupabaseConfigured = false;

    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: "Lokal testen" }));

    expect(authMock.signInLocally).toHaveBeenCalledOnce();
    expect(screen.getByText("Lokaler Testmodus ohne Supabase.")).toBeInTheDocument();
  });
});
