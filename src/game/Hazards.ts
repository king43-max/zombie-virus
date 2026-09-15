import * as THREE from 'three';
import { ParticleSystem } from './Particles';
import { soundManager } from '../audio/SoundManager';
import { ZombieInstance } from './Zombies';

export type HazardType = 'barrel' | 'electric_panel';

export interface HazardInstance {
  id: string;
  type: HazardType;
  position: THREE.Vector3;
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  health: number;
  maxHealth: number;
  state: 'ready' | 'ignited' | 'active' | 'cooldown' | 'destroyed';
  activeTimer: number;
  cooldownTimer: number;
  light?: THREE.PointLight;
  burnPuddleMesh?: THREE.Mesh;
  conductivePuddleMesh?: THREE.Mesh;
  label?: string;
  promptLabel?: string;
  initialPos: THREE.Vector3;
  initialRot?: THREE.Euler;
}

export interface ResidualFireZone {
  position: THREE.Vector3;
  radius: number;
  remainingTime: number;
  light: THREE.PointLight;
  puddleMesh: THREE.Mesh;
}

export class HazardManager {
  private scene: THREE.Scene;
  private particles: ParticleSystem;
  public hazards: HazardInstance[] = [];
  public hitMeshes: THREE.Mesh[] = [];
  private residualFires: ResidualFireZone[] = [];
  private scratchVec = new THREE.Vector3();
  private flashLight: THREE.PointLight;

  constructor(scene: THREE.Scene, particles: ParticleSystem) {
    this.scene = scene;
    this.particles = particles;

    // Transient flash light for detonations
    this.flashLight = new THREE.PointLight(0xff7722, 0, 22);
    this.scene.add(this.flashLight);

    this.spawnDefaultHazards();
  }

  // --- 3D MESH GENERATION ---

  private createBarrelMesh(): { group: THREE.Group; hitMesh: THREE.Mesh; light: THREE.PointLight } {
    const group = new THREE.Group();

    // Red industrial fuel drum
    const drumGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.25, 20);
    const drumMat = new THREE.MeshStandardMaterial({
      color: 0xd32f2f,
      metalness: 0.65,
      roughness: 0.45,
    });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.y = 0.625;
    drum.castShadow = true;
    drum.receiveShadow = true;
    group.add(drum);

