import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabaseClient } from "../lib/supabaseClient";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  canUseLocalAuth: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInLocally: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const localAuthStorageKey = "fallstudie-local-auth";
const canUseLocalAuth = import.meta.env.DEV && !supabaseClient;

function createLocalSession(): Session {
  return {
    access_token: "local-dev-token",
    refresh_token: "local-dev-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: {
      id: "local-user",
      aud: "authenticated",
      role: "authenticated",
      email: "local@example.test",
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  } as Session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!supabaseClient) {
      if (canUseLocalAuth && window.localStorage.getItem(localAuthStorageKey) === "true") {
        setSession(createLocalSession());
      }

      setIsLoading(false);
      return;
    }

    supabaseClient.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        setIsLoading(false);
      }
    });

    const { data } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      canUseLocalAuth,
      async signInWithPassword(email: string, password: string) {
        if (!supabaseClient) {
          throw new Error("Supabase ist lokal nicht konfiguriert.");
        }

        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      },
      signInLocally() {
        if (!canUseLocalAuth) {
          throw new Error("Lokaler Login ist nur im Entwicklungsmodus verfuegbar.");
        }

        window.localStorage.setItem(localAuthStorageKey, "true");
        setSession(createLocalSession());
      },
      async signOut() {
        if (canUseLocalAuth) {
          window.localStorage.removeItem(localAuthStorageKey);
          setSession(null);
        }

        if (supabaseClient) {
          await supabaseClient.auth.signOut();
        }
      },
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth muss innerhalb von AuthProvider verwendet werden.");
  }

  return context;
}
