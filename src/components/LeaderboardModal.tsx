import React, { useEffect, useState } from 'react';
import { Trophy, User as UserIcon, LogIn, LogOut, Flame, Skull, Target, Shield, X, RefreshCw } from 'lucide-react';
import { useFirebase } from '../firebase/FirebaseContext';
import { LeaderboardRecord, subscribeToLeaderboard } from '../firebase/leaderboard';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, signIn, signOut, isLoading } = useFirebase();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'profile'>('leaderboard');
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingRecords(true);

    const unsubscribe = subscribeToLeaderboard((data) => {
      setRecords(data);
      setIsLoadingRecords(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div
        id="leaderboard-modal"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider uppercase text-white">Quarantine Records</h2>
              <p className="text-xs text-zinc-400">Global Cloud Leaderboard & Survivor Profile (Firebase)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="close-leaderboard-btn"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Auth Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 bg-zinc-900/40 px-6 py-3 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-950/40'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Global Standings</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase transition-all ${
                activeTab === 'profile'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-950/40'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Survivor Dossier</span>
            </button>
          </div>

          {/* Quick Sign-In / Account status */}
          <div className="flex items-center gap-3 text-xs">
            {isLoading ? (
              <span className="text-zinc-500 text-xs">Connecting...</span>
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Signed in as</span>
                <span className="font-bold text-amber-400">{user.displayName || 'Survivor'}</span>
                <button
                  onClick={() => signOut()}
                  title="Sign out of Firebase"
                  className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-700 hover:text-white"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 font-bold uppercase tracking-wider text-white hover:bg-red-500 active:scale-95 transition-all shadow-md shadow-red-950/50"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In With Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'leaderboard' ? (
            <div>
              {isLoadingRecords ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                  <RefreshCw className="h-8 w-8 animate-spin text-amber-400 mb-3" />
                  <p className="text-sm">Fetching cloud standings from Firestore...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                  <Trophy className="h-12 w-12 stroke-1 text-zinc-600 mb-3" />
                  <p className="text-sm font-semibold text-zinc-300">No records found on the global leaderboard yet.</p>
                  <p className="mt-1 text-xs text-zinc-500">Deploy into the quarantine zone, survive waves, and submit your score!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                        <th className="pb-3 pl-2">Rank</th>
                        <th className="pb-3">Survivor</th>
                        <th className="pb-3 text-right">Score</th>
                        <th className="pb-3 text-center">Wave</th>
                        <th className="pb-3 text-right">Kills</th>
                        <th className="pb-3 text-right">Headshots</th>
                        <th className="pb-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-medium">
                      {records.map((rec, idx) => {
                        const isSelf = user?.uid === rec.userId;
                        return (
                          <tr
                            key={rec.id}
                            className={`transition-colors hover:bg-zinc-900/80 ${
                              isSelf ? 'bg-amber-500/10 font-bold text-amber-300' : 'text-zinc-200'
                            }`}
                          >
                            <td className="py-3 pl-2">
                              {idx === 0 ? (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 font-black text-black">
                                  1
                                </span>
                              ) : idx === 1 ? (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-300 font-black text-black">
                                  2
                                </span>
                              ) : idx === 2 ? (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 font-black text-white">
                                  3
                                </span>
                              ) : (
                                <span className="text-zinc-500 font-mono">#{idx + 1}</span>
                              )}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{rec.displayName}</span>
                                {isSelf && (
                                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                                    YOU
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-amber-400">
                              {rec.score.toLocaleString()}
                            </td>
                            <td className="py-3 text-center font-mono">
                              <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">WAVE {rec.wave}</span>
                            </td>
                            <td className="py-3 text-right font-mono text-red-400">{rec.kills}</td>
                            <td className="py-3 text-right font-mono text-cyan-400">{rec.headshots}</td>
                            <td className="py-3 text-center">
                              {rec.victory ? (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                  <Shield className="h-3 w-3" />
                                  EVACUATED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-red-950/60 border border-red-900/60 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                  <Skull className="h-3 w-3" />
                                  KIA
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Profile Tab */
            <div className="space-y-6">
              {!user ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
                  <UserIcon className="h-12 w-12 text-zinc-500 mb-3" />
                  <h3 className="text-base font-bold text-white">Connect Your Survivor Identity</h3>
                  <p className="mt-1 max-w-md text-xs text-zinc-400">
                    Sign in with Google to synchronize your highest waves, total kills, and score achievements across
                    browsers, and show your callsign on the global leaderboard.
                  </p>
                  <button
                    onClick={() => signIn()}
                    className="mt-5 flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-wider text-white hover:bg-red-500 active:scale-95 transition-all shadow-lg shadow-red-950/60"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In With Google</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Account Header */}
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="h-12 w-12 rounded-xl border border-zinc-700 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 font-black text-lg">
                          {(user.displayName || 'S')[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-base font-bold text-white">{user.displayName}</div>
                        <div className="text-xs text-zinc-400">{user.email}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  {/* Career Stats Grid */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                      Permanent Career Statistics (Firestore Cloud)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase">
                          <Trophy className="h-4 w-4" />
                          <span>High Score</span>
                        </div>
                        <div className="mt-1 font-mono text-2xl font-black text-white">
                          {(profile?.highScore || 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase">
                          <Flame className="h-4 w-4" />
                          <span>Highest Wave</span>
                        </div>
                        <div className="mt-1 font-mono text-2xl font-black text-white">
                          Wave {profile?.highestWave || 1}
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold uppercase">
                          <Skull className="h-4 w-4" />
                          <span>Total Kills</span>
                        </div>
                        <div className="mt-1 font-mono text-2xl font-black text-white">
                          {(profile?.totalKills || 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold uppercase">
                          <Target className="h-4 w-4" />
                          <span>Headshots</span>
                        </div>
                        <div className="mt-1 font-mono text-2xl font-black text-white">
                          {(profile?.totalHeadshots || 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase">
                          <Shield className="h-4 w-4" />
                          <span>Operations</span>
                        </div>
                        <div className="mt-1 font-mono text-2xl font-black text-white">
                          {profile?.totalGamesPlayed || 0} Runs
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold uppercase">
                          <Trophy className="h-4 w-4" />
                          <span>Audio Logs Found</span>
                        </div>
                        <div className="mt-1 font-mono text-2xl font-black text-white">
                          {profile?.unlockedAudioLogsCount || 0} Logs
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
