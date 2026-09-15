import * as THREE from 'three';

export interface Particle {
  mesh: THREE.Mesh;
  type: 'blood' | 'spark' | 'smoke' | 'muzzle' | 'fireball' | 'electric' | 'shrapnel' | 'flame' | 'flameYellow';
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  decay: number;
  scaleDown?: boolean;
}

interface ElectricArc {
  line: THREE.Line;
  life: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  public particles: Particle[] = [];
  private particleObjPool: Particle[] = [];

  // Quality settings controlled by PerformanceManager
  public maxActiveParticles: number = 150;
  public particleMultiplier: number = 1.0;

  // Materials
  private bloodMat = new THREE.MeshBasicMaterial({ color: 0x880000 });
  private sparkMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
  private smokeMat = new THREE.MeshBasicMaterial({ color: 0x332a26, transparent: true, opacity: 0.65 });
  private muzzleMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa });
  private fireballMat = new THREE.MeshBasicMaterial({ color: 0xff5511 });
  private electricMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
  private shrapnelMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  private flameMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
  private flameYellowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  private arcLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 });

  // Shared Geometries
  private bloodGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
  private sparkGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
  private smokeGeo = new THREE.SphereGeometry(0.38, 5, 5);
  private muzzleGeo = new THREE.SphereGeometry(0.12, 6, 6);
  private fireballGeo = new THREE.SphereGeometry(0.42, 5, 5);
  private electricGeo = new THREE.BoxGeometry(0.06, 0.16, 0.06);
  private shrapnelGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  private flameGeo = new THREE.SphereGeometry(0.20, 5, 5);

  // Mesh Pools to prevent instantiating meshes and modifying scene graph nodes every frame
  private bloodPool: THREE.Mesh[] = [];
  private sparkPool: THREE.Mesh[] = [];
  private smokePool: THREE.Mesh[] = [];
  private muzzlePool: THREE.Mesh[] = [];
  private fireballPool: THREE.Mesh[] = [];
  private electricPool: THREE.Mesh[] = [];
  private shrapnelPool: THREE.Mesh[] = [];
  private flamePool: THREE.Mesh[] = [];
  private flameYellowPool: THREE.Mesh[] = [];

  // Tracer line pool
  private tracerPool: THREE.Line[] = [];
  private activeTracers: { line: THREE.Line; life: number }[] = [];
  private tracerMaterial = new THREE.LineBasicMaterial({
    color: 0xffea77,
    transparent: true,
    opacity: 0.85,
  });

  // Electric arc pool
  private arcPool: THREE.Line[] = [];
  private activeArcs: ElectricArc[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Pre-create reusable tracer lines
    for (let i = 0; i < 20; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geo, this.tracerMaterial);
      line.visible = false;
      this.scene.add(line);
      this.tracerPool.push(line);
    }

    // Pre-create electric arc lines (5 segments = 6 vertices = 18 floats)
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));
      const line = new THREE.Line(geo, this.arcLineMat);
      line.visible = false;
      this.scene.add(line);
      this.arcPool.push(line);
    }
  }

  public setQuality(limit: number, multiplier: number) {
    this.maxActiveParticles = limit;
    this.particleMultiplier = multiplier;
  }

  private getMesh(type: Particle['type']): THREE.Mesh {
    let pool: THREE.Mesh[];
    let geo: THREE.BufferGeometry;
    let mat: THREE.Material;

    switch (type) {
      case 'blood':
        pool = this.bloodPool;
        geo = this.bloodGeo;
        mat = this.bloodMat;
        break;
      case 'spark':
        pool = this.sparkPool;
        geo = this.sparkGeo;
        mat = this.sparkMat;
        break;
      case 'smoke':
        pool = this.smokePool;
        geo = this.smokeGeo;
        mat = this.smokeMat;
        break;
      case 'muzzle':
        pool = this.muzzlePool;
        geo = this.muzzleGeo;
        mat = this.muzzleMat;
        break;
      case 'fireball':
        pool = this.fireballPool;
        geo = this.fireballGeo;
        mat = this.fireballMat;
        break;
      case 'electric':
        pool = this.electricPool;
        geo = this.electricGeo;
        mat = this.electricMat;
        break;
      case 'shrapnel':
        pool = this.shrapnelPool;
        geo = this.shrapnelGeo;
        mat = this.shrapnelMat;
        break;
      case 'flame':
        pool = this.flamePool;
        geo = this.flameGeo;
        mat = this.flameMat;
        break;
      case 'flameYellow':
        pool = this.flameYellowPool;
        geo = this.flameGeo;
        mat = this.flameYellowMat;
        break;
    }

    let mesh = pool.pop();
    if (!mesh) {
      mesh = new THREE.Mesh(geo, mat);
      this.scene.add(mesh);
    }
    mesh.visible = true;
    mesh.scale.set(1, 1, 1);
    return mesh;
  }

  private releaseMesh(mesh: THREE.Mesh, type: Particle['type']) {
    mesh.visible = false;
    switch (type) {
      case 'blood':
        this.bloodPool.push(mesh);
        break;
      case 'spark':
        this.sparkPool.push(mesh);
        break;
      case 'smoke':
        this.smokePool.push(mesh);
        break;
      case 'muzzle':
        this.muzzlePool.push(mesh);
        break;
      case 'fireball':
        this.fireballPool.push(mesh);
        break;
      case 'electric':
        this.electricPool.push(mesh);
        break;
      case 'shrapnel':
        this.shrapnelPool.push(mesh);
        break;
      case 'flame':
        this.flamePool.push(mesh);
        break;
      case 'flameYellow':
        this.flameYellowPool.push(mesh);
        break;
    }
  }

  private acquireParticle(
    type: Particle['type'],
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    maxLife: number,
    scaleDown: boolean
  ): Particle | null {
    if (this.particles.length >= this.maxActiveParticles) {
      return null;
    }

    const mesh = this.getMesh(type);
    mesh.position.copy(pos);

    let p = this.particleObjPool.pop();
    if (!p) {
      p = {
        mesh,
        type,
        velocity: new THREE.Vector3().copy(vel),
        life: 0,
        maxLife,
        decay: 1,
        scaleDown,
      };
    } else {
      p.mesh = mesh;
      p.type = type;
      p.velocity.copy(vel);
      p.life = 0;
      p.maxLife = maxLife;
      p.decay = 1;
      p.scaleDown = scaleDown;
    }

    this.particles.push(p);
    return p;
  }

  public emitBlood(position: THREE.Vector3, normal: THREE.Vector3, count = 8) {
    const finalCount = Math.max(1, Math.round(count * this.particleMultiplier));
    for (let i = 0; i < finalCount; i++) {
      if (this.particles.length >= this.maxActiveParticles) break;

      const spread = 0.5;
      const vx = (normal.x + (Math.random() - 0.5) * spread) * (3 + Math.random() * 3);
      const vy = (normal.y + Math.random() * 0.8 + 0.2) * (3 + Math.random() * 3);
      const vz = (normal.z + (Math.random() - 0.5) * spread) * (3 + Math.random() * 3);

      const vel = new THREE.Vector3(vx, vy, vz);
      this.acquireParticle('blood', position, vel, 0.55 + Math.random() * 0.35, true);
    }
  }

  public emitSparks(position: THREE.Vector3, normal: THREE.Vector3, count = 6) {
    const finalCount = Math.max(1, Math.round(count * this.particleMultiplier));
    for (let i = 0; i < finalCount; i++) {
      if (this.particles.length >= this.maxActiveParticles) break;

      const vx = (normal.x + (Math.random() - 0.5) * 0.8) * (5 + Math.random() * 4);
      const vy = (normal.y + (Math.random() - 0.5) * 0.8 + 0.4) * (5 + Math.random() * 4);
      const vz = (normal.z + (Math.random() - 0.5) * 0.8) * (5 + Math.random() * 4);

      const vel = new THREE.Vector3(vx, vy, vz);
      this.acquireParticle('spark', position, vel, 0.2 + Math.random() * 0.2, true);
    }
  }

  public emitMuzzleFlash(position: THREE.Vector3) {
    const vel = new THREE.Vector3(0, 0, 0);
    this.acquireParticle('muzzle', position, vel, 0.05, true);
  }

  public emitExtractionSmoke(position: THREE.Vector3) {
    if (this.particles.length >= this.maxActiveParticles * 0.6) return;

    const spawnPos = new THREE.Vector3(
      position.x + (Math.random() - 0.5) * 1.5,
      position.y + 0.2,
      position.z + (Math.random() - 0.5) * 1.5
    );

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.8,
      1.2 + Math.random() * 0.8,
      (Math.random() - 0.5) * 0.8
    );

    this.acquireParticle('smoke', spawnPos, vel, 1.8 + Math.random() * 0.6, false);
  }

  public emitExplosion(position: THREE.Vector3, count = 22) {
    // 1. Central expanding fireballs
    const fireballCount = Math.max(2, Math.round(6 * this.particleMultiplier));
    for (let i = 0; i < fireballCount; i++) {
      if (this.particles.length >= this.maxActiveParticles) break;

      const pos = new THREE.Vector3(
        position.x + (Math.random() - 0.5) * 0.8,
        position.y + 0.3 + Math.random() * 0.6,
        position.z + (Math.random() - 0.5) * 0.8
      );

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        1.8 + Math.random() * 3.5,
        Math.sin(angle) * speed
      );

      this.acquireParticle('fireball', pos, vel, 0.35 + Math.random() * 0.25, false);
    }

    // 2. High velocity sparks & embers
    const sparkCount = Math.max(4, Math.round(count * this.particleMultiplier));
    for (let i = 0; i < sparkCount; i++) {
      if (this.particles.length >= this.maxActiveParticles) break;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const speed = 6 + Math.random() * 8;
      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed * 1.2,
        Math.sin(phi) * Math.sin(theta) * speed
      );

      this.acquireParticle('spark', position, vel, 0.45 + Math.random() * 0.45, true);
    }

    // 3. Shrapnel pieces
    const shrapnelCount = Math.max(1, Math.round(5 * this.particleMultiplier));
    for (let i = 0; i < shrapnelCount; i++) {
      if (this.particles.length >= this.maxActiveParticles) break;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        4 + Math.random() * 6,
        (Math.random() - 0.5) * 12
      );

      this.acquireParticle('shrapnel', position, vel, 0.7 + Math.random() * 0.4, false);
    }

    // 4. Rising dark smoke
    const smokeCount = Math.max(2, Math.round(8 * this.particleMultiplier));
    for (let i = 0; i < smokeCount; i++) {
      if (this.particles.length >= this.maxActiveParticles) break;

      const pos = new THREE.Vector3(
        position.x + (Math.random() - 0.5) * 1.5,
        position.y + 0.4,
        position.z + (Math.random() - 0.5) * 1.5
      );

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        2.0 + Math.random() * 2.0,
        (Math.random() - 0.5) * 1.5
      );

      this.acquireParticle('smoke', pos, vel, 1.5 + Math.random() * 0.8, false);
    }
  }

  public emitElectricShock(position: THREE.Vector3, count = 10) {
    const finalCount = Math.max(2, Math.round(count * this.particleMultiplier));
    for (let i = 0; i < finalCount; i++) {
      if (this.particles.length >= this.maxActiveParticles) break;

      const pos = new THREE.Vector3(
        position.x + (Math.random() - 0.5) * 1.4,
        position.y + Math.random() * 1.6,
        position.z + (Math.random() - 0.5) * 1.4
      );

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );

      this.acquireParticle('electric', pos, vel, 0.12 + Math.random() * 0.14, true);
    }
  }

  public emitTrapSnap(position: THREE.Vector3) {
    const count = Math.max(3, Math.round(8 * this.particleMultiplier));
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxActiveParticles) break;

      const pos = new THREE.Vector3(
        position.x + (Math.random() - 0.5) * 0.4,
        position.y + 0.1,
        position.z + (Math.random() - 0.5) * 0.4
      );

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 2,
        (Math.random() - 0.5) * 3
      );

      this.acquireParticle('spark', pos, vel, 0.32, true);
    }
  }

  public emitFlameSpray(origin: THREE.Vector3, direction: THREE.Vector3, count = 4) {
    const finalCount = Math.max(1, Math.round(count * this.particleMultiplier));
    for (let i = 0; i < finalCount; i++) {
      if (this.particles.length >= this.maxActiveParticles) break;

      const type: 'flame' | 'flameYellow' = Math.random() < 0.6 ? 'flame' : 'flameYellow';
      const spread = 0.35;
      const speed = 14 + Math.random() * 6;

      const vel = new THREE.Vector3(
        direction.x + (Math.random() - 0.5) * spread,
        direction.y + (Math.random() - 0.5) * spread * 0.5,
        direction.z + (Math.random() - 0.5) * spread
      ).normalize().multiplyScalar(speed);

      this.acquireParticle(type, origin, vel, 0.42 + Math.random() * 0.22, false);
    }
  }

  public emitResidualFire(position: THREE.Vector3) {
    if (this.particles.length >= this.maxActiveParticles * 0.75) return;

    const pos = new THREE.Vector3(
      position.x + (Math.random() - 0.5) * 3.0,
      0.05,
      position.z + (Math.random() - 0.5) * 3.0
    );

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.4,
      1.0 + Math.random() * 1.2,
      (Math.random() - 0.5) * 0.4
    );

    this.acquireParticle('spark', pos, vel, 0.55 + Math.random() * 0.35, true);
  }

  public emitElectricBeam(start: THREE.Vector3, end: THREE.Vector3) {
    let line = this.arcPool.pop();
    if (!line) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));
      line = new THREE.Line(geo, this.arcLineMat);
      this.scene.add(line);
    }

    const segments = 5;
    const dirX = end.x - start.x;
    const dirY = end.y - start.y;
    const dirZ = end.z - start.z;

    const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    // Vertex 0: start
    arr[0] = start.x;
    arr[1] = start.y;
    arr[2] = start.z;

    // Mid vertices
    for (let i = 1; i < segments; i++) {
      const frac = i / segments;
      const idx = i * 3;
      arr[idx] = start.x + dirX * frac + (Math.random() - 0.5) * 0.35;
      arr[idx + 1] = start.y + dirY * frac + (Math.random() - 0.5) * 0.35;
      arr[idx + 2] = start.z + dirZ * frac + (Math.random() - 0.5) * 0.35;
    }

    // Vertex 5: end
    arr[15] = end.x;
    arr[16] = end.y;
    arr[17] = end.z;

    posAttr.needsUpdate = true;
    line.visible = true;

    this.activeArcs.push({ line, life: 0.08 });
  }

  public createTracer(start: THREE.Vector3, end: THREE.Vector3) {
    let line = this.tracerPool.pop();
    if (!line) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      line = new THREE.Line(geo, this.tracerMaterial);
      this.scene.add(line);
    }

    const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    arr[0] = start.x;
    arr[1] = start.y;
    arr[2] = start.z;
    arr[3] = end.x;
    arr[4] = end.y;
    arr[5] = end.z;
    posAttr.needsUpdate = true;
    line.visible = true;

    this.activeTracers.push({ line, life: 0.05 });
  }

  public update(delta: number) {
    const gravity = -9.8;

    // 1. Update tracers
    for (let t = this.activeTracers.length - 1; t >= 0; t--) {
      const tr = this.activeTracers[t];
      tr.life -= delta;
      if (tr.life <= 0) {
        tr.line.visible = false;
        this.tracerPool.push(tr.line);
        this.activeTracers.splice(t, 1);
      }
    }

    // 2. Update electric arcs
    for (let a = this.activeArcs.length - 1; a >= 0; a--) {
      const arc = this.activeArcs[a];
      arc.life -= delta;
      if (arc.life <= 0) {
        arc.line.visible = false;
        this.arcPool.push(arc.line);
        this.activeArcs.splice(a, 1);
      }
    }

    // 3. Update pooled particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.releaseMesh(p.mesh, p.type);
        this.particleObjPool.push(p);
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.velocity.y += gravity * delta * 0.5;
      p.mesh.position.addScaledVector(p.velocity, delta);

      if (p.mesh.position.y < 0.02) {
        p.mesh.position.y = 0.02;
        p.velocity.set(0, 0, 0);
      }

      // Scale down or expand smoke
      const progress = p.life / p.maxLife;
      if (p.scaleDown) {
        const s = Math.max(0.01, 1 - progress);
        p.mesh.scale.set(s, s, s);
      } else {
        const s = 1 + progress * 2.0;
        p.mesh.scale.set(s, s, s);
      }
    }
  }

  public clear() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.releaseMesh(p.mesh, p.type);
      this.particleObjPool.push(p);
    }
    this.particles = [];

    for (let i = 0; i < this.activeTracers.length; i++) {
      const tr = this.activeTracers[i];
      tr.line.visible = false;
      this.tracerPool.push(tr.line);
    }
    this.activeTracers = [];

    for (let i = 0; i < this.activeArcs.length; i++) {
      const arc = this.activeArcs[i];
      arc.line.visible = false;
      this.arcPool.push(arc.line);
    }
    this.activeArcs = [];
  }

  public clearAll() {
    this.clear();
  }
}
