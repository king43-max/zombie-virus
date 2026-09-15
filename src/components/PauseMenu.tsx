import React from 'react';
import { Eye, Keyboard, Play, RotateCcw, Sliders, Smartphone, Trophy, Volume2, X } from 'lucide-react';
import { GameSettings } from '../types/game';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenLeaderboard?: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenLeaderboard,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="pause-menu-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-700/80 bg-zinc-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide">
                Game Paused
              </h2>
              <p className="text-xs text-zinc-400">Settings and Tactical Controls Guide</p>
            </div>
          </div>

          <button
            id="close-pause-menu-btn"
            onClick={onResume}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
          {/* Settings Sliders */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-cyan-400" />
              <span>Audio & Controls Settings</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
              {/* Volume */}
              <div>
                <div className="flex justify-between mb-1">
                  <span>Master Volume</span>
                  <span className="font-mono text-zinc-400">{Math.round(settings.volume * 100)}%</span>
                </div>
                <input
                  id="volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.volume}
                  onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Sensitivity */}
              {/* Mouse Sensitivity */}
              <div>
                <div className="flex justify-between mb-1">
                  <span>Mouse Sensitivity</span>
                  <span className="font-mono text-zinc-400">
                    {Math.round(settings.mouseSensitivity * 10000) / 10}
                  </span>
                </div>
                <input
                  id="sensitivity-slider"
                  type="range"
                  min="0.001"
                  max="0.005"
                  step="0.0005"
                  value={settings.mouseSensitivity}
                  onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Touch Look Sensitivity */}
              <div>
                <div className="flex justify-between mb-1">
                  <span>Touch Look Sensitivity</span>
                  <span className="font-mono text-cyan-400">
                    {Math.round((settings.touchSensitivity || 0.0035) * 10000) / 10}
                  </span>
                </div>
                <input
                  id="touch-sensitivity-slider"
                  type="range"
                  min="0.0015"
                  max="0.0080"
                  step="0.0005"
                  value={settings.touchSensitivity || 0.0035}
                  onChange={(e) => onUpdateSettings({ touchSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Mobile Touch Controls Toggle */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-cyan-400" />
                  <span>On-Screen Touch Controls</span>
                </span>
                <button
                  id="toggle-touch-controls-btn"
                  onClick={() => onUpdateSettings({ touchControls: !settings.touchControls })}
                  className={`rounded px-3 py-1 text-xs font-bold uppercase transition-colors ${
                    settings.touchControls ? 'bg-cyan-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {settings.touchControls ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* View Mode */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-amber-400" />
                  <span>Camera Perspective</span>
                </span>
                <button
                  id="toggle-viewmode-btn"
                  onClick={() =>
                    onUpdateSettings({ viewMode: settings.viewMode === 'first' ? 'third' : 'first' })
                  }
                  className="rounded bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-200 hover:bg-zinc-700 uppercase"
                >
                  {settings.viewMode === 'first' ? '1st Person' : '3rd Person'}
                </button>
              </div>

              {/* Flashlight */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <span>Tactical Flashlight</span>
                <button
                  id="toggle-flashlight-btn"
                  onClick={() => onUpdateSettings({ flashlightOn: !settings.flashlightOn })}
                  className={`rounded px-3 py-1 text-xs font-bold uppercase transition-colors ${
                    settings.flashlightOn ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {settings.flashlightOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Controls Reference Table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-amber-400" />
              <span>Tactical Operations Controls</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Move</span>
                <span className="font-bold text-white font-mono">W, A, S, D</span>
              </div>
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Shoot</span>
                <span className="font-bold text-white font-mono">Left Click</span>
              </div>
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Aim Sights</span>
                <span className="font-bold text-white font-mono">Right Click</span>
              </div>
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Sprint</span>
                <span className="font-bold text-white font-mono">Shift</span>
              </div>
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Jump</span>
                <span className="font-bold text-white font-mono">Space</span>
              </div>
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Crouch</span>
                <span className="font-bold text-white font-mono">C / Ctrl</span>
              </div>
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Reload</span>
                <span className="font-bold text-white font-mono">R</span>
              </div>
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Interact</span>
                <span className="font-bold text-amber-300 font-mono">E</span>
              </div>
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Weapons</span>
                <span className="font-bold text-white font-mono">1, 2, 3, 4</span>
              </div>
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Flashlight</span>
                <span className="font-bold text-white font-mono">F</span>
              </div>
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Camera</span>
                <span className="font-bold text-white font-mono">V</span>
              </div>
              <div className="flex justify-between rounded bg-zinc-950/80 px-2.5 py-1.5 border border-zinc-800">
                <span className="text-zinc-400">Pause</span>
                <span className="font-bold text-white font-mono">Esc / P</span>
              </div>
            </div>

            {/* Mobile Touch Quick Guide */}
            <div className="mt-3 rounded-lg border border-cyan-900/40 bg-cyan-950/20 p-2.5 text-[11px] text-cyan-200">
              <span className="font-bold text-cyan-300 uppercase tracking-wider block mb-1">
                Mobile Touch Controls
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-zinc-300">
                <li>• <strong className="text-white">Left Joystick:</strong> Analog Move / Push forward to Sprint</li>
                <li>• <strong className="text-white">Right Half Screen:</strong> Swipe to Look & Aim</li>
                <li>• <strong className="text-white">Red Button:</strong> Fire Weapon (Hold for auto)</li>
                <li>• <strong className="text-white">Target Button:</strong> Aim Down Sights (ADS)</li>
                <li>• <strong className="text-white">Top Dock:</strong> 1-Tap Weapon Switching</li>
                <li>• <strong className="text-white">Action Chips:</strong> Jump, Reload, Crouch, Traps</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 flex flex-wrap gap-3 border-t border-zinc-800 pt-4">
          <button
            id="resume-btn"
            onClick={onResume}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-cyan-500 shadow-md transition-all"
          >
            <Play className="h-4 w-4" />
            <span>Resume Game</span>
          </button>

          {onOpenLeaderboard && (
            <button
              id="pause-leaderboard-btn"
              onClick={onOpenLeaderboard}
              className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-950/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-900/50 transition-all"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>Leaderboard</span>
            </button>
          )}

          <button
            id="restart-run-btn"
            onClick={onRestart}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restart Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};
