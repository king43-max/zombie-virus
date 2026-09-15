import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  decay: number;
  scaleDown?: boolean;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];

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
  private smokeGeo = new THREE.SphereGeometry(0.4, 6, 6);
  private muzzleGeo = new THREE.SphereGeometry(0.12, 8, 8);
  private fireballGeo = new THREE.SphereGeometry(0.45, 6, 6);
  private electricGeo = new THREE.BoxGeometry(0.06, 0.16, 0.06);
  private shrapnelGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  private flameGeo = new THREE.SphereGeometry(0.22, 6, 6);

  // Tracer line pool
  private tracerPool: THREE.Line[] = [];
  private activeTracers: { line: THREE.Line; life: number }[] = [];
  private tracerMaterial = new THREE.LineBasicMaterial({
    color: 0xffea77,
    transparent: true,
    opacity: 0.85,
  });

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Pre-create 16 reusable tracer lines
    for (let i = 0; i < 16; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geo, this.tracerMaterial);
      line.visible = false;
      this.scene.add(line);
      this.tracerPool.push(line);
    }
  }

  public emitBlood(position: THREE.Vector3, normal: THREE.Vector3, count = 8) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length > 120) break;
      const mesh = new THREE.Mesh(this.bloodGeo, this.bloodMat);
      mesh.position.copy(position);

      const spread = 0.5;
      const velocity = new THREE.Vector3(
        normal.x + (Math.random() - 0.5) * spread,
        normal.y + Math.random() * 0.8 + 0.2,
        normal.z + (Math.random() - 0.5) * spread
      ).multiplyScalar(3 + Math.random() * 3);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
        decay: 1,
        scaleDown: true,
      });
    }
  }

  public emitSparks(position: THREE.Vector3, normal: THREE.Vector3, count = 6) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length > 120) break;
      const mesh = new THREE.Mesh(this.sparkGeo, this.sparkMat);
      mesh.position.copy(position);

      const velocity = new THREE.Vector3(
        normal.x + (Math.random() - 0.5) * 0.8,
        normal.y + (Math.random() - 0.5) * 0.8 + 0.4,
        normal.z + (Math.random() - 0.5) * 0.8
      ).multiplyScalar(5 + Math.random() * 4);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.2 + Math.random() * 0.2,
        decay: 1,
        scaleDown: true,
      });
    }
  }

  public emitMuzzleFlash(position: THREE.Vector3) {
    const mesh = new THREE.Mesh(this.muzzleGeo, this.muzzleMat);
    mesh.position.copy(position);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 0.05,
      decay: 1,
      scaleDown: true,
    });
  }

  public emitExtractionSmoke(position: THREE.Vector3) {
    if (this.particles.length > 80) return;
    const mesh = new THREE.Mesh(this.smokeGeo, this.smokeMat);
    mesh.position.set(
      position.x + (Math.random() - 0.5) * 1.5,
      position.y + 0.2,
      position.z + (Math.random() - 0.5) * 1.5
    );
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        1.2 + Math.random() * 0.8,
        (Math.random() - 0.5) * 0.8
      ),
      life: 0,
      maxLife: 2.0 + Math.random() * 0.8,
      decay: 1,
      scaleDown: false,
    });
  }

  public emitExplosion(position: THREE.Vector3, count = 22) {
    // 1. Central expanding fireballs
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(this.fireballGeo, this.fireballMat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.8,
        position.y + 0.3 + Math.random() * 0.6,
        position.z + (Math.random() - 0.5) * 0.8
      );
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          1.8 + Math.random() * 3.5,
          Math.sin(angle) * speed
        ),
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3,
        decay: 1,
        scaleDown: false,
      });
    }

    // 2. High velocity sparks & embers
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.sparkMat);
      mesh.position.copy(position);
      this.scene.add(mesh);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const speed = 6 + Math.random() * 8;
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed * 1.2,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        life: 0,
        maxLife: 0.5 + Math.random() * 0.5,
        decay: 1,
        scaleDown: true,
      });
    }

    // 3. Shrapnel metal pieces
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(this.shrapnelGeo, this.shrapnelMat);
      mesh.position.copy(position);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          4 + Math.random() * 6,
          (Math.random() - 0.5) * 12
        ),
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4,
        decay: 1,
        scaleDown: false,
      });
    }

    // 4. Rising dark smoke
    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(this.smokeGeo, this.smokeMat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 1.5,
        position.y + 0.4,
        position.z + (Math.random() - 0.5) * 1.5
      );
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          2.0 + Math.random() * 2.0,
          (Math.random() - 0.5) * 1.5
        ),
        life: 0,
        maxLife: 1.8 + Math.random() * 1.0,
        decay: 1,
        scaleDown: false,
      });
    }
  }

  public emitElectricShock(position: THREE.Vector3, count = 10) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.electricGeo, this.electricMat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 1.4,
        position.y + Math.random() * 1.6,
        position.z + (Math.random() - 0.5) * 1.4
      );
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8
        ),
        life: 0,
        maxLife: 0.12 + Math.random() * 0.16,
        decay: 1,
        scaleDown: true,
      });
    }
  }

  public emitResidualFire(position: THREE.Vector3) {
    if (this.particles.length > 110) return;
    const mesh = new THREE.Mesh(this.sparkGeo, this.sparkMat);
    mesh.position.set(
      position.x + (Math.random() - 0.5) * 3.0,
      0.05,
      position.z + (Math.random() - 0.5) * 3.0
    );
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        1.0 + Math.random() * 1.2,
        (Math.random() - 0.5) * 0.4
      ),
      life: 0,
      maxLife: 0.6 + Math.random() * 0.4,
      decay: 1,
      scaleDown: true,
    });
  }

  public createTracer(start: THREE.Vector3, end: THREE.Vector3) {
    let line = this.tracerPool.pop();
    if (!line) {
      // Create new line if pool exhausted
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

    // Update tracers
    for (let t = this.activeTracers.length - 1; t >= 0; t--) {
      const tr = this.activeTracers[t];
      tr.life -= delta;
      if (tr.life <= 0) {
        tr.line.visible = false;
        this.tracerPool.push(tr.line);
        this.activeTracers.splice(t, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
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
        const s = 1 + progress * 2.2;
        p.mesh.scale.set(s, s, s);
      }
    }
  }

  public emitTrapSnap(position: THREE.Vector3) {
    // Sparks & dust when bear trap snaps
    for (let i = 0; i < 10; i++) {
      if (this.particles.length > 140) break;
      const mesh = new THREE.Mesh(this.sparkGeo, this.sparkMat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.4,
        position.y + 0.1,
        position.z + (Math.random() - 0.5) * 0.4
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 2,
        (Math.random() - 0.5) * 3
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.35,
        decay: 1,
        scaleDown: true,
      });
    }
  }

  public emitFlameSpray(origin: THREE.Vector3, direction: THREE.Vector3, count = 4) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length > 150) break;
      const mat = Math.random() < 0.6 ? this.flameMat : this.flameYellowMat;
      const mesh = new THREE.Mesh(this.flameGeo, mat);
      mesh.position.copy(origin);

      const spread = 0.35;
      const vel = new THREE.Vector3(
        direction.x + (Math.random() - 0.5) * spread,
        direction.y + (Math.random() - 0.5) * spread * 0.5,
        direction.z + (Math.random() - 0.5) * spread
      ).normalize().multiplyScalar(14 + Math.random() * 6);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.25,
        decay: 1,
        scaleDown: false,
      });
    }
  }

  public emitElectricBeam(start: THREE.Vector3, end: THREE.Vector3) {
    // Multi-segment jagged lightning line
    const segments = 5;
    const points: THREE.Vector3[] = [start.clone()];
    const dir = new THREE.Vector3().subVectors(end, start);

    for (let i = 1; i < segments; i++) {
      const frac = i / segments;
      const p = new THREE.Vector3().addVectors(start, dir.clone().multiplyScalar(frac));
      p.x += (Math.random() - 0.5) * 0.35;
      p.y += (Math.random() - 0.5) * 0.35;
      p.z += (Math.random() - 0.5) * 0.35;
      points.push(p);
    }
    points.push(end.clone());

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, this.arcLineMat);
    this.scene.add(line);

    setTimeout(() => {
      this.scene.remove(line);
      geo.dispose();
    }, 90);
  }

  public clear() {
    this.particles.forEach((p) => {
      this.scene.remove(p.mesh);
    });
    this.particles = [];

    this.activeTracers.forEach((tr) => {
      tr.line.visible = false;
      this.tracerPool.push(tr.line);
    });
    this.activeTracers = [];
  }
}
