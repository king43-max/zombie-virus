import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager';
import { AudioLog, AudioLogPlaybackState } from '../types/game';

export const INITIAL_AUDIO_LOGS: AudioLog[] = [
  {
    id: 'log_01',
    number: 1,
    title: 'Day 0: Patient Zero',
    speaker: 'Dr. Elena Vance',
    role: 'Chief Epidemiologist, Sector 4 Clinic',
    timestamp: 'October 14, 23:42 hrs',
    category: 'origin',
    durationSeconds: 14,
    transcript:
      "The fever doesn't break. Within thirty minutes of viral onset, motor control degrades into erratic aggression. We attempted neurological suppression, but the amygdala went into hyper-drive. Security just sealed Quarantine Sector 4... God help us, it's airborne through the ventilation ducts.",
    locationHint: 'Abandoned Pharmacy & Clinic consultation desk',
    coordinates: { x: 33, y: 0.9, z: -34 },
    discovered: false,
    voiceConfig: { pitch: 1.15, rate: 0.96 },
  },
  {
    id: 'log_02',
    number: 2,
    title: 'Day 3: Emergency Directive 9',
    speaker: 'Major K. Sterling',
    role: 'Task Force Ironclad Commander',
    timestamp: 'October 17, 04:15 hrs',
    category: 'military',
    durationSeconds: 15,
    transcript:
      'All units, Directive Nine is active. Demolish the river bridges. Sever the highway arteries. No civilians cross the perimeter wall under any circumstances. If the horde breaches the containment line, the extraction choppers are ordered to bug out immediately. Maintain the perimeter at all costs.',
    locationHint: 'Central checkpoint sandbag barricade',
    coordinates: { x: 2, y: 0.6, z: 8 },
    discovered: false,
    voiceConfig: { pitch: 0.85, rate: 0.92 },
  },
  {
    id: 'log_03',
    number: 3,
    title: 'Day 7: The Screamer Mutation',
    speaker: 'Sgt. Marcus Reed',
    role: 'Scout Recon Unit 3',
    timestamp: 'October 21, 19:30 hrs',
    category: 'mutation',
    durationSeconds: 15,
    transcript:
      "They aren't just rotting corpses—they're evolving. We spotted one with warped vocal cords perched on the municipal roof. When it shrieks, every infected within five blocks goes berserk and swarms the sound. Keep your flashlights low, conserve ammunition, and aim for the vocal cords.",
    locationHint: 'Convenience Store loading alley dumpster',
    coordinates: { x: -33, y: 0.8, z: 36 },
    discovered: false,
    voiceConfig: { pitch: 0.95, rate: 0.98 },
  },
  {
    id: 'log_04',
    number: 4,
    title: 'Day 12: The Underground Stash',
    speaker: "Frank 'Tinkerer' Ross",
    role: 'Survivor Machinist',
    timestamp: 'October 26, 12:05 hrs',
    category: 'crafting',
    durationSeconds: 16,
    transcript:
      'Standard lead won\'t cut it once the armored ones show up. I modified the machine shop workbench down by the motor pool. Scrap metal, wire coils, and chemical bottles—you can fabricate incendiary rounds, bear traps, and shock coils. If anyone finds this recorder, use the workbench to survive.',
    locationHint: 'Police Armory interior bench near workbench',
    coordinates: { x: -29, y: 0.9, z: -30 },
    discovered: false,
    voiceConfig: { pitch: 0.88, rate: 0.94 },
  },
  {
    id: 'log_05',
    number: 5,
    title: 'Day 19: Grid Overload',
    speaker: 'Chief Engineer Alvarez',
    role: 'Municipal Grid Operations',
    timestamp: 'November 2, 01:10 hrs',
    category: 'hazards',
    durationSeconds: 15,
    transcript:
      'Main turbine sub-station tripped. Backups won\'t last until dawn. I rigged the emergency switchgear with manual contact breakers. If the undead swarm the fence, tripping the circuit overload will fry dozens of them in seconds. Just don\'t be standing in the water pool when you throw the switch.',
    locationHint: 'Power Substation high-voltage relay panel',
    coordinates: { x: 18, y: 0.8, z: -14 },
    discovered: false,
    voiceConfig: { pitch: 0.92, rate: 0.95 },
  },
  {
    id: 'log_06',
    number: 6,
    title: 'Day 24: Final Evac Beacon',
    speaker: 'Captain Sarah Chen',
    role: 'Evac Pilot, Flight 402',
    timestamp: 'November 7, 18:55 hrs',
    category: 'evacuation',
    durationSeconds: 15,
    transcript:
      'This is Evac Flight Four-Zero-Two transmitting on open military distress frequency. We have established an emergency extraction coordinate at the North Helipad. Surviving combatants: initiate the radio relay beacon. You must hold the LZ perimeter for sixty seconds against the swarm. We will extract you.',
    locationHint: 'North Helipad extraction control crate',
    coordinates: { x: -4, y: 0.6, z: -52 },
    discovered: false,
    voiceConfig: { pitch: 1.1, rate: 0.94 },
  },
];

