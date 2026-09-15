import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, Flame, Hammer, LogIn, LogOut, Play, ShieldAlert, Sparkles, Trophy, User, Volume2, Wrench } from 'lucide-react';
import { soundManager } from './audio/SoundManager';
import { GameOverModal } from './components/GameOverModal';
import { HUD } from './components/HUD';
import { PauseMenu } from './components/PauseMenu';
import { SkillTreeModal } from './components/SkillTreeModal';
import { UpgradeStationModal } from './components/UpgradeStationModal';
import { VictoryModal } from './components/VictoryModal';
import { AudioLogArchiveModal } from './components/AudioLogArchiveModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MobileControls } from './components/MobileControls';
import { useFirebase } from './firebase/FirebaseContext';
import { GameEngine } from './game/GameEngine';
import { INITIAL_SKILL_TREE_STATE } from './game/SkillTree';
import { INITIAL_AUDIO_LOGS } from './game/AudioLogs';
import {
  AudioLog,
  AudioLogPlaybackState,
  CraftingMaterials,
  GameSettings,
  ObjectiveState,
  PlayerStats,
  SkillId,
  SkillTreeState,
  TrapType,
  WeaponConfig,
  WeaponId,
  WeaponModState,
  WeaponState,
} from './types/game';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI State
  const [hasStarted, setHasStarted] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [stats, setStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 100,
    stamina: 100,
    maxStamina: 100,
    isSprinting: false,
    isCrouching: false,
    score: 0,
    cash: 300,
    kills: 0,
    headshots: 0,
  });

  const [activeWeapon, setActiveWeapon] = useState<WeaponConfig | null>(null);
  const [weaponState, setWeaponState] = useState<WeaponState | null>(null);
  const [inventory, setInventory] = useState<WeaponId[]>(['pistol']);

  const [wave, setWave] = useState(1);
  const [remainingZombies, setRemainingZombies] = useState(6);
  const [isIntermission, setIsIntermission] = useState(false);
  const [intermissionTimer, setIntermissionTimer] = useState(0);

  // Crafting & Traps State
  const [materials, setMaterials] = useState<CraftingMaterials>({
    scrapMetal: 12,
    electronics: 6,
    chemicals: 4,
    weaponParts: 2,
  });
  const [trapInventory, setTrapInventory] = useState<Record<TrapType, number>>({
    bear_trap: 2,
    spike_strip: 2,
    pipe_bomb: 1,
  });
  const [isPlacingTrap, setIsPlacingTrap] = useState(false);
  const [placingTrapType, setPlacingTrapType] = useState<TrapType | null>(null);
  const [blueprints, setBlueprints] = useState<string[]>([
    'blueprint_bear_trap',
    'blueprint_flamethrower',
  ]);
  const [weaponMods, setWeaponMods] = useState<WeaponModState>({
    hasDrumMag: false,
    hasCompensator: false,
    hasIncendiary: false,
    hasShockCoil: false,
  });

  const [objective, setObjective] = useState<ObjectiveState>({
    type: 'survive',
    description: 'Survive the undead onslaught. Scavenge materials, craft traps, and trigger environmental hazards.',
    currentProgress: 1,
    targetProgress: 5,
    extractionReady: false,
    extractionCountdown: 60,
    extractionX: 0,
    extractionZ: -56,
  });

  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [hitMarker, setHitMarker] = useState<'body' | 'head' | null>(null);
  const [isDamaged, setIsDamaged] = useState(false);

  // Firebase & Modals
  const { user, profile, signIn, signOut, isLoading: isFirebaseLoading } = useFirebase();
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);
  const [isAudioLogArchiveOpen, setIsAudioLogArchiveOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalStats, setFinalStats] = useState({ score: 0, kills: 0, headshots: 0, wave: 1 });

  // Passive Skill Tree State
  const [skillTreeState, setSkillTreeState] = useState<SkillTreeState>(INITIAL_SKILL_TREE_STATE);

  // Collectible Audio Logs State
  const [audioLogPlayback, setAudioLogPlayback] = useState<AudioLogPlaybackState | null>(null);
  const [audioLogs, setAudioLogs] = useState<AudioLog[]>(INITIAL_AUDIO_LOGS);

  // Mobile Controls Active States
  const [isADS, setIsADS] = useState(false);
  const [isMobileSprint, setIsMobileSprint] = useState(false);
  const [isMobileCrouch, setIsMobileCrouch] = useState(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 0.0022,
    touchSensitivity: 0.0035,
    touchControls: typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    volume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.5,
    viewMode: 'first',
    flashlightOn: true,
    bloodParticles: true,
  });

  // Initialize Game Engine when started
  useEffect(() => {
    if (!hasStarted || !containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onStatsUpdate: (s) => setStats({ ...s }),
      onWeaponsUpdate: (w, st, inv) => {
        setActiveWeapon({ ...w });
        setWeaponState({ ...st });
        setInventory([...inv]);
      },
      onWaveUpdate: (w, r, inter, t) => {
        setWave(w);
        setRemainingZombies(r);
        setIsIntermission(inter);
        setIntermissionTimer(t);
      },
      onObjectiveUpdate: (obj) => setObjective({ ...obj }),
      onInteractPrompt: (prompt) => setInteractPrompt(prompt),
      onOpenUpgradeStation: () => {
        setIsUpgradeOpen(true);
      },
      onHitMarker: (isHead) => {
        setHitMarker(isHead ? 'head' : 'body');
        setTimeout(() => setHitMarker(null), 160);
      },
      onDamageTaken: () => {
        setIsDamaged(true);
        setTimeout(() => setIsDamaged(false), 260);
      },
      onGameOver: (fStats) => {
        setFinalStats(fStats);
        setIsGameOver(true);
      },
      onVictory: (fStats) => {
        setFinalStats(fStats);
        setIsVictory(true);
      },
      onMaterialsUpdate: (m) => setMaterials({ ...m }),
      onTrapInventoryUpdate: (tInv, placing, pType) => {
        setTrapInventory({ ...tInv });
        setIsPlacingTrap(placing);
        setPlacingTrapType(pType);
      },
      onBlueprintsUpdate: (b) => setBlueprints([...b]),
      onModsUpdate: (m) => setWeaponMods({ ...m }),
      onSkillTreeUpdate: (tree) => setSkillTreeState({ ...tree }),
      onOpenSkillTree: () => {
        setIsUpgradeOpen(false);
        setIsAudioLogArchiveOpen(false);
        setIsSkillTreeOpen(true);
      },
      onAudioLogPlaybackUpdate: (pb) => setAudioLogPlayback(pb ? { ...pb } : null),
      onAudioLogsUpdate: (logs) => setAudioLogs([...logs]),
      onOpenAudioLogArchive: () => {
        setIsUpgradeOpen(false);
        setIsSkillTreeOpen(false);
        setIsAudioLogArchiveOpen(true);
      },
    });

    engineRef.current = engine;

    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === containerRef.current);
    };
    const handlePointerLockError = () => {
      // Gracefully handle pointer lock rejection by browser security policies
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyK') {
        if (!isGameOver && !isVictory && !isUpgradeOpen) {
          setIsSkillTreeOpen((prev) => {
            if (!prev && engineRef.current) {
              engineRef.current.exitPointerLock();
            } else if (prev && engineRef.current) {
              engineRef.current.requestPointerLock();
            }
            return !prev;
          });
        }
        return;
      }

      if (e.code === 'KeyL') {
        if (!isGameOver && !isVictory && !isUpgradeOpen && !isSkillTreeOpen) {
          setIsAudioLogArchiveOpen((prev) => {
            if (!prev && engineRef.current) {
              engineRef.current.exitPointerLock();
            } else if (prev && engineRef.current) {
              engineRef.current.requestPointerLock();
            }
            return !prev;
          });
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (isAudioLogArchiveOpen) {
          setIsAudioLogArchiveOpen(false);
          if (engineRef.current) engineRef.current.requestPointerLock();
          return;
        }

        if (isSkillTreeOpen) {
          setIsSkillTreeOpen(false);
          if (engineRef.current) engineRef.current.requestPointerLock();
          return;
        }

        if (!isGameOver && !isVictory && !isUpgradeOpen) {
          setIsPaused((prev) => {
            if (!prev && engineRef.current) {
              engineRef.current.exitPointerLock();
            }
            return !prev;
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
      window.removeEventListener('keydown', handleKeyDown);
      engine.dispose();
      engineRef.current = null;
    };
  }, [hasStarted]);

  // Handle pointer lock resume
  const handleLockClick = () => {
    if (engineRef.current && !isUpgradeOpen && !isPaused && !isGameOver && !isVictory) {
      engineRef.current.requestPointerLock();
    }
  };

  // Weapon switch from HUD
  const handleSelectWeapon = (weaponId: WeaponId) => {
    if (engineRef.current) {
      engineRef.current.switchWeapon(weaponId);
    }
  };

  // Traps
  const handleStartPlacingTrap = (type: TrapType) => {
    if (engineRef.current) {
      engineRef.current.startPlacingTrap(type);
    }
  };

  // Crafting
  const handleCraftRecipe = (recipeId: string) => {
    if (engineRef.current) {
      engineRef.current.craftRecipe(recipeId);
    }
  };

  // Upgrades
  const handleUpgradeWeapon = (weaponId: WeaponId) => {
    if (engineRef.current) {
      engineRef.current.upgradeWeapon(weaponId);
    }
  };

  const handleBuyWeapon = (weaponId: WeaponId) => {
    if (engineRef.current) {
      engineRef.current.buyWeapon(weaponId);
    }
  };

  const handleBuyAmmo = (weaponId: WeaponId) => {
    if (engineRef.current) {
      engineRef.current.buyAmmo(weaponId);
    }
  };

  const handleBuyArmor = () => {
    if (engineRef.current) {
      engineRef.current.buyArmor();
    }
  };

  const handleBuyMedkit = () => {
    if (engineRef.current) {
      engineRef.current.buyMedkit();
    }
  };

  // Passive Skill Tree Upgrades & Respec
  const handleUpgradeSkill = (skillId: SkillId) => {
    if (engineRef.current) {
      engineRef.current.upgradeSkill(skillId);
    }
  };

  const handleRespecSkills = () => {
    if (engineRef.current) {
      engineRef.current.respecSkills();
    }
  };

  // Settings update
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (engineRef.current) {
      engineRef.current.settings = updated;
      if (newSettings.volume !== undefined) {
        soundManager.setVolume(newSettings.volume);
      }
    }
  };

  // Restart
  const handleRestart = () => {
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    setIsUpgradeOpen(false);
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
  };

  // Continue endless
  const handleContinueEndless = () => {
    setIsVictory(false);
    if (engineRef.current) {
      engineRef.current.continueEndless();
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        id="game-canvas-container"
        ref={containerRef}
        className="absolute inset-0 h-full w-full cursor-crosshair"
      />

      {/* START BRIEFING SCREEN (Shown before player enters game) */}
      {!hasStarted && (
        <div
          id="briefing-start-screen"
          className="relative z-50 flex h-full w-full flex-col items-center justify-center bg-radial from-zinc-900/90 to-black p-6"
        >
          <div className="max-w-2xl text-center">
            {/* Outbreak Badge */}
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-red-800/80 bg-red-950/60 px-4 py-1.5 text-xs font-black tracking-widest text-red-400 uppercase">
              <ShieldAlert className="h-4 w-4 animate-pulse" />
              <span>Biohazard Quarantine Sector</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
              3D ZOMBIE SURVIVAL & CRAFTING
            </h1>
            <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
              Survive an apocalyptic quarantine zone crawling with undead horrors. Scavenge scrap metal,
              electronics, and volatile chemicals. Craft lethal traps, engineer weapon attachments, build
              exotic weapons like the Flamethrower and Tesla Plasma Cannon, and trigger explosive barrels!
            </p>

            {/* Mission Features Grid */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-left">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase">
                  <Hammer className="h-4 w-4" />
                  <span>Weapon Crafting</span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  Combine parts to build Flamethrowers, Arc Rifles, and mods.
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase">
                  <Sparkles className="h-4 w-4" />
                  <span>Tactical Traps</span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  Deploy Bear Traps [B], Spike Strips [X], and Pipe Bombs [G].
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase">
                  <Flame className="h-4 w-4" />
                  <span>Hazards & Evac</span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  Shoot explosive barrels and shock panels, then extract!
                </div>
              </div>
            </div>

            {/* Quick Controls Info */}
            <div className="mt-5 rounded-lg border border-zinc-800 bg-black/60 p-2.5 text-xs text-zinc-400">
              <span className="font-bold text-zinc-200">Controls:</span> WASD / Mobile Joystick Move | Mouse / Touch Aim | Shoot & ADS | Shift Sprint | Space Jump | E Interact | K Skills | L Logs | B/X/G Traps | F Flashlight | V Camera
            </div>

            {/* Firebase Account & Global Leaderboard Cloud Sync */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs">
              <button
                id="start-leaderboard-btn"
                onClick={() => setIsLeaderboardOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3.5 py-2 font-bold text-amber-300 hover:bg-amber-900/50 hover:text-white transition-all shadow-sm"
              >
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>Global Leaderboard & Dossier</span>
              </button>

              <div className="flex items-center gap-2">
                {isFirebaseLoading ? (
                  <span className="text-zinc-500 text-xs">Connecting to Firebase...</span>
                ) : user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Survivor:</span>
                    <span className="font-bold text-white">{user.displayName || 'Survivor'}</span>
                    {profile && (
                      <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-amber-400">
                        High Score: {profile.highScore.toLocaleString()}
                      </span>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="rounded bg-zinc-800 px-2 py-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => signIn()}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 font-bold uppercase tracking-wider text-white hover:bg-red-500 transition-all shadow-md shadow-red-950/50"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In With Google</span>
                  </button>
                )}
              </div>
            </div>

            {/* Start Button */}
            <button
              id="start-game-btn"
              onClick={() => {
                setHasStarted(true);
                if (containerRef.current) {
                  try {
                    const promise = containerRef.current.requestPointerLock() as unknown as Promise<void> | undefined;
                    if (promise && typeof promise.catch === 'function') {
                      promise.catch(() => {
                        // Suppress error if browser blocks initial lock; player can click the canvas overlay
                      });
                    }
                  } catch {
                    // Suppress synchronous restriction
                  }
                }
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-4 text-base font-black uppercase tracking-wider text-white shadow-xl shadow-red-950/60 transition-all hover:bg-red-500 active:scale-[0.98]"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>Deploy Into Quarantine Zone</span>
            </button>
          </div>
        </div>
      )}

      {/* IN-GAME HUD OVERLAY */}
      {hasStarted && (
        <HUD
          stats={stats}
          activeWeapon={activeWeapon}
          weaponState={weaponState}
          inventory={inventory}
          wave={wave}
          remainingZombies={remainingZombies}
          isIntermission={isIntermission}
          intermissionTimer={intermissionTimer}
          objective={objective}
          interactPrompt={interactPrompt}
          hitMarker={hitMarker}
          isDamaged={isDamaged}
          materials={materials}
          trapInventory={trapInventory}
          isPlacingTrap={isPlacingTrap}
          placingTrapType={placingTrapType}
          skillPoints={skillTreeState.availablePoints}
          onOpenSkillTree={() => {
            if (engineRef.current) engineRef.current.exitPointerLock();
            setIsUpgradeOpen(false);
            setIsAudioLogArchiveOpen(false);
            setIsSkillTreeOpen(true);
          }}
          audioLogPlayback={audioLogPlayback}
          audioLogsDiscoveredCount={audioLogs.filter((l) => l.discovered).length}
          totalAudioLogsCount={audioLogs.length}
          onPauseAudioLog={() => engineRef.current?.pauseAudioLog()}
          onResumeAudioLog={() => engineRef.current?.resumeAudioLog()}
          onReplayAudioLog={() => {
            if (audioLogPlayback && engineRef.current) {
              engineRef.current.playAudioLog(audioLogPlayback.log.id);
            }
          }}
          onDismissAudioLog={() => engineRef.current?.stopAudioLog()}
          onOpenAudioLogArchive={() => {
            if (engineRef.current) engineRef.current.exitPointerLock();
            setIsUpgradeOpen(false);
            setIsSkillTreeOpen(false);
            setIsAudioLogArchiveOpen(true);
          }}
          onOpenLeaderboard={() => {
            if (engineRef.current) engineRef.current.exitPointerLock();
            setIsUpgradeOpen(false);
            setIsSkillTreeOpen(false);
            setIsAudioLogArchiveOpen(false);
            setIsLeaderboardOpen(true);
          }}
          touchControlsEnabled={settings.touchControls}
          onToggleTouchControls={() => handleUpdateSettings({ touchControls: !settings.touchControls })}
          onSelectWeapon={handleSelectWeapon}
          onStartPlacingTrap={handleStartPlacingTrap}
          onPauseClick={() => {
            if (engineRef.current) engineRef.current.exitPointerLock();
            setIsPaused(true);
          }}
          isPointerLocked={isPointerLocked}
          onLockClick={handleLockClick}
        />
      )}

      {/* ON-SCREEN MOBILE TOUCH CONTROLS OVERLAY */}
      {hasStarted &&
        settings.touchControls &&
        !isPaused &&
        !isGameOver &&
        !isVictory &&
        !isUpgradeOpen &&
        !isSkillTreeOpen &&
        !isAudioLogArchiveOpen && (
          <MobileControls
            onMove={(x, y) => engineRef.current?.setMobileMove(x, y)}
            onLookDelta={(dx, dy) => engineRef.current?.addLookDelta(dx, dy)}
            onFireStart={() => engineRef.current?.setMobileFiring(true)}
            onFireEnd={() => engineRef.current?.setMobileFiring(false)}
            onJump={() => engineRef.current?.triggerJump()}
            onReload={() => engineRef.current?.reloadActiveWeapon()}
            onToggleADS={() => {
              if (engineRef.current) {
                const newAds = engineRef.current.toggleAimDownSights();
                setIsADS(newAds);
              }
            }}
            isADS={isADS}
            onToggleCrouch={() => {
              if (engineRef.current) {
                const newCrouch = engineRef.current.triggerCrouchToggle();
                setIsMobileCrouch(newCrouch);
              }
            }}
            isCrouching={isMobileCrouch}
            onToggleSprint={() => {
              if (engineRef.current) {
                const newSprint = engineRef.current.triggerSprintToggle();
                setIsMobileSprint(newSprint);
              }
            }}
            isSprinting={isMobileSprint}
            onInteract={() => engineRef.current?.triggerInteraction()}
            interactPrompt={interactPrompt}
            onToggleFlashlight={() => {
              if (engineRef.current) {
                const isOn = engineRef.current.toggleFlashlight();
                setSettings((prev) => ({ ...prev, flashlightOn: isOn }));
              }
            }}
            isFlashlightOn={settings.flashlightOn}
            onToggleViewMode={() => {
              if (engineRef.current) {
                const mode = engineRef.current.toggleViewMode();
                setSettings((prev) => ({ ...prev, viewMode: mode }));
              }
            }}
            viewMode={settings.viewMode}
            inventory={inventory}
            activeWeaponId={activeWeapon?.id || 'pistol'}
            onSelectWeapon={handleSelectWeapon}
            trapInventory={trapInventory}
            isPlacingTrap={isPlacingTrap}
            placingTrapType={placingTrapType}
            onStartPlacingTrap={handleStartPlacingTrap}
            onConfirmTrap={() => {
              if (engineRef.current) {
                const placed = engineRef.current.trapManager.confirmPlacement(
                  engineRef.current.playerPos,
                  engineRef.current.cameraYaw
                );
                if (placed) engineRef.current.notifyTrapUpdate();
              }
            }}
            onCancelTrap={() => {
              if (engineRef.current) {
                engineRef.current.trapManager.cancelPlacement();
                engineRef.current.notifyTrapUpdate();
              }
            }}
            weaponState={weaponState}
          />
        )}

      {/* UPGRADE & CRAFTING WORKBENCH MODAL */}
      {engineRef.current && (
        <UpgradeStationModal
          isOpen={isUpgradeOpen}
          onClose={() => {
            setIsUpgradeOpen(false);
            if (engineRef.current) engineRef.current.requestPointerLock();
          }}
          stats={stats}
          inventory={inventory}
          weaponConfigs={engineRef.current.weaponConfigs}
          weaponStates={engineRef.current.weaponStates}
          materials={materials}
          blueprints={blueprints}
          weaponMods={weaponMods}
          currentWave={wave}
          availableSkillPoints={skillTreeState.availablePoints}
          onOpenSkillTree={() => {
            setIsUpgradeOpen(false);
            setIsSkillTreeOpen(true);
          }}
          onUpgradeWeapon={handleUpgradeWeapon}
          onBuyWeapon={handleBuyWeapon}
          onBuyAmmo={handleBuyAmmo}
          onBuyArmor={handleBuyArmor}
          onBuyMedkit={handleBuyMedkit}
          onCraftRecipe={handleCraftRecipe}
        />
      )}

      {/* PASSIVE SKILL TREE MODAL */}
      <SkillTreeModal
        isOpen={isSkillTreeOpen}
        onClose={() => {
          setIsSkillTreeOpen(false);
          if (engineRef.current) engineRef.current.requestPointerLock();
        }}
        skillTreeState={skillTreeState}
        onUpgradeSkill={handleUpgradeSkill}
        onRespecSkills={handleRespecSkills}
      />

      {/* COLLECTIBLE AUDIO LOG ARCHIVE MODAL */}
      {isAudioLogArchiveOpen && (
        <AudioLogArchiveModal
          logs={audioLogs}
          activePlayback={audioLogPlayback}
          onPlayLog={(id) => engineRef.current?.playAudioLog(id)}
          onPauseLog={() => engineRef.current?.pauseAudioLog()}
          onResumeLog={() => engineRef.current?.resumeAudioLog()}
          onStopLog={() => engineRef.current?.stopAudioLog()}
          onClose={() => {
            setIsAudioLogArchiveOpen(false);
            if (engineRef.current) engineRef.current.requestPointerLock();
          }}
        />
      )}

      {/* PAUSE / SETTINGS MENU */}
      <PauseMenu
        isOpen={isPaused}
        onResume={() => {
          setIsPaused(false);
          if (engineRef.current) engineRef.current.requestPointerLock();
        }}
        onRestart={handleRestart}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* GAME OVER SCREEN */}
      <GameOverModal
        isOpen={isGameOver}
        onRestart={handleRestart}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        audioLogsCount={audioLogs.filter((l) => l.discovered).length}
        stats={finalStats}
      />

      {/* VICTORY / EXTRACTION SCREEN */}
      <VictoryModal
        isOpen={isVictory}
        onContinueEndless={handleContinueEndless}
        onRestart={handleRestart}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        audioLogsCount={audioLogs.filter((l) => l.discovered).length}
        stats={finalStats}
      />

      {/* GLOBAL LEADERBOARD & SURVIVOR CLOUD DOSSIER MODAL */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => {
          setIsLeaderboardOpen(false);
          if (hasStarted && !isPaused && !isGameOver && !isVictory && engineRef.current) {
            engineRef.current.requestPointerLock();
          }
        }}
      />
    </div>
  );
}
