import React, { useState, useRef, useEffect } from 'react';
import {
  Crosshair,
  RotateCcw,
  ArrowUp,
  Target,
  Zap,
  Shield,
  Flame,
  Radio,
  Eye,
  Flashlight,
  Sparkles,
  Check,
  X,
  Compass,
} from 'lucide-react';
import { TrapType, WeaponConfig, WeaponId, WeaponState } from '../types/game';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onLookDelta: (deltaX: number, deltaY: number) => void;
  onFireStart: () => void;
  onFireEnd: () => void;
  onJump: () => void;
  onReload: () => void;
  onToggleADS: () => void;
  isADS: boolean;
  onToggleCrouch: () => void;
  isCrouching: boolean;
  onToggleSprint: () => void;
  isSprinting: boolean;
  onInteract: () => void;
  interactPrompt: string | null;
  onToggleFlashlight: () => void;
  isFlashlightOn: boolean;
  onToggleViewMode: () => void;
  viewMode: 'first' | 'third';
  inventory: WeaponId[];
  activeWeaponId: WeaponId;
  onSelectWeapon: (id: WeaponId) => void;
  trapInventory: Record<TrapType, number>;
  isPlacingTrap: boolean;
  placingTrapType: TrapType | null;
  onStartPlacingTrap: (type: TrapType) => void;
  onConfirmTrap: () => void;
  onCancelTrap: () => void;
  weaponState: WeaponState | null;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onLookDelta,
  onFireStart,
  onFireEnd,
  onJump,
  onReload,
  onToggleADS,
  isADS,
  onToggleCrouch,
  isCrouching,
  onToggleSprint,
  isSprinting,
  onInteract,
  interactPrompt,
  onToggleFlashlight,
  isFlashlightOn,
  onToggleViewMode,
  viewMode,
  inventory,
  activeWeaponId,
  onSelectWeapon,
  trapInventory,
  isPlacingTrap,
  placingTrapType,
  onStartPlacingTrap,
  onConfirmTrap,
  onCancelTrap,
  weaponState,
}) => {
  // Joystick Touch State
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickOriginRef = useRef<{ x: number; y: number } | null>(null);

  // Touch Look Drag State
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. JOYSTICK HANDLERS
  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (joystickTouchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;

    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      joystickOriginRef.current = { x: originX, y: originY };

      updateJoystick(touch.clientX, touch.clientY);
    }
  };

  const handleJoystickTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        joystickOriginRef.current = null;
        if (knobRef.current) {
          knobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        setIsJoystickActive(false);
        onMove(0, 0);
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickOriginRef.current) return;
    const maxRadius = 48; // max pixel distance of stick
    const deltaX = clientX - joystickOriginRef.current.x;
    const deltaY = clientY - joystickOriginRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let normX = 0;
    let normY = 0;
    let clampedX = deltaX;
    let clampedY = deltaY;

    if (distance > 0) {
      const angle = Math.atan2(deltaY, deltaX);
      const clampedDist = Math.min(distance, maxRadius);
      clampedX = Math.cos(angle) * clampedDist;
      clampedY = Math.sin(angle) * clampedDist;

      // Normalized vector for movement: X = strafe (-1 to 1), Y = forward (-1 to 1)
      normX = clampedX / maxRadius;
      normY = -clampedY / maxRadius; // inverted because screen Y points down
    }

    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0px)`;
    }
    if (!isJoystickActive) {
      setIsJoystickActive(true);
    }
    onMove(normX, normY);
  };

  // 2. TOUCH LOOK HANDLERS (Right Side Camera Drag)
  const handleLookTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // If we already track a look touch, ignore other fingers in this container
    if (lookTouchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const deltaX = touch.clientX - lastLookPosRef.current.x;
        const deltaY = touch.clientY - lastLookPosRef.current.y;
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };

        onLookDelta(deltaX, deltaY);
        break;
      }
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  };

  const weaponNames: Record<WeaponId, string> = {
    pistol: 'Pistol',
    shotgun: 'Shotgun',
    rifle: 'Rifle',
    marksman: 'Sniper',
    flamethrower: 'Pyro',
    arc_rifle: 'Tesla',
  };

  return (
    <div
      id="mobile-controls-layer"
      className="pointer-events-none fixed inset-0 z-30 select-none overflow-hidden touch-none"
    >
      {/* RIGHT-SIDE TOUCH LOOK ZONE (Drag camera view without triggering buttons) */}
      <div
        id="touch-look-zone"
        className="pointer-events-auto absolute right-0 top-16 bottom-0 w-[55vw]"
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        onTouchCancel={handleLookTouchEnd}
      />

      {/* BOTTOM-LEFT: VIRTUAL ANALOG JOYSTICK */}
      <div className="pointer-events-auto absolute bottom-8 left-8 flex flex-col items-center">
        <div
          ref={joystickRef}
          id="virtual-joystick"
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-cyan-500/40 bg-black/60 shadow-2xl backdrop-blur-md active:border-cyan-400/80"
        >
          {/* Outer Crosshair Indicators */}
          <div className="absolute top-1.5 h-2 w-0.5 bg-cyan-500/40" />
          <div className="absolute bottom-1.5 h-2 w-0.5 bg-cyan-500/40" />
          <div className="absolute left-1.5 h-0.5 w-2 bg-cyan-500/40" />
          <div className="absolute right-1.5 h-0.5 w-2 bg-cyan-500/40" />

          {/* Center Rest Ring */}
          <div className="absolute h-10 w-10 rounded-full border border-cyan-500/20" />

          {/* Draggable Stick Knob */}
          <div
            ref={knobRef}
            id="joystick-knob"
            className={`flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300 shadow-lg ${
              isJoystickActive
                ? 'bg-cyan-500/90 shadow-cyan-500/50 scale-105'
                : 'bg-cyan-600/60 shadow-cyan-900/40'
            }`}
            style={{
              transform: 'translate3d(0px, 0px, 0px)',
              transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
              willChange: 'transform',
            }}
          >
            <Compass className="h-6 w-6 text-white/90" />
          </div>
        </div>

        {/* Sprint / Movement Indicator */}
        <div className="mt-2 flex items-center gap-2">
          <button
            id="mobile-crouch-btn"
            onClick={onToggleCrouch}
            className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase transition-all ${
              isCrouching
                ? 'border-amber-400 bg-amber-500 text-black'
                : 'border-zinc-700 bg-black/70 text-zinc-300'
            }`}
          >
            Crouch
          </button>
          <button
            id="mobile-sprint-btn"
            onClick={onToggleSprint}
            className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase transition-all ${
              isSprinting
                ? 'border-emerald-400 bg-emerald-500 text-black'
                : 'border-zinc-700 bg-black/70 text-zinc-300'
            }`}
          >
            Sprint
          </button>
        </div>
      </div>

      {/* TOP-RIGHT UTILITY DOCK (Camera, Flashlight) */}
      <div className="pointer-events-auto absolute top-20 right-4 flex items-center gap-2">
        <button
          id="mobile-flashlight-btn"
          onClick={onToggleFlashlight}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
            isFlashlightOn
              ? 'border-amber-400 bg-amber-500 text-black shadow-lg shadow-amber-500/30'
              : 'border-zinc-800 bg-black/80 text-zinc-400'
          }`}
          title="Toggle Flashlight [F]"
        >
          <Flashlight className="h-5 w-5" />
        </button>

        <button
          id="mobile-viewmode-btn"
          onClick={onToggleViewMode}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-black/80 text-zinc-300 transition-all active:scale-95`}
          title="Toggle 1st / 3rd Person [V]"
        >
          <Eye className="h-5 w-5" />
        </button>
      </div>

      {/* HORIZONTAL WEAPON SELECTOR DOCK (Top Center / Easy Thumb Reach) */}
      <div className="pointer-events-auto absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-2xl border border-zinc-800/90 bg-black/85 p-1.5 shadow-2xl backdrop-blur-md">
        {inventory.map((wId) => {
          const isActive = wId === activeWeaponId;
          return (
            <button
              key={wId}
              id={`mobile-weapon-${wId}`}
              onClick={() => onSelectWeapon(wId)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black transition-all ${
                isActive
                  ? 'border border-cyan-400 bg-cyan-950 text-cyan-200 shadow-md ring-1 ring-cyan-400/40'
                  : 'border border-transparent bg-zinc-900/60 text-zinc-400 hover:text-white'
              }`}
            >
              <span>{weaponNames[wId] || wId}</span>
            </button>
          );
        })}
      </div>

      {/* QUICK TRAP SELECTION BAR (Above Action Cluster) */}
      <div className="pointer-events-auto absolute bottom-44 right-6 flex items-center gap-2">
        {(['bear_trap', 'spike_strip', 'pipe_bomb'] as TrapType[]).map((tType) => {
          const count = trapInventory[tType] || 0;
          const isSelected = isPlacingTrap && placingTrapType === tType;

          return (
            <button
              key={tType}
              id={`mobile-trap-${tType}`}
              disabled={count <= 0}
              onClick={() => onStartPlacingTrap(tType)}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950 text-cyan-300 ring-2 ring-cyan-400/60 scale-105'
                  : count > 0
                  ? 'border-zinc-700 bg-black/80 text-zinc-200 active:scale-95'
                  : 'border-zinc-900 bg-black/40 text-zinc-600 opacity-40'
              }`}
            >
              <Sparkles className="h-4.5 w-4.5" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-black text-black">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TRAP PLACEMENT CONFIRMATION BUTTONS (When in trap placement mode) */}
      {isPlacingTrap && (
        <div className="pointer-events-auto absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-4 animate-in fade-in zoom-in-95">
          <button
            id="mobile-confirm-trap-btn"
            onClick={onConfirmTrap}
            className="flex items-center gap-2 rounded-xl border border-emerald-400 bg-emerald-600 px-5 py-3 text-sm font-black uppercase text-white shadow-xl shadow-emerald-950/60 active:scale-95"
          >
            <Check className="h-5 w-5" />
            <span>Deploy Trap</span>
          </button>
          <button
            id="mobile-cancel-trap-btn"
            onClick={onCancelTrap}
            className="flex items-center gap-2 rounded-xl border border-red-400 bg-red-600 px-5 py-3 text-sm font-black uppercase text-white shadow-xl shadow-red-950/60 active:scale-95"
          >
            <X className="h-5 w-5" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* DYNAMIC INTERACT BUTTON (Shows prominently when near an interactable object) */}
      {interactPrompt && !isPlacingTrap && (
        <div className="pointer-events-auto absolute bottom-32 right-36 flex flex-col items-center gap-1.5 animate-bounce">
          <button
            id="mobile-interact-btn"
            onClick={onInteract}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-400 bg-amber-500 text-black shadow-2xl shadow-amber-500/50 active:scale-95"
          >
            <span className="font-mono text-lg font-black">[E]</span>
          </button>
          <span className="max-w-[130px] text-center text-[11px] font-bold text-amber-300 drop-shadow-md">
            {interactPrompt}
          </span>
        </div>
      )}

      {/* PRIMARY ACTION BUTTONS CLUSTER (Bottom Right Thumb Arc) */}
      <div className="pointer-events-auto absolute bottom-6 right-6 flex items-end gap-3">
        {/* Secondary Actions Column (Reload, ADS, Jump) */}
        <div className="flex flex-col gap-3">
          {/* ADS (Aim Down Sights) Toggle */}
          <button
            id="mobile-ads-btn"
            onClick={onToggleADS}
            className={`flex h-13 w-13 items-center justify-center rounded-2xl border transition-all active:scale-95 ${
              isADS
                ? 'border-cyan-400 bg-cyan-950 text-cyan-300 ring-2 ring-cyan-400/50 shadow-lg'
                : 'border-zinc-700 bg-black/80 text-zinc-300'
            }`}
            title="Toggle ADS"
          >
            <Target className="h-6 w-6" />
          </button>

          {/* Reload Button */}
          <button
            id="mobile-reload-btn"
            onClick={onReload}
            className="flex h-13 w-13 items-center justify-center rounded-2xl border border-zinc-700 bg-black/80 text-zinc-300 transition-all active:scale-95"
            title="Reload [R]"
          >
            <RotateCcw
              className={`h-6 w-6 ${weaponState?.isReloading ? 'animate-spin text-amber-400' : ''}`}
            />
          </button>

          {/* Jump Button */}
          <button
            id="mobile-jump-btn"
            onClick={onJump}
            className="flex h-13 w-13 items-center justify-center rounded-2xl border border-emerald-500/80 bg-emerald-950/80 text-emerald-300 shadow-lg active:scale-95"
            title="Jump [Space]"
          >
            <ArrowUp className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* PRIMARY FIRE TRIGGER (Large, Ergonomic, Hold or Tap) */}
        <button
          id="mobile-fire-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            onFireStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onFireEnd();
          }}
          onMouseDown={onFireStart}
          onMouseUp={onFireEnd}
          className="relative flex h-20 w-20 items-center justify-center rounded-full border-3 border-red-400 bg-gradient-to-br from-red-600 to-red-800 text-white shadow-2xl shadow-red-950/80 transition-transform active:scale-95 active:brightness-125"
          title="Fire Weapon"
        >
          <Crosshair className="h-9 w-9 stroke-[2.5]" />
          <span className="absolute -bottom-1 text-[9px] font-black uppercase tracking-wider text-red-200">
            FIRE
          </span>
        </button>
      </div>
    </div>
  );
};