export interface AudioLogInstance {
  log: AudioLog;
  group: THREE.Group;
  beaconLight: THREE.PointLight;
  hologramRing: THREE.Mesh;
  reelLeft: THREE.Mesh;
  reelRight: THREE.Mesh;
  ledMesh: THREE.Mesh;
  baseY: number;
}

/**
 * Creates an authentic 3D field cassette recorder model with
 * spinning tape spools, glowing LEDs, beacon light, and hovering hologram ring.
 */
export function createAudioLogMesh(log: AudioLog): {
  group: THREE.Group;
  beaconLight: THREE.PointLight;
  hologramRing: THREE.Mesh;
  reelLeft: THREE.Mesh;
  reelRight: THREE.Mesh;
  ledMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.position.set(log.coordinates.x, log.coordinates.y, log.coordinates.z);

  // 1. Heavy military cassette recorder housing
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x222a28, // Tactical olive drab / weathered polymer
    roughness: 0.7,
    metalness: 0.35,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.36), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 2. Clear cassette window inset
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x11161d,
    roughness: 0.2,
    metalness: 0.8,
  });
  const cassetteWindow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.18), windowMat);
  cassetteWindow.position.set(0, 0.075, -0.02);
  group.add(cassetteWindow);

  // 3. Two miniature tape spools (reels)
  const reelMat = new THREE.MeshStandardMaterial({
    color: 0x423223, // Brown tape ribbon + dark plastic hub
    roughness: 0.6,
    metalness: 0.4,
  });
  const reelGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.025, 12);

  const reelLeft = new THREE.Mesh(reelGeom, reelMat);
  reelLeft.position.set(-0.075, 0.082, -0.02);
  group.add(reelLeft);

  const reelRight = new THREE.Mesh(reelGeom, reelMat);
  reelRight.position.set(0.075, 0.082, -0.02);
  group.add(reelRight);

  // Hub cross notches
  const notchMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const notchL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.026, 0.012), notchMat);
  reelLeft.add(notchL);
  const notchR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.026, 0.012), notchMat);
  reelRight.add(notchR);

  // 4. Physical Control buttons (Rec, Play, Stop)
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5 });
  const playBtn = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), buttonMat);
  playBtn.position.set(-0.12, 0.08, 0.12);
  group.add(playBtn);

  const stopBtn = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), buttonMat);
  stopBtn.position.set(-0.06, 0.08, 0.12);
  group.add(stopBtn);

  // Red REC button
  const recBtn = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.03, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 })
  );
  recBtn.position.set(0.0, 0.08, 0.12);
  group.add(recBtn);

  // 5. Blinking status LED indicator
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), ledMat);
  ledMesh.position.set(0.14, 0.085, 0.12);
  group.add(ledMesh);

  // 6. Beacon PointLight for distance spotting in darkness/fog
  const beaconLight = new THREE.PointLight(0xffaa00, 1.4, 6.5);
  beaconLight.position.set(0, 0.25, 0);
  group.add(beaconLight);

  // 7. Floating holographic audio waveform ring above the recorder
  const ringGeom = new THREE.TorusGeometry(0.24, 0.012, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    wireframe: true,
    transparent: true,
    opacity: 0.65,
  });
  const hologramRing = new THREE.Mesh(ringGeom, ringMat);
  hologramRing.rotation.x = Math.PI / 2;
  hologramRing.position.set(0, 0.45, 0);
  group.add(hologramRing);

  return {
    group,
    beaconLight,
    hologramRing,
    reelLeft,
    reelRight,
    ledMesh,
  };
}

export class AudioLogManager {
  public logs: AudioLog[] = [];
  public instances: AudioLogInstance[] = [];
  public activePlayback: AudioLogPlaybackState | null = null;
  private playbackTimerId: number | null = null;
  private onPlaybackUpdate?: (state: AudioLogPlaybackState | null) => void;
  private onDiscoveredUpdate?: (logs: AudioLog[]) => void;

  constructor(
    onPlaybackUpdate?: (state: AudioLogPlaybackState | null) => void,
    onDiscoveredUpdate?: (logs: AudioLog[]) => void
  ) {
    this.onPlaybackUpdate = onPlaybackUpdate;
    this.onDiscoveredUpdate = onDiscoveredUpdate;
    this.loadState();
  }

  private loadState() {
    let savedIds: string[] = [];
    try {
      const saved = localStorage.getItem('zombie_survival_audio_logs');
      if (saved) {
        savedIds = JSON.parse(saved);
      }
    } catch {}

    this.logs = INITIAL_AUDIO_LOGS.map((log) => ({
      ...log,
      discovered: savedIds.includes(log.id),
    }));
  }

  private saveState() {
    try {
      const discoveredIds = this.logs.filter((l) => l.discovered).map((l) => l.id);
      localStorage.setItem('zombie_survival_audio_logs', JSON.stringify(discoveredIds));
    } catch {}
  }

