import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from './config';
import { getUserProfile, initializeUserProfile, UserProfileData } from './userProfile';

interface FirebaseContextType {
  user: User | null;
  profile: UserProfileData | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async (currentUser: User) => {
    try {
      let userProfile = await getUserProfile(currentUser.uid);
      if (!userProfile) {
        userProfile = await initializeUserProfile(
          currentUser.uid,
          currentUser.displayName || 'Survivor',
          currentUser.email || undefined
        );
      }
      setProfile(userProfile);
    } catch (err) {
      console.warn('Could not load user profile from Firestore:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const u = await signInWithGoogle();
      if (u) {
        await loadProfile(u);
      }
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setProfile(null);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn: handleSignIn,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase() {
  return useContext(FirebaseContext);
}