    // Ribbed reinforcement rings (dark carbon steel)
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x1f2326, metalness: 0.8, roughness: 0.3 });
    const ringGeo = new THREE.TorusGeometry(0.495, 0.035, 8, 20);

    const ringTop = new THREE.Mesh(ringGeo, ringMat);
    ringTop.rotation.x = Math.PI / 2;
    ringTop.position.y = 0.95;
    group.add(ringTop);

    const ringMid = new THREE.Mesh(ringGeo, ringMat);
    ringMid.rotation.x = Math.PI / 2;
    ringMid.position.y = 0.625;
    group.add(ringMid);

    const ringBot = new THREE.Mesh(ringGeo, ringMat);
    ringBot.rotation.x = Math.PI / 2;
    ringBot.position.y = 0.3;
    group.add(ringBot);

    // Hazard Caution Band (Yellow/Black striped center band)
    const bandGeo = new THREE.CylinderGeometry(0.49, 0.49, 0.28, 20);
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.5,
      emissive: 0x443300,
      emissiveIntensity: 0.4,
    });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = 0.625;
    group.add(band);

    // Hazard stencil decals (small black diamonds)
    const decalMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), decalMat);
      decal.position.set(Math.sin(angle) * 0.496, 0.625, Math.cos(angle) * 0.496);
      decal.rotation.y = angle;
      decal.rotation.z = Math.PI / 4;
      group.add(decal);
    }

    // Top drum cap & bung plug
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 })
    );
    cap.position.set(0.2, 1.26, 0.1);
    group.add(cap);

    // Warning blinking LED indicator on top
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xff1100,
      emissive: 0xff2200,
      emissiveIntensity: 1.0,
    });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), ledMat);
    led.position.set(-0.2, 1.27, -0.1);
    group.add(led);

    const warnLight = new THREE.PointLight(0xff2200, 0.4, 3.5);
    warnLight.position.set(0, 1.3, 0);
    group.add(warnLight);

    return { group, hitMesh: drum, light: warnLight };
  }

  private createElectricPanelMesh(): {
    group: THREE.Group;
    hitMesh: THREE.Mesh;
    light: THREE.PointLight;
    puddle: THREE.Mesh;
  } {
    const group = new THREE.Group();

    // Electrical junction enclosure box
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x272c33,
      metalness: 0.7,
      roughness: 0.4,
    });
    const boxGeo = new THREE.BoxGeometry(0.9, 1.2, 0.4);
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 1.6;
    box.castShadow = true;
    group.add(box);

    // Front access door
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x333b45,
      metalness: 0.8,
      roughness: 0.35,
    });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.1, 0.04), doorMat);
    door.position.set(0, 1.6, 0.21);
    group.add(door);

    // High Voltage Warning Plate (Caution Yellow)
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xffd600,
      roughness: 0.4,
      emissive: 0x664400,
      emissiveIntensity: 0.3,
    });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), plateMat);
    plate.position.set(0, 1.7, 0.235);
    group.add(plate);

    // Lightning bolt symbol on plate
    const boltMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const boltBar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.22), boltMat);
    boltBar1.position.set(-0.04, 1.75, 0.24);
    boltBar1.rotation.z = -0.4;
    group.add(boltBar1);

    const boltBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.22), boltMat);
    boltBar2.position.set(0.04, 1.65, 0.24);
    boltBar2.rotation.z = -0.4;
    group.add(boltBar2);

    // Conduit pipes running down
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x1a1d20, metalness: 0.85, roughness: 0.2 });
    const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.6, 12), pipeMat);
    pipe1.position.set(-0.25, 0.8, 0.05);
    group.add(pipe1);

    const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.6, 12), pipeMat);
    pipe2.position.set(0.25, 0.8, 0.05);
    group.add(pipe2);

    // High-voltage sparking contact insulator nodes
    const sparkNodeMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
    const node1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), sparkNodeMat);
    node1.position.set(-0.15, 1.25, 0.22);
    group.add(node1);

    const node2 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), sparkNodeMat);
    node2.position.set(0.15, 1.25, 0.22);
    group.add(node2);

    // Arc wire connecting the two nodes
    const arcWire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff })
    );
    arcWire.rotation.z = Math.PI / 2;
    arcWire.position.set(0, 1.25, 0.22);
    group.add(arcWire);

    // Cyan / Electric Blue Strobe Light
    const electricLight = new THREE.PointLight(0x00f5ff, 1.2, 8);
    electricLight.position.set(0, 1.6, 0.4);
    group.add(electricLight);

    // Electrified floor conductive grating / puddle
    const puddleGeo = new THREE.CircleGeometry(5.2, 24);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x142028,
      metalness: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: 0.75,
    });
    const puddle = new THREE.Mesh(puddleGeo, puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(0, 0.02, 1.2);
    puddle.receiveShadow = true;
    group.add(puddle);

    return { group, hitMesh: box, light: electricLight, puddle };
  }

  // --- SPAWN STRATEGY & MAP PLACEMENT ---

  private spawnDefaultHazards() {
    // 1. Red Explosive Barrels placed at tactical choke points and courtyards
    const barrelLocations: { id: string; x: number; z: number }[] = [
      { id: 'barrel_south_choke_1', x: 4.5, z: 21.0 },
      { id: 'barrel_south_choke_2', x: 6.2, z: 21.8 },
      { id: 'barrel_west_alley_1', x: -16.5, z: -8.0 },
      { id: 'barrel_west_alley_2', x: -18.0, z: -7.2 },
      { id: 'barrel_east_alley_1', x: 17.5, z: -14.5 },
      { id: 'barrel_north_approach_1', x: -7.5, z: -37.5 },
      { id: 'barrel_north_approach_2', x: 7.5, z: -37.5 },
      { id: 'barrel_sw_courtyard_1', x: -24.0, z: 19.5 },
      { id: 'barrel_se_street_1', x: 23.5, z: 22.0 },
      { id: 'barrel_center_plaza_1', x: -3.5, z: 4.5 },
    ];

    barrelLocations.forEach((loc) => {
      const { group, hitMesh, light } = this.createBarrelMesh();
      const pos = new THREE.Vector3(loc.x, 0, loc.z);
      group.position.copy(pos);
      this.scene.add(group);

      const inst: HazardInstance = {
        id: loc.id,
        type: 'barrel',
        position: pos,
        group,
        hitMesh,
        health: 25,
        maxHealth: 25,
        state: 'ready',
        activeTimer: 0,
        cooldownTimer: 0,
        light,
        initialPos: pos.clone(),
      };

      (hitMesh as unknown as { hazardRef: HazardInstance }).hazardRef = inst;
      this.hazards.push(inst);
      this.hitMeshes.push(hitMesh);
    });

    // 2. Flickering High-Voltage Electric Panels placed on major building walls
    const electricLocations: { id: string; x: number; z: number; rotY: number; label: string }[] = [
      {
        id: 'panel_armory_wall',
        x: -21.8,
        z: -18.0,
        rotY: Math.PI / 2,
        label: 'Armory Sector Grid Breaker',
      },
      {
        id: 'panel_hospital_wall',
        x: 21.8,
        z: -16.0,
        rotY: -Math.PI / 2,
        label: 'Substation Transformer Relay',
      },
      {
        id: 'panel_plaza_junction',
        x: -9.5,
        z: 8.5,
        rotY: 0,
        label: 'Street High-Voltage Terminal',
      },
    ];

    electricLocations.forEach((loc) => {
      const { group, hitMesh, light, puddle } = this.createElectricPanelMesh();
      const pos = new THREE.Vector3(loc.x, 0, loc.z);
      group.position.copy(pos);
      group.rotation.y = loc.rotY;
      this.scene.add(group);

      const inst: HazardInstance = {
        id: loc.id,
        type: 'electric_panel',
        position: pos,
        group,
        hitMesh,
        health: 1,
        maxHealth: 1,
        state: 'ready',
        activeTimer: 0,
        cooldownTimer: 0,
        light,
        conductivePuddleMesh: puddle,
        label: loc.label,
        promptLabel: `[E] Overload ${loc.label}`,
        initialPos: pos.clone(),
        initialRot: group.rotation.clone(),
      };

      (hitMesh as unknown as { hazardRef: HazardInstance }).hazardRef = inst;
      this.hazards.push(inst);
      this.hitMeshes.push(hitMesh);
    });
  }

  // --- TRIGGERING HAZARDS ---

  public damageHazard(
    inst: HazardInstance,
    damage: number,
    hitPoint: THREE.Vector3,
    onDamageZombie: (zombie: ZombieInstance, damage: number, isHead: boolean) => void,
    onPlayerDamage: (damage: number) => void
  ) {
    if (inst.type === 'barrel') {
      if (inst.state !== 'ready') return;
      inst.health -= damage;
      this.particles.emitSparks(hitPoint, new THREE.Vector3(0, 1, 0), 8);

      if (inst.health <= 0) {
        this.detonateBarrel(inst, onDamageZombie, onPlayerDamage);
      }
    } else if (inst.type === 'electric_panel') {
      if (inst.state === 'ready') {
        this.triggerElectricPanel(inst);
      }
    }
  }

  public triggerInteractiveHazard(inst: HazardInstance): boolean {
    if (inst.type === 'electric_panel' && inst.state === 'ready') {
      this.triggerElectricPanel(inst);
      return true;
    }
    return false;
  }

  private detonateBarrel(
    inst: HazardInstance,
    onDamageZombie: (zombie: ZombieInstance, damage: number, isHead: boolean) => void,
    onPlayerDamage: (damage: number) => void
  ) {
    if (inst.state === 'destroyed') return;
    inst.state = 'destroyed';

    const blastPos = inst.position.clone().add(new THREE.Vector3(0, 0.6, 0));

    // Audio & Particles
    soundManager.playExplosion();
    this.particles.emitExplosion(blastPos, 28);

    // Flash light
    this.flashLight.position.copy(blastPos);
    this.flashLight.intensity = 6.0;

    // Visual: remove barrel model, spawn charred flattened remains
    this.scene.remove(inst.group);

    const charredMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
    const charredDebris = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.6, 0.2, 12),
      charredMat
    );
    charredDebris.position.set(inst.position.x, 0.1, inst.position.z);
    this.scene.add(charredDebris);
    inst.burnPuddleMesh = charredDebris;

    // Create residual burning ground pool (scorch mark with fire)
    const scorchGeo = new THREE.CircleGeometry(3.5, 20);
    const scorchMat = new THREE.MeshBasicMaterial({
      color: 0x181008,
      transparent: true,
      opacity: 0.85,
    });
    const scorch = new THREE.Mesh(scorchGeo, scorchMat);
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.set(inst.position.x, 0.02, inst.position.z);
    this.scene.add(scorch);

    const fireLight = new THREE.PointLight(0xff5500, 2.0, 8);
    fireLight.position.set(inst.position.x, 0.6, inst.position.z);
    this.scene.add(fireLight);

    this.residualFires.push({
      position: inst.position.clone(),
      radius: 3.6,
      remainingTime: 5.5,
      light: fireLight,
      puddleMesh: scorch,
    });

    // 1. Damage Zombies in blast radius (7.5 meters)
    const BLAST_RADIUS = 7.5;
    const zombies = (window as unknown as { __aliveZombies?: ZombieInstance[] }).__aliveZombies || [];
    for (let i = 0; i < zombies.length; i++) {
      const z = zombies[i];
      if (z.data.isDead) continue;
      const d = z.group.position.distanceTo(inst.position);
      if (d <= BLAST_RADIUS) {
        // Falloff damage: 420 at center, 160 at edge
        const falloff = 1 - d / BLAST_RADIUS;
        const blastDmg = Math.round(160 + falloff * 260);

        // Radial knockback impulse
        const knockDir = z.group.position.clone().sub(inst.position).normalize();
        z.group.position.addScaledVector(knockDir, Math.min(2.5, falloff * 3.5));

        onDamageZombie(z, blastDmg, false);
      }
    }

    // 2. Chain reaction: Detonate other barrels in blast radius!
    for (let i = 0; i < this.hazards.length; i++) {
      const other = this.hazards[i];
      if (other !== inst && other.type === 'barrel' && other.state === 'ready') {
        const d = other.position.distanceTo(inst.position);
        if (d <= BLAST_RADIUS) {
          other.state = 'ignited';
          // Cascade explosion with short organic delay
          setTimeout(() => {
            if (other.state !== 'destroyed') {
              this.detonateBarrel(other, onDamageZombie, onPlayerDamage);
            }
          }, 110 + Math.random() * 80);
        }
      }
    }

    // 3. Player Proximity Damage
    const playerPos = (window as unknown as { __playerPos?: THREE.Vector3 }).__playerPos;
    if (playerPos) {
      const dPlayer = playerPos.distanceTo(inst.position);
      if (dPlayer < 6.5) {
        const pDmg = Math.round((1 - dPlayer / 6.5) * 35);
        if (pDmg > 0) {
          onPlayerDamage(pDmg);
        }
      }
    }
  }

  private triggerElectricPanel(inst: HazardInstance) {
    inst.state = 'active';
    inst.activeTimer = 6.0; // 6 seconds lethal electric shock duration

    soundManager.playHazardTrip();
    soundManager.playElectricArc();

    if (inst.light) {
      inst.light.intensity = 3.5;
      inst.light.color.setHex(0x00f5ff);
    }
    if (inst.conductivePuddleMesh) {
      const mat = inst.conductivePuddleMesh.material as THREE.MeshStandardMaterial;
      mat.emissive = new THREE.Color(0x00a2ff);
      mat.emissiveIntensity = 0.8;
    }
  }

  // --- MAIN ENGINE TICK UPDATE ---

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    aliveZombies: ZombieInstance[],
    onDamageZombie: (zombie: ZombieInstance, damage: number, isHead: boolean) => void,
    onPlayerDamage: (damage: number) => void
  ) {
    // Expose for explosion queries
    (window as unknown as { __aliveZombies?: ZombieInstance[] }).__aliveZombies = aliveZombies;
    (window as unknown as { __playerPos?: THREE.Vector3 }).__playerPos = playerPos;

    // Decay explosion flash light
    if (this.flashLight.intensity > 0) {
      this.flashLight.intensity = Math.max(0, this.flashLight.intensity - delta * 14);
    }

    const now = performance.now() / 1000;

    // 1. Update Hazards State Machine
    for (let i = 0; i < this.hazards.length; i++) {
      const h = this.hazards[i];

      if (h.type === 'barrel' && h.state === 'ready') {
        // Idle subtle warning pulse
        if (h.light) {
          h.light.intensity = 0.2 + Math.abs(Math.sin(now * 3 + i)) * 0.4;
        }
      } else if (h.type === 'electric_panel') {
        if (h.state === 'ready') {
          // Subtle intermittent flicker on the warning panel
          if (h.light) {
            const flicker = Math.random() > 0.85 ? 1.6 : 0.4;
            h.light.intensity = flicker;
          }
        } else if (h.state === 'active') {
          h.activeTimer -= delta;

          // Frantic crackling strobe
          if (h.light) {
            h.light.intensity = 2.0 + Math.random() * 3.5;
            h.light.color.setHex(Math.random() > 0.3 ? 0x00f5ff : 0x77eeff);
          }

          // Electric zap audio pulses
          if (Math.random() < 0.28) {
            soundManager.playElectricArc();
          }

          // Emit electric arcs
          const arcOrigin = h.position.clone().add(new THREE.Vector3(0, 1.2, 0.3));
          this.particles.emitElectricShock(arcOrigin, 4);

          // Lethal Shock Zone: Damage and stun zombies within 6.5m radius
          const SHOCK_RADIUS = 6.5;
          for (let zIdx = 0; zIdx < aliveZombies.length; zIdx++) {
            const z = aliveZombies[zIdx];
            if (z.data.isDead) continue;
            const dist = z.group.position.distanceTo(h.position);
            if (dist <= SHOCK_RADIUS) {
              // Convulse / slow zombie motion
              z.group.position.y = 0.05 + Math.sin(now * 25) * 0.08;
              // Electric shock damage tick
              const shockDmg = Math.round(52 * delta);
              if (shockDmg > 0) {
                onDamageZombie(z, Math.max(8, shockDmg), false);
              }
              this.particles.emitElectricShock(z.group.position, 1);
            }
          }

          // Check if player stands directly on the electrified conductive puddle!
          const distPlayer = playerPos.distanceTo(h.position);
          if (distPlayer < 5.0) {
            onPlayerDamage(Math.round(14 * delta));
          }

          if (h.activeTimer <= 0) {
            // Tripped breaker enters cooldown
            h.state = 'cooldown';
            h.cooldownTimer = 20.0;
            if (h.light) {
              h.light.color.setHex(0xffaa00);
              h.light.intensity = 0.3;
            }
            if (h.conductivePuddleMesh) {
              const mat = h.conductivePuddleMesh.material as THREE.MeshStandardMaterial;
              mat.emissive.setHex(0x000000);
            }
          }
        } else if (h.state === 'cooldown') {
          h.cooldownTimer -= delta;
          if (h.light) {
            h.light.intensity = Math.sin(now * 2) > 0 ? 0.3 : 0.05;
          }
          if (h.cooldownTimer <= 0) {
            // Breaker reset and ready again!
            h.state = 'ready';
            if (h.light) {
              h.light.color.setHex(0x00f5ff);
              h.light.intensity = 0.6;
            }
          }
        }
      }
    }

    // 2. Update Residual Burning Fire Pools
    for (let f = this.residualFires.length - 1; f >= 0; f--) {
      const fire = this.residualFires[f];
      fire.remainingTime -= delta;

      // Flame flicker
      fire.light.intensity = 1.0 + Math.sin(now * 12 + f) * 0.5 + Math.random() * 0.4;
      this.particles.emitResidualFire(fire.position);

      // Burn zombies that walk over the pool
      for (let zIdx = 0; zIdx < aliveZombies.length; zIdx++) {
        const z = aliveZombies[zIdx];
        if (z.data.isDead) continue;
        const d = z.group.position.distanceTo(fire.position);
        if (d <= fire.radius) {
          const burnDmg = Math.round(42 * delta);
          if (burnDmg > 0) {
            onDamageZombie(z, Math.max(5, burnDmg), false);
          }
        }
      }

      // Burn player if standing in fire
      if (playerPos.distanceTo(fire.position) <= fire.radius) {
        onPlayerDamage(Math.round(18 * delta));
      }

      if (fire.remainingTime <= 0) {
        this.scene.remove(fire.light);
        this.scene.remove(fire.puddleMesh);
        this.residualFires.splice(f, 1);
      }
    }
  }

  // --- RECHARGE / RESPAWN FOR WAVES & RESTARTS ---

  public resetForWave() {
    // Reset panels and restore spent barrels
    for (let i = 0; i < this.hazards.length; i++) {
      const h = this.hazards[i];
      if (h.type === 'electric_panel') {
        h.state = 'ready';
        h.activeTimer = 0;
        h.cooldownTimer = 0;
        if (h.light) {
          h.light.color.setHex(0x00f5ff);
          h.light.intensity = 0.8;
        }
        if (h.conductivePuddleMesh) {
          const mat = h.conductivePuddleMesh.material as THREE.MeshStandardMaterial;
          mat.emissive.setHex(0x000000);
        }
      } else if (h.type === 'barrel' && h.state === 'destroyed') {
        // Respawn barrel for tactical freshness in new wave
        if (h.burnPuddleMesh) {
          this.scene.remove(h.burnPuddleMesh);
          h.burnPuddleMesh = undefined;
        }
        h.state = 'ready';
        h.health = h.maxHealth;
        h.group.position.copy(h.initialPos);
        this.scene.add(h.group);
      }
    }

    // Clear residual fires
    this.residualFires.forEach((rf) => {
      this.scene.remove(rf.light);
      this.scene.remove(rf.puddleMesh);
    });
    this.residualFires = [];
  }

  public clearAll() {
    this.hazards.forEach((h) => {
      this.scene.remove(h.group);
      if (h.burnPuddleMesh) {
        this.scene.remove(h.burnPuddleMesh);
      }
    });
    this.hazards = [];
    this.hitMeshes = [];

    this.residualFires.forEach((rf) => {
      this.scene.remove(rf.light);
      this.scene.remove(rf.puddleMesh);
    });
    this.residualFires = [];

    this.scene.remove(this.flashLight);
  }
}
