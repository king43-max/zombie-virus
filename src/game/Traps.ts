import * as THREE from 'three';
import { ParticleSystem } from './Particles';
import { soundManager } from '../audio/SoundManager';
import { ZombieInstance, ZombieManager } from './Zombies';
import { TrapType } from '../types/game';

export interface TrapInstance {
  id: string;
  type: TrapType;
  position: THREE.Vector3;
  rotationY: number;
  group: THREE.Group;
  state: 'armed' | 'sprung' | 'destroyed';
  healthOrUses: number;
  maxUses: number;
  durationTimer?: number;
  // Specific mesh references for animated triggers
  leftJaw?: THREE.Mesh;
  rightJaw?: THREE.Mesh;
  light?: THREE.PointLight;
}

export class TrapManager {
  private scene: THREE.Scene;
  private particles: ParticleSystem;
  public traps: TrapInstance[] = [];

  // Player Trap Inventory
  public inventory: Record<TrapType, number> = {
    bear_trap: 2,
    spike_strip: 1,
    pipe_bomb: 0,
  };

  // Placement mode state
  public isPlacing = false;
  public activeTrapType: TrapType | null = null;
  private previewMesh: THREE.Group;
  private previewRing: THREE.Mesh;
  private previewValid = false;
  public previewPosition = new THREE.Vector3();

  // Floor plane for placement raycasting
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private raycaster = new THREE.Raycaster();

  // Passive skill modifiers
  public maxPlacementRange = 6.5;
  public extraTrapUses = 0;
  public extraPinDuration = 0;
  public explosiveMultiplier = { radiusMult: 1.0, damageMult: 1.0 };

  constructor(scene: THREE.Scene, particles: ParticleSystem) {
    this.scene = scene;
    this.particles = particles;

    // Create placement preview ghost
    this.previewMesh = new THREE.Group();
    this.previewMesh.visible = false;

    const ringGeo = new THREE.RingGeometry(0.7, 0.85, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    this.previewRing = new THREE.Mesh(ringGeo, ringMat);
    this.previewRing.rotation.x = -Math.PI / 2;
    this.previewRing.position.y = 0.05;
    this.previewMesh.add(this.previewRing);

    this.scene.add(this.previewMesh);
  }

  // --- 3D MESH GENERATION ---

  private createBearTrapMesh(): { group: THREE.Group; leftJaw: THREE.Mesh; rightJaw: THREE.Mesh } {
    const group = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x272a2e,
      metalness: 0.85,
      roughness: 0.35,
    });

    const jawMat = new THREE.MeshStandardMaterial({
      color: 0x474c52,
      metalness: 0.9,
      roughness: 0.3,
    });

    const springMat = new THREE.MeshStandardMaterial({
      color: 0x8b3a12,
      metalness: 0.7,
      roughness: 0.4,
    });

