import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './config';

export interface UserProfileData {
  userId: string;
  displayName: string;
  email?: string;
  highScore: number;
  highestWave: number;
  totalKills: number;
  totalHeadshots: number;
  totalGamesPlayed: number;
  unlockedAudioLogsCount: number;
  createdAt?: any;
  updatedAt?: any;
}

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const docPath = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function initializeUserProfile(
  userId: string,
  displayName: string,
  email?: string
): Promise<UserProfileData> {
  const docPath = `users/${userId}`;
  const initialData = {
    userId,
    displayName: displayName || 'Survivor',
    ...(email ? { email } : {}),
    highScore: 0,
    highestWave: 1,
    totalKills: 0,
    totalHeadshots: 0,
    totalGamesPlayed: 0,
    unlockedAudioLogsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', userId), initialData);
    return {
      userId,
      displayName: displayName || 'Survivor',
      email,
      highScore: 0,
      highestWave: 1,
      totalKills: 0,
      totalHeadshots: 0,
      totalGamesPlayed: 0,
      unlockedAudioLogsCount: 0,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function recordGameStats(stats: {
  score: number;
  wave: number;
  kills: number;
  headshots: number;
  audioLogsCount: number;
}): Promise<UserProfileData | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const docPath = `users/${currentUser.uid}`;
  try {
    const existing = await getUserProfile(currentUser.uid);
    if (!existing) {
      const created = await initializeUserProfile(
        currentUser.uid,
        currentUser.displayName || 'Survivor',
        currentUser.email || undefined
      );
      // update with first game stats
      await updateDoc(doc(db, 'users', currentUser.uid), {
        highScore: stats.score,
        highestWave: stats.wave,
        totalKills: stats.kills,
        totalHeadshots: stats.headshots,
        totalGamesPlayed: 1,
        unlockedAudioLogsCount: stats.audioLogsCount,
        updatedAt: serverTimestamp(),
      });
      return {
        ...created,
        highScore: stats.score,
        highestWave: stats.wave,
        totalKills: stats.kills,
        totalHeadshots: stats.headshots,
        totalGamesPlayed: 1,
        unlockedAudioLogsCount: stats.audioLogsCount,
      };
    }

    const updatedStats = {
      highScore: Math.max(existing.highScore, stats.score),
      highestWave: Math.max(existing.highestWave, stats.wave),
      totalKills: existing.totalKills + stats.kills,
      totalHeadshots: existing.totalHeadshots + stats.headshots,
      totalGamesPlayed: existing.totalGamesPlayed + 1,
      unlockedAudioLogsCount: Math.max(existing.unlockedAudioLogsCount, stats.audioLogsCount),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, 'users', currentUser.uid), updatedStats);

    return {
      ...existing,
      ...updatedStats,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}
