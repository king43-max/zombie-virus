import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './config';

export interface LeaderboardRecord {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  wave: number;
  kills: number;
  headshots: number;
  victory: boolean;
  createdAt?: any;
}

export async function submitLeaderboardScore(run: {
  score: number;
  wave: number;
  kills: number;
  headshots: number;
  victory: boolean;
  displayName?: string;
}): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docPath = `leaderboard/${runId}`;

  const payload = {
    userId: currentUser.uid,
    displayName: (run.displayName || currentUser.displayName || 'Survivor').substring(0, 64),
    score: Math.max(0, Math.round(run.score)),
    wave: Math.max(1, run.wave),
    kills: Math.max(0, run.kills),
    headshots: Math.max(0, run.headshots),
    victory: Boolean(run.victory),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'leaderboard', runId), payload);
    return runId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function fetchTopLeaderboard(topCount = 20): Promise<LeaderboardRecord[]> {
  const collectionPath = 'leaderboard';
  try {
    const q = query(
      collection(db, collectionPath),
      orderBy('score', 'desc'),
      limit(topCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<LeaderboardRecord, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export function subscribeToLeaderboard(
  onUpdate: (records: LeaderboardRecord[]) => void,
  topCount = 20
): () => void {
  const collectionPath = 'leaderboard';
  const q = query(
    collection(db, collectionPath),
    orderBy('score', 'desc'),
    limit(topCount)
  );

  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LeaderboardRecord, 'id'>),
      }));
      onUpdate(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}
