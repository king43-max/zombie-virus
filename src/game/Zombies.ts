import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager';
import { ZombieData, ZombieType } from '../types/game';
import { WorldObstacle } from './Environment';
import { ParticleSystem } from './Particles';

// Reusable scratch objects to eliminate GC pauses during zombie simulation
const _tempBox = new THREE.Box3();
const _tempBoxX = new THREE.Box3();
const _tempBoxZ = new THREE.Box3();
const _tempCenter = new THREE.Vector3();
const _tempSize = new THREE.Vector3(0.8, 1.8, 0.8);

export interface ZombieInstance {
  data: ZombieData;
  group: THREE.Group;
  headMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
  animationTime: number;
  isAttacking: boolean;
  attackAnimProgress: number;
  hitFlashTime: number;
}

export class ZombieManager {
  private scene: THREE.Scene;
  private zombies: ZombieInstance[] = [];
  private obstacles: WorldObstacle[] = [];
  private particles: ParticleSystem;

  // Materials cache
  private skinWalkerMat = new THREE.MeshStandardMaterial({ color: 0x475846, roughness: 0.85 });
  private clothesWalkerMat = new THREE.MeshStandardMaterial({ color: 0x2d3330, roughness: 0.9 });
  private skinRunnerMat = new THREE.MeshStandardMaterial({ color: 0x6e5246, roughness: 0.8 });
  private clothesRunnerMat = new THREE.MeshStandardMaterial({ color: 0x3d2b27, roughness: 0.9 });
  private skinBruteMat = new THREE.MeshStandardMaterial({ color: 0x3d4740, roughness: 0.95 });
  private eyesGlowMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

  constructor(scene: THREE.Scene, particles: ParticleSystem) {
    this.scene = scene;
    this.particles = particles;
  }

  public setObstacles(obstacles: WorldObstacle[]) {
    this.obstacles = obstacles;
  }