  public registerInstances(scene: THREE.Scene) {
    this.instances = [];
    for (const log of this.logs) {
      const { group, beaconLight, hologramRing, reelLeft, reelRight, ledMesh } = createAudioLogMesh(log);
      scene.add(group);
      this.instances.push({
        log,
        group,
        beaconLight,
        hologramRing,
        reelLeft,
        reelRight,
        ledMesh,
        baseY: log.coordinates.y,
      });
    }
  }

  public getLogById(id: string): AudioLog | undefined {
    return this.logs.find((l) => l.id === id);
  }

  public playLog(logId: string) {
    const log = this.getLogById(logId);
    if (!log) return;

    // Mark discovered
    if (!log.discovered) {
      log.discovered = true;
      this.saveState();
      if (this.onDiscoveredUpdate) {
        this.onDiscoveredUpdate([...this.logs]);
      }
    }

    // Stop current playback if any
    this.stopPlayback();

    const playback: AudioLogPlaybackState = {
      log,
      currentTime: 0,
      duration: log.durationSeconds,
      isPlaying: true,
      isComplete: false,
    };
    this.activePlayback = playback;

    if (this.onPlaybackUpdate) {
      this.onPlaybackUpdate({ ...playback });
    }

    // Play narration through soundManager
    soundManager.speakAudioLog(log.transcript, log.voiceConfig, () => {
      if (this.activePlayback && this.activePlayback.log.id === log.id) {
        this.activePlayback.isComplete = true;
        this.activePlayback.isPlaying = false;
        this.activePlayback.currentTime = this.activePlayback.duration;
        if (this.onPlaybackUpdate) {
          this.onPlaybackUpdate({ ...this.activePlayback });
        }
      }
    });

    // Start UI progress interval ticker (runs at ~10 Hz)
    const startTime = Date.now();
    this.playbackTimerId = window.setInterval(() => {
      if (!this.activePlayback || !this.activePlayback.isPlaying) return;

      const elapsed = (Date.now() - startTime) / 1000;
      this.activePlayback.currentTime = Math.min(this.activePlayback.duration, elapsed);

      if (this.activePlayback.currentTime >= this.activePlayback.duration) {
        this.activePlayback.isComplete = true;
        this.activePlayback.isPlaying = false;
        if (this.playbackTimerId) {
          clearInterval(this.playbackTimerId);
          this.playbackTimerId = null;
        }
      }

      if (this.onPlaybackUpdate) {
        this.onPlaybackUpdate({ ...this.activePlayback });
      }
    }, 100);
  }

  public stopPlayback() {
    if (this.playbackTimerId) {
      clearInterval(this.playbackTimerId);
      this.playbackTimerId = null;
    }
    soundManager.stopAudioLog();
    if (this.activePlayback) {
      this.activePlayback = null;
      if (this.onPlaybackUpdate) {
        this.onPlaybackUpdate(null);
      }
    }
  }

  public pausePlayback() {
    if (!this.activePlayback) return;
    this.activePlayback.isPlaying = false;
    soundManager.stopTapeHiss();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.pause(); } catch {}
    }
    if (this.onPlaybackUpdate) {
      this.onPlaybackUpdate({ ...this.activePlayback });
    }
  }

  public resumePlayback() {
    if (!this.activePlayback) return;
    this.activePlayback.isPlaying = true;
    soundManager.startTapeHiss();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.resume(); } catch {}
    }
    if (this.onPlaybackUpdate) {
      this.onPlaybackUpdate({ ...this.activePlayback });
    }
  }

  public update(delta: number, elapsed: number) {
    // Animate each audio log mesh in the world
    for (const inst of this.instances) {
      const isThisPlaying =
        this.activePlayback &&
        this.activePlayback.isPlaying &&
        this.activePlayback.log.id === inst.log.id;

      // Pulse beacon light: Faster and brighter if actively playing
      const pulseSpeed = isThisPlaying ? 8.0 : 3.0;
      const baseIntensity = isThisPlaying ? 2.2 : (inst.log.discovered ? 0.8 : 1.4);
      inst.beaconLight.intensity = baseIntensity + Math.sin(elapsed * pulseSpeed) * 0.5;

      // Color coding: Cyan if discovered/playing, Amber if undiscovered
      const colorHex = isThisPlaying ? 0x00e5ff : (inst.log.discovered ? 0x44dd88 : 0xffaa00);
      inst.beaconLight.color.setHex(colorHex);
      (inst.hologramRing.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
      (inst.ledMesh.material as THREE.MeshBasicMaterial).color.setHex(isThisPlaying ? 0xff2222 : colorHex);

      // Rotate hologram ring hovering above
      inst.hologramRing.rotation.z += delta * 1.2;
      inst.hologramRing.position.y = 0.45 + Math.sin(elapsed * 2.5) * 0.05;

      // Spin cassette reels if actively playing!
      if (isThisPlaying) {
        inst.reelLeft.rotation.y += delta * 8.0;
        inst.reelRight.rotation.y += delta * 8.0;
      }
    }
  }

  public cleanup() {
    this.stopPlayback();
    for (const inst of this.instances) {
      if (inst.group.parent) {
        inst.group.parent.remove(inst.group);
      }
    }
    this.instances = [];
  }
}
