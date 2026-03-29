"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/firebase";
import { signInAnonymously } from "firebase/auth";

/**
 * Hook to manage an anonymous session for analytics purposes.
 * Ensures the user is signed in (at least anonymously) and provides a stable session ID.
 */
export function useSessionAnalytics() {
  const auth = useAuth();
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Generate or retrieve a persistent session ID for this user (anonymized)
    let storedSessionId = localStorage.getItem("nutrisaathi_anon_session");
    if (!storedSessionId) {
      storedSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("nutrisaathi_anon_session", storedSessionId);
    }
    setSessionId(storedSessionId);

    // Ensure we have an active session for Firestore writes
    if (auth && !auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.error("Anonymous sign-in failed for analytics", err);
      });
    }
  }, [auth]);

  return { sessionId };
}