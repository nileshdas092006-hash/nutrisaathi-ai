
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";

export interface UserProfile {
  id?: string;
  age: number;
  weight: number;
  healthConditions: string[];
  dietType: string;
  region: string;
  dietGoals: string[];
  email?: string;
}

const DEFAULT_PROFILE: UserProfile = {
  age: 25,
  weight: 65,
  healthConditions: [],
  dietType: "Omnivore",
  region: "General India",
  dietGoals: ["Healthier Eating"],
};

/**
 * Hook to manage user profile. 
 * Syncs with Firestore if the user is authenticated (and not anonymous), 
 * otherwise falls back to localStorage for guest users.
 */
export function useProfile() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { firestore } = useFirestore();
  
  // Local state for immediate UI feedback and guest users
  const [localProfile, setLocalProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLocalLoaded, setIsLocalLoaded] = useState(false);

  // Firestore profile subscription for authenticated users (not anonymous)
  const profileDocRef = user && !user.isAnonymous && firestore ? doc(firestore, "users", user.uid, "profile") : null;
  const { data: dbProfile, isLoading: isDbLoading } = useDoc<UserProfile>(profileDocRef);

  // Load guest profile from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("nutrisaathi_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // MERGE with DEFAULT_PROFILE to ensure all required fields (like region) exist
        setLocalProfile({ ...DEFAULT_PROFILE, ...parsed });
      } catch (e) {
        console.error("Failed to parse guest profile", e);
      }
    }
    setIsLocalLoaded(true);
  }, []);

  // Compute the active profile: DB if logged in, otherwise local
  const profile = (user && !user.isAnonymous && dbProfile) ? dbProfile : localProfile;
  const isLoaded = isLocalLoaded && !isAuthLoading && (!user || user.isAnonymous || !isDbLoading);

  const updateProfile = (newProfile: UserProfile) => {
    if (user && !user.isAnonymous && firestore) {
      // Authenticated update
      const docRef = doc(firestore, "users", user.uid, "profile");
      setDocumentNonBlocking(docRef, {
        ...newProfile,
        id: user.uid,
        email: user.email || "",
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } else {
      // Guest update
      setLocalProfile(newProfile);
      localStorage.setItem("nutrisaathi_profile", JSON.stringify(newProfile));
    }
  };

  return { 
    profile, 
    updateProfile, 
    isLoaded, 
    user: user && !user.isAnonymous ? user : null,
    isGuest: !user || user.isAnonymous
  };
}