    // Base cross plates
    const basePlate1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.14), metalMat);
    basePlate1.position.y = 0.02;
    basePlate1.castShadow = true;
    basePlate1.receiveShadow = true;
    group.add(basePlate1);

    const basePlate2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.9), metalMat);
    basePlate2.position.y = 0.02;
    basePlate2.castShadow = true;
    basePlate2.receiveShadow = true;
    group.add(basePlate2);

    // Center trigger pressure plate
    const triggerPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16), metalMat);
    triggerPlate.position.y = 0.045;
    group.add(triggerPlate);

    // Heavy Torsion Springs on the sides
    const spring1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12), springMat);
    spring1.rotation.z = Math.PI / 2;
    spring1.position.set(-0.45, 0.05, 0);
    group.add(spring1);

    const spring2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12), springMat);
    spring2.rotation.z = Math.PI / 2;
    spring2.position.set(0.45, 0.05, 0);
    group.add(spring2);

    // Toothed Jaws (pivoting on Z axis)
    const jawGeo = new THREE.TorusGeometry(0.38, 0.032, 6, 16, Math.PI);
    
    // Left Jaw
    const leftJaw = new THREE.Mesh(jawGeo, jawMat);
    leftJaw.rotation.x = Math.PI / 2;
    leftJaw.rotation.z = Math.PI;
    leftJaw.position.set(0, 0.05, -0.05);
    leftJaw.castShadow = true;
    group.add(leftJaw);

    // Right Jaw
    const rightJaw = new THREE.Mesh(jawGeo, jawMat);
    rightJaw.rotation.x = Math.PI / 2;
    rightJaw.rotation.z = 0;
    rightJaw.position.set(0, 0.05, 0.05);
    rightJaw.castShadow = true;
    group.add(rightJaw);

    // Sharp spikes along jaws
    for (let i = 0; i < 7; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.022, 0.09, 6);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });
      
      const angle = (i / 6) * Math.PI;
      const sx = Math.cos(angle) * 0.38;
      const sz = Math.sin(angle) * 0.38;

      const spikeL = new THREE.Mesh(spikeGeo, spikeMat);
      spikeL.position.set(sx, 0.06, -sz - 0.05);
      spikeL.rotation.x = 0.2;
      leftJaw.add(spikeL);

      const spikeR = new THREE.Mesh(spikeGeo, spikeMat);
      spikeR.position.set(sx, 0.06, sz + 0.05);
      spikeR.rotation.x = -0.2;
      rightJaw.add(spikeR);
    }

    return { group, leftJaw, rightJaw };
  }

  private createSpikeStripMesh(): { group: THREE.Group } {
    const group = new THREE.Group();

    // Wood base beam (3.4m long, 0.5m wide)
    const beamGeo = new THREE.BoxGeometry(0.5, 0.08, 3.4);
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f,
      roughness: 0.85,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 0.04;
    beam.castShadow = true;
    beam.receiveShadow = true;
    group.add(beam);

    // Iron reinforcement brackets
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
    for (let i = -1.5; i <= 1.5; i += 0.75) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.09, 0.08), bracketMat);
      b.position.set(0, 0.045, i);
      group.add(b);
    }

    // Upward pointing steel spikes
    const spikeGeo = new THREE.ConeGeometry(0.035, 0.28, 6);
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x8a929a,
      metalness: 0.8,
      roughness: 0.3,
    });

    for (let z = -1.5; z <= 1.5; z += 0.25) {
      for (let x = -0.16; x <= 0.16; x += 0.16) {
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        const jitterX = (Math.random() - 0.5) * 0.04;
        const jitterZ = (Math.random() - 0.5) * 0.04;
        spike.position.set(x + jitterX, 0.18, z + jitterZ);
        spike.rotation.x = (Math.random() - 0.5) * 0.15;
        spike.rotation.z = (Math.random() - 0.5) * 0.15;
        spike.castShadow = true;
        group.add(spike);
      }
    }

    // Coiled concertina / barbed wire along the top
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9, roughness: 0.2 });
    const wireGeo = new THREE.TorusGeometry(0.18, 0.015, 6, 12);
    for (let z = -1.4; z <= 1.4; z += 0.45) {
      const coil = new THREE.Mesh(wireGeo, wireMat);
      coil.position.set(0, 0.2, z);
      coil.rotation.y = Math.PI / 2;
      group.add(coil);
    }

    return { group };
  }

  private createPipeBombMesh(): { group: THREE.Group; light: THREE.PointLight } {
    const group = new THREE.Group();

    // Cast iron pipe cylinder
    const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.42, 16);
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x3b4249,
      metalness: 0.8,
      roughness: 0.4,
    });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.y = 0.09;
    pipe.castShadow = true;
    group.add(pipe);

    // End screw caps
    const capGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.06, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x22262a, metalness: 0.85, roughness: 0.3 });
    const capL = new THREE.Mesh(capGeo, capMat);
    capL.rotation.z = Math.PI / 2;
    capL.position.set(-0.21, 0.09, 0);
    group.add(capL);

    const capR = new THREE.Mesh(capGeo, capMat);
    capR.rotation.z = Math.PI / 2;
    capR.position.set(0.21, 0.09, 0);
    group.add(capR);

    // Shrapnel nail bindings around pipe
    const ductTape = new THREE.Mesh(
      new THREE.CylinderGeometry(0.086, 0.086, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 })
    );
    ductTape.rotation.z = Math.PI / 2;
    ductTape.position.set(0, 0.09, 0);
    group.add(ductTape);

    // Blinking red detonation diode
    const diode = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff1100 })
    );
    diode.position.set(0, 0.18, 0);
    group.add(diode);

    const light = new THREE.PointLight(0xff1100, 1.2, 3);
    light.position.set(0, 0.22, 0);
    group.add(light);

    // Infrared tripwire line (3m laser)
    const tripwireGeo = new THREE.BufferGeometry();
    const tripPoints = new Float32Array([
      -1.7, 0.15, 0,
      1.7, 0.15, 0,
    ]);
    tripwireGeo.setAttribute('position', new THREE.BufferAttribute(tripPoints, 3));
    const tripwireMat = new THREE.LineBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.7,
    });
    const tripwire = new THREE.Line(tripwireGeo, tripwireMat);
    group.add(tripwire);

    return { group, light };
  }

  // --- PLACEMENT INTERACTION ---

  public startPlacement(type: TrapType): boolean {
    if ((this.inventory[type] || 0) <= 0) {
      return false;
    }
    this.activeTrapType = type;
    this.isPlacing = true;
    this.previewMesh.visible = true;
    return true;
  }

  public cancelPlacement() {
    this.isPlacing = false;
    this.activeTrapType = null;
    this.previewMesh.visible = false;
  }

  public updatePlacementPreview(camera: THREE.Camera, playerPos: THREE.Vector3) {
    if (!this.isPlacing || !this.activeTrapType) return;

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hitPoint = new THREE.Vector3();
    const intersects = this.raycaster.ray.intersectPlane(this.groundPlane, hitPoint);

    if (intersects) {
      const dist = hitPoint.distanceTo(playerPos);
      if (dist <= this.maxPlacementRange && dist >= 1.2) {
        this.previewPosition.copy(hitPoint);
        this.previewMesh.position.set(hitPoint.x, 0, hitPoint.z);
        this.previewRing.material = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
        });
        this.previewValid = true;
      } else {
        // Too far or too close
        this.previewRing.material = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
        });
        this.previewValid = false;
      }
    }
  }

  public confirmPlacement(playerPos: THREE.Vector3, playerYaw: number): boolean {
    if (!this.isPlacing || !this.activeTrapType || !this.previewValid) return false;

    const type = this.activeTrapType;
    if ((this.inventory[type] || 0) <= 0) {
      this.cancelPlacement();
      return false;
    }

    // Deduct inventory
    this.inventory[type]--;

    // Spawn trap in world
    this.deployTrap(type, this.previewPosition.clone(), playerYaw);

    soundManager.playTrapDeploy();

    // Check if player has more of this trap
    if (this.inventory[type] <= 0) {
      this.cancelPlacement();
    }

    return true;
  }

  public deployTrap(type: TrapType, position: THREE.Vector3, rotationY = 0): TrapInstance {
    let group: THREE.Group;
    let leftJaw: THREE.Mesh | undefined;
    let rightJaw: THREE.Mesh | undefined;
    let light: THREE.PointLight | undefined;
    let maxUses = 1;

    if (type === 'bear_trap') {
      const res = this.createBearTrapMesh();
      group = res.group;
      leftJaw = res.leftJaw;
      rightJaw = res.rightJaw;
      maxUses = 2 + this.extraTrapUses;
    } else if (type === 'spike_strip') {
      const res = this.createSpikeStripMesh();
      group = res.group;
      maxUses = 1 + this.extraTrapUses;
    } else {
      const res = this.createPipeBombMesh();
      group = res.group;
      light = res.light;
      maxUses = 1;
    }

    group.position.copy(position);
    group.rotation.y = rotationY;
    this.scene.add(group);

    const trap: TrapInstance = {
      id: `trap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      position: position.clone(),
      rotationY,
      group,
      state: 'armed',
      healthOrUses: maxUses,
      maxUses,
      durationTimer: type === 'spike_strip' ? 35 : undefined,
      leftJaw,
      rightJaw,
      light,
    };

    this.traps.push(trap);
    return trap;
  }

  // --- TRAP UPDATE LOOP ---

  public update(
    delta: number,
    zombieManager: ZombieManager,
    onTrapHit: (damage: number, isKill: boolean) => void,
    onExplosion: (pos: THREE.Vector3, radius: number, damage: number) => void
  ) {
    const aliveZombies = zombieManager.getAliveZombies();

    for (let i = this.traps.length - 1; i >= 0; i--) {
      const trap = this.traps[i];

      // Handle Spike Strip duration
      if (trap.durationTimer !== undefined) {
        trap.durationTimer -= delta;
        if (trap.durationTimer <= 0) {
          trap.state = 'destroyed';
        }
      }

      // Handle Pipe Bomb LED pulse
      if (trap.type === 'pipe_bomb' && trap.light) {
        trap.light.intensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.8;
      }

      if (trap.state === 'armed') {
        if (trap.type === 'bear_trap') {
          // Check for nearby zombies
          for (const z of aliveZombies) {
            const dist = trap.position.distanceTo(z.group.position);
            if (dist < 1.15) {
              // SNAP!
              trap.healthOrUses--;
              soundManager.playTrapSnap();
              this.particles.emitTrapSnap(trap.position);
              this.particles.emitBlood(z.group.position, new THREE.Vector3(0, 1, 0), 12);

              // Snap animation on jaws
              if (trap.leftJaw && trap.rightJaw) {
                trap.leftJaw.rotation.z = Math.PI * 0.6;
                trap.rightJaw.rotation.z = Math.PI * 0.4;
              }

              // Apply damage + pin root
              const damage = 260;
              z.data.pinnedTimer = 4.5 + this.extraPinDuration; // Immobilize zombie!
              const hitRes = zombieManager.damageZombie(z, damage, false);
              onTrapHit(damage, hitRes.killed);

              if (trap.healthOrUses <= 0) {
                trap.state = 'sprung';
                setTimeout(() => {
                  trap.state = 'destroyed';
                }, 8000);
              }
              break;
            }
          }
        } else if (trap.type === 'spike_strip') {
          // Continuous bleed & 65% slow
          for (const z of aliveZombies) {
            const dist = trap.position.distanceTo(z.group.position);
            if (dist < 2.1) {
              z.data.slowTimer = 1.0;
              z.data.slowFactor = 0.35; // 65% slow!

              // Tick bleed damage
              const bleedDmg = 40 * delta;
              const hitRes = zombieManager.damageZombie(z, bleedDmg, false);
              if (Math.random() < 0.2) {
                this.particles.emitBlood(z.group.position, new THREE.Vector3(0, 0.5, 0), 2);
              }
              if (hitRes.killed) {
                onTrapHit(40, true);
              }
            }
          }
        } else if (trap.type === 'pipe_bomb') {
          // Proximity tripwire detection
          for (const z of aliveZombies) {
            const dist = trap.position.distanceTo(z.group.position);
            if (dist < 1.8) {
              // DETONATE!
              trap.state = 'destroyed';
              onExplosion(
                trap.position,
                6.5 * this.explosiveMultiplier.radiusMult,
                420 * this.explosiveMultiplier.damageMult
              );
              break;
            }
          }
        }
      }

      // Cleanup destroyed traps
      if (trap.state === 'destroyed') {
        this.scene.remove(trap.group);
        this.traps.splice(i, 1);
      }
    }
  }

  public addTrapToInventory(type: TrapType, amount = 1) {
    this.inventory[type] = (this.inventory[type] || 0) + amount;
  }

  public reset() {
    for (const trap of this.traps) {
      this.scene.remove(trap.group);
    }
    this.traps = [];
    this.cancelPlacement();
  }
}