  public spawnZombie(type: ZombieType, position: THREE.Vector3): ZombieInstance {
    const group = new THREE.Group();
    group.position.copy(position);

    let maxHealth = 100;
    let speed = 2.4;
    let damage = 14;
    let scale = 1.0;

    let skinMat = this.skinWalkerMat.clone();
    let clothesMat = this.clothesWalkerMat.clone();

    if (type === 'runner') {
      maxHealth = 65;
      speed = 4.8;
      damage = 10;
      scale = 0.92;
      skinMat = this.skinRunnerMat.clone();
      clothesMat = this.clothesRunnerMat.clone();
    } else if (type === 'brute') {
      maxHealth = 320;
      speed = 1.8;
      damage = 32;
      scale = 1.45;
      skinMat = this.skinBruteMat.clone();
      clothesMat = this.clothesWalkerMat.clone();
    }

    const materials = [skinMat, clothesMat];

    // --- ARTICULATED HIERARCHY ---
    // Root Torso
    const torsoHeight = 0.75 * scale;
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.48 * scale, torsoHeight, 0.28 * scale),
      clothesMat
    );
    torso.position.y = 1.15 * scale;
    torso.castShadow = true;
    torso.receiveShadow = true;
    (torso as unknown as { isZombieBody: boolean }).isZombieBody = true;
    group.add(torso);

    // Head (Critical hit zone)
    const headSize = 0.32 * scale;
    const head = new THREE.Mesh(new THREE.BoxGeometry(headSize, headSize, headSize), skinMat);
    head.position.y = 0.55 * scale;
    head.castShadow = true;
    (head as unknown as { isZombieHead: boolean }).isZombieHead = true;
    torso.add(head);

    // Glowing red eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.04 * scale, 0.05 * scale), this.eyesGlowMat);
    eyeL.position.set(-0.08 * scale, 0.04 * scale, 0.16 * scale);
    head.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.04 * scale, 0.05 * scale), this.eyesGlowMat);
    eyeR.position.set(0.08 * scale, 0.04 * scale, 0.16 * scale);
    head.add(eyeR);

    // Left Arm Pivot
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.32 * scale, 0.3 * scale, 0);
    const leftArmMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.14 * scale, 0.65 * scale, 0.14 * scale),
      skinMat
    );
    leftArmMesh.position.y = -0.28 * scale;
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    torso.add(leftArm);

    // Right Arm Pivot
    const rightArm = new THREE.Group();
    rightArm.position.set(0.32 * scale, 0.3 * scale, 0);
    const rightArmMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.14 * scale, 0.65 * scale, 0.14 * scale),
      skinMat
    );
    rightArmMesh.position.y = -0.28 * scale;
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);
    torso.add(rightArm);

    // Left Leg Pivot
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.15 * scale, 0.75 * scale, 0);
    const leftLegMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.16 * scale, 0.75 * scale, 0.16 * scale),
      clothesMat
    );
    leftLegMesh.position.y = -0.36 * scale;
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);
    group.add(leftLeg);

    // Right Leg Pivot
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.15 * scale, 0.75 * scale, 0);
    const rightLegMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.16 * scale, 0.75 * scale, 0.16 * scale),
      clothesMat
    );
    rightLegMesh.position.y = -0.36 * scale;
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);
    group.add(rightLeg);

    this.scene.add(group);

    const instance: ZombieInstance = {
      data: {
        id: `zombie_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type,
        x: position.x,
        y: position.y,
        z: position.z,
        health: maxHealth,
        maxHealth,
        speed,
        damage,
        attackCooldown: 1.2,
        lastAttackTime: 0,
        meshIndex: this.zombies.length,
        isDead: false,
        deathTime: 0,
      },
      group,
      headMesh: head,
      bodyMesh: torso,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      materials,
      animationTime: Math.random() * 10,
      isAttacking: false,
      attackAnimProgress: 0,
      hitFlashTime: 0,
    };

    // Store reference for raycasting
    (head as unknown as { zombieRef: ZombieInstance }).zombieRef = instance;
    (torso as unknown as { zombieRef: ZombieInstance }).zombieRef = instance;

    this.zombies.push(instance);

    // Audio groan on spawn chance
    if (Math.random() < 0.4) {
      soundManager.playZombieGroan(type);
    }

    return instance;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    onPlayerDamage: (damage: number) => void
  ) {
    const now = performance.now() / 1000;

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];

      // Dead zombie animation & despawn
      if (z.data.isDead) {
        z.data.deathTime += delta;
        // Fall over backward
        z.group.rotation.x = THREE.MathUtils.lerp(z.group.rotation.x, -Math.PI / 2, delta * 6);
        z.group.position.y = THREE.MathUtils.lerp(z.group.position.y, 0.1, delta * 4);

        if (z.data.deathTime > 2.5) {
          // Despawn
          this.scene.remove(z.group);
          this.zombies.splice(i, 1);
        }
        continue;
      }

      // Hit flash restore
      if (z.hitFlashTime > 0) {
        z.hitFlashTime -= delta;
        if (z.hitFlashTime <= 0) {
          z.materials.forEach((mat) => {
            mat.emissive.set(0x000000);
          });
        }
      }

      // Status Effects: Burning & Shock DOT
      if (z.data.burningTimer && z.data.burningTimer > 0) {
        z.data.burningTimer -= delta;
        const burnDmg = 25 * delta;
        z.data.health -= burnDmg;
        if (Math.random() < 0.25) {
          this.particles.emitFlameSpray(z.group.position, new THREE.Vector3(0, 1, 0), 1);
        }
        if (z.data.health <= 0 && !z.data.isDead) {
          z.data.isDead = true;
          z.data.deathTime = 0;
          continue;
        }
      }

      if (z.data.shockTimer && z.data.shockTimer > 0) {
        z.data.shockTimer -= delta;
        const shockDmg = 35 * delta;
        z.data.health -= shockDmg;
        if (Math.random() < 0.25) {
          this.particles.emitSparks(z.group.position, new THREE.Vector3(0, 1, 0), 2);
        }
        if (z.data.health <= 0 && !z.data.isDead) {
          z.data.isDead = true;
          z.data.deathTime = 0;
          continue;
        }
      }

      // Distance to player
      const dx = playerPos.x - z.group.position.x;
      const dz = playerPos.z - z.group.position.z;
      const distToPlayer = Math.sqrt(dx * dx + dz * dz);

      // Look at player (Y-axis only) with smooth shortest-arc interpolation
      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = targetAngle - z.group.rotation.y;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      z.group.rotation.y += angleDiff * Math.min(1, delta * 6.5);

      // Periodic random groans
      if (Math.random() < 0.003 && distToPlayer < 25) {
        soundManager.playZombieGroan(z.data.type);
      }

      // Attack player if in close range
      const attackRange = z.data.type === 'brute' ? 2.2 : 1.7;
      if (distToPlayer <= attackRange) {
        if (now - z.data.lastAttackTime > z.data.attackCooldown) {
          z.data.lastAttackTime = now;
          z.isAttacking = true;
          z.attackAnimProgress = 0;
          soundManager.playZombieAttack();
          onPlayerDamage(z.data.damage);
        }
      }

      // Attack Animation
      if (z.isAttacking) {
        z.attackAnimProgress += delta * 4;
        const swing = Math.sin(z.attackAnimProgress * Math.PI);
        z.leftArm.rotation.x = -Math.PI / 2 - swing * 0.8;
        z.rightArm.rotation.x = -Math.PI / 2 - swing * 0.8;

        if (z.attackAnimProgress >= 1) {
          z.isAttacking = false;
        }
      }

      // Effective Speed (handles Bear Trap pins and Spike Strip slows)
      let effectiveSpeed = z.data.speed;
      if (z.data.pinnedTimer && z.data.pinnedTimer > 0) {
        z.data.pinnedTimer -= delta;
        effectiveSpeed = 0; // Pinned in bear trap!
      } else if (z.data.slowTimer && z.data.slowTimer > 0) {
        z.data.slowTimer -= delta;
        effectiveSpeed *= (z.data.slowFactor || 0.35);
      }

      // Movement towards player (if not dead and not currently locked in heavy swing)
      if (distToPlayer > attackRange * 0.8 && effectiveSpeed > 0) {
        const invDist = 1 / distToPlayer;
        let moveDirX = dx * invDist;
        let moveDirZ = dz * invDist;

        // Flocking / separation from other zombies to avoid stacking
        let sepX = 0;
        let sepZ = 0;
        for (let j = 0; j < this.zombies.length; j++) {
          if (i === j) continue;
          const other = this.zombies[j];
          if (other.data.isDead) continue;
          const odx = z.group.position.x - other.group.position.x;
          const odz = z.group.position.z - other.group.position.z;
          const odistSq = odx * odx + odz * odz;
          if (odistSq < 1.44 && odistSq > 0.0001) {
            const odist = Math.sqrt(odistSq);
            const factor = (1.2 - odist) / odist;
            sepX += odx * factor;
            sepZ += odz * factor;
          }
        }

        const totalX = moveDirX + sepX * 0.7;
        const totalZ = moveDirZ + sepZ * 0.7;
        const totalLen = Math.sqrt(totalX * totalX + totalZ * totalZ) || 1;
        const normMoveX = totalX / totalLen;
        const normMoveZ = totalZ / totalLen;

        const stepDist = effectiveSpeed * delta;
        const newX = z.group.position.x + normMoveX * stepDist;
        const newZ = z.group.position.z + normMoveZ * stepDist;

        // Collision check against world obstacles using scratch boxes
        _tempCenter.set(newX, 1, newZ);
        _tempBox.setFromCenterAndSize(_tempCenter, _tempSize);

        let collides = false;
        for (let o = 0; o < this.obstacles.length; o++) {
          if (this.obstacles[o].box.intersectsBox(_tempBox)) {
            collides = true;
            break;
          }
        }

        if (!collides) {
          z.group.position.x = newX;
          z.group.position.z = newZ;
        } else {
          // Slide along wall X
          const slideX = z.group.position.x + normMoveX * stepDist;
          _tempCenter.set(slideX, 1, z.group.position.z);
          _tempBoxX.setFromCenterAndSize(_tempCenter, _tempSize);
          let collidesX = false;
          for (let o = 0; o < this.obstacles.length; o++) {
            if (this.obstacles[o].box.intersectsBox(_tempBoxX)) {
              collidesX = true;
              break;
            }
          }
          if (!collidesX) {
            z.group.position.x = slideX;
          }

          // Slide along wall Z
          const slideZ = z.group.position.z + normMoveZ * stepDist;
          _tempCenter.set(z.group.position.x, 1, slideZ);
          _tempBoxZ.setFromCenterAndSize(_tempCenter, _tempSize);
          let collidesZ = false;
          for (let o = 0; o < this.obstacles.length; o++) {
            if (this.obstacles[o].box.intersectsBox(_tempBoxZ)) {
              collidesZ = true;
              break;
            }
          }
          if (!collidesZ) {
            z.group.position.z = slideZ;
          }
        }

        // Procedural Walk Cycle Animation
        z.animationTime += delta * z.data.speed * 2.8;
        const legSwing = Math.sin(z.animationTime) * 0.55;
        z.leftLeg.rotation.x = legSwing;
        z.rightLeg.rotation.x = -legSwing;

        if (!z.isAttacking) {
          // Zombie classic outstretched shambling arms
          const armBob = Math.sin(z.animationTime) * 0.2;
          z.leftArm.rotation.x = -Math.PI / 2.3 + armBob;
          z.rightArm.rotation.x = -Math.PI / 2.2 - armBob;
        }

        // Shambling torso tilt
        z.bodyMesh.rotation.z = Math.sin(z.animationTime * 0.5) * 0.08;
      }
    }
  }

  public damageZombie(
    zombie: ZombieInstance,
    damage: number,
    isHeadshot: boolean,
    hitPoint?: THREE.Vector3,
    hitNormal?: THREE.Vector3
  ): { killed: boolean; points: number; cash: number; isHeadshot: boolean } {
    if (zombie.data.isDead) {
      return { killed: false, points: 0, cash: 0, isHeadshot: false };
    }

    zombie.data.health -= damage;
    const pt = hitPoint || zombie.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const nrm = hitNormal || new THREE.Vector3(0, 1, 0);
    this.particles.emitBlood(pt, nrm, isHeadshot ? 16 : 8);

    // Hit flash red
    zombie.hitFlashTime = 0.12;
    zombie.materials.forEach((mat) => {
      mat.emissive.set(0xaa2200);
    });

    if (zombie.data.health <= 0) {
      zombie.data.isDead = true;
      zombie.data.deathTime = 0;

      let basePoints = 100;
      let baseCash = 50;

      if (zombie.data.type === 'runner') {
        basePoints = 150;
        baseCash = 75;
      } else if (zombie.data.type === 'brute') {
        basePoints = 350;
        baseCash = 200;
      }

      if (isHeadshot) {
        basePoints = Math.round(basePoints * 1.5);
        baseCash += 25;
      }

      return { killed: true, points: basePoints, cash: baseCash, isHeadshot };
    }

    return { killed: false, points: 10, cash: 5, isHeadshot };
  }

  public getAliveZombies(): ZombieInstance[] {
    return this.zombies.filter((z) => !z.data.isDead);
  }

  public getAllZombies(): ZombieInstance[] {
    return this.zombies;
  }

  public clearAll() {
    this.zombies.forEach((z) => {
      this.scene.remove(z.group);
    });
    this.zombies = [];
  }
}
