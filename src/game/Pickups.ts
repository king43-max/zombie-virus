import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager';
import { PickupData, PickupType, WeaponId } from '../types/game';

export interface PickupInstance {
  data: PickupData;
  mesh: THREE.Group;
  baseY: number;
}

export class PickupManager {
  private scene: THREE.Scene;
  private pickups: PickupInstance[] = [];
  public enableLights: boolean = false; // Disabled by default for mobile performance

  // Cached Geometries to prevent memory allocations on every drop
  private boxMedkitGeo = new THREE.BoxGeometry(0.45, 0.3, 0.25);
  private barVGeo = new THREE.PlaneGeometry(0.08, 0.22);
  private barHGeo = new THREE.PlaneGeometry(0.22, 0.08);
  private ammoBoxGeo = new THREE.BoxGeometry(0.42, 0.26, 0.2);
  private ammoStripeGeo = new THREE.BoxGeometry(0.43, 0.06, 0.21);
  private plateGeo = new THREE.BoxGeometry(0.4, 0.45, 0.12);
  private cashGeo = new THREE.BoxGeometry(0.3, 0.15, 0.2);
  private cogGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
  private scrapChunkGeo = new THREE.BoxGeometry(0.28, 0.08, 0.12);
  private boardGeo = new THREE.BoxGeometry(0.35, 0.04, 0.3);
  private cylinderGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.38, 8);
  private partsBoxGeo = new THREE.BoxGeometry(0.45, 0.18, 0.22);
  private tubeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
  private tubeCapGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8);

  // Cached Materials
  private medkitMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
  private crossMat = new THREE.MeshBasicMaterial({ color: 0xee2222 });
  private ammoBoxMat = new THREE.MeshStandardMaterial({ color: 0x3d4e32, roughness: 0.6, metalness: 0.3 });
  private ammoStripeMat = new THREE.MeshBasicMaterial({ color: 0xeebb22 });
  private armorMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.3, metalness: 0.7 });
  private cashMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
  private scrapMat1 = new THREE.MeshStandardMaterial({ color: 0x8a7051, metalness: 0.85, roughness: 0.4 });
  private scrapMat2 = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.9, roughness: 0.3 });
  private elecBoardMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.3 });
  private elecChipMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  private chemMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.2, metalness: 0.1 });
  private chemCapMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
  private partsMat1 = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
  private partsMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  private bpTubeMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3, metalness: 0.4 });
  private bpCapMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
  private bpRingMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnPickup(type: PickupType, position: THREE.Vector3, amount = 1, subtype?: WeaponId): PickupInstance {
    const group = new THREE.Group();
    group.position.set(position.x, position.y + 0.35, position.z);

    if (type === 'health') {
      const box = new THREE.Mesh(this.boxMedkitGeo, this.medkitMat);
      group.add(box);

      const barV = new THREE.Mesh(this.barVGeo, this.crossMat);
      barV.position.set(0, 0, 0.13);
      group.add(barV);

      const barH = new THREE.Mesh(this.barHGeo, this.crossMat);
      barH.position.set(0, 0, 0.13);
      group.add(barH);

      if (this.enableLights) {
        group.add(new THREE.PointLight(0x00ff88, 0.6, 2.5));
      }
    } else if (type === 'ammo') {
      const ammoBox = new THREE.Mesh(this.ammoBoxGeo, this.ammoBoxMat);
      group.add(ammoBox);

      const stripe = new THREE.Mesh(this.ammoStripeGeo, this.ammoStripeMat);
      group.add(stripe);

      if (this.enableLights) {
        group.add(new THREE.PointLight(0xffdd44, 0.6, 2.5));
      }
    } else if (type === 'armor') {
      const plate = new THREE.Mesh(this.plateGeo, this.armorMat);
      group.add(plate);

      if (this.enableLights) {
        group.add(new THREE.PointLight(0x38bdf8, 0.6, 2.5));
      }
    } else if (type === 'cash') {
      const stack = new THREE.Mesh(this.cashGeo, this.cashMat);
      group.add(stack);

      if (this.enableLights) {
        group.add(new THREE.PointLight(0x22c55e, 0.6, 2.5));
      }
    } else if (type === 'scrap') {
      const cog = new THREE.Mesh(this.cogGeo, this.scrapMat1);
      cog.rotation.x = Math.PI / 4;
      group.add(cog);

      const scrapChunk = new THREE.Mesh(this.scrapChunkGeo, this.scrapMat2);
      scrapChunk.position.set(0.06, 0.05, 0);
      group.add(scrapChunk);

      if (this.enableLights) {
        group.add(new THREE.PointLight(0xf59e0b, 0.6, 2.5));
      }
    } else if (type === 'electronics') {
      const board = new THREE.Mesh(this.boardGeo, this.elecBoardMat);
      group.add(board);

      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), this.elecChipMat);
      chip.position.set(0, 0.04, 0);
      group.add(chip);

      if (this.enableLights) {
        group.add(new THREE.PointLight(0x10b981, 0.6, 2.5));
      }
    } else if (type === 'chemicals') {
      const bottle = new THREE.Mesh(this.cylinderGeo, this.chemMat);
      group.add(bottle);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8), this.chemCapMat);
      cap.position.set(0, 0.22, 0);
      group.add(cap);

      if (this.enableLights) {
        group.add(new THREE.PointLight(0x84cc16, 0.6, 2.5));
      }
    } else if (type === 'parts') {
      const box = new THREE.Mesh(this.partsBoxGeo, this.partsMat1);
      group.add(box);

      const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.06), this.partsMat2);
      indicator.position.set(0, 0.06, 0);
      group.add(indicator);

      if (this.enableLights) {
        group.add(new THREE.PointLight(0x0284c7, 0.6, 2.5));
      }
    } else if (type === 'blueprint') {
      const tube = new THREE.Mesh(this.tubeGeo, this.bpTubeMat);
      tube.rotation.z = Math.PI / 3;
      group.add(tube);

      const cap1 = new THREE.Mesh(this.tubeCapGeo, this.bpCapMat);
      cap1.position.set(-0.22, -0.12, 0);
      group.add(cap1);

      const cap2 = new THREE.Mesh(this.tubeCapGeo, this.bpCapMat);
      cap2.position.set(0.22, 0.12, 0);
      group.add(cap2);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), this.bpRingMat);
      group.add(ring);

      if (this.enableLights) {
        group.add(new THREE.PointLight(0x3b82f6, 0.6, 2.5));
      }
    }

    this.scene.add(group);

    const instance: PickupInstance = {
      data: {
        id: `pickup_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type,
        subtype,
        amount,
        x: position.x,
        y: position.y,
        z: position.z,
        pickedUp: false,
      },
      mesh: group,
      baseY: position.y + 0.4,
    };

    this.pickups.push(instance);
    return instance;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    onPickup: (data: PickupData) => boolean
  ) {
    const time = performance.now() / 1000;

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      if (p.data.pickedUp) {
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
        continue;
      }

      // Distance to player
      const dx = playerPos.x - p.mesh.position.x;
      const dz = playerPos.z - p.mesh.position.z;
      const distSq = dx * dx + dz * dz;

      // Bobbing and rotating (only calculate bobbing if within 35m)
      if (distSq < 1225) {
        p.mesh.rotation.y += delta * 1.8;
        p.mesh.position.y = p.baseY + Math.sin(time * 3 + i) * 0.12;
      }

      // Collect radius (2.2m -> distSq < 4.84)
      if (distSq < 4.84) {
        const accepted = onPickup(p.data);
        if (accepted) {
          p.data.pickedUp = true;
          const soundType: 'health' | 'armor' | 'cash' | 'ammo' | 'weapon' =
            p.data.type === 'scrap' || p.data.type === 'electronics' || p.data.type === 'chemicals'
              ? 'ammo'
              : p.data.type === 'parts' || p.data.type === 'blueprint'
              ? 'weapon'
              : p.data.type;
          soundManager.playPickup(soundType);
          this.scene.remove(p.mesh);
          this.pickups.splice(i, 1);
        }
      }
    }
  }

  public clearAll() {
    for (let i = 0; i < this.pickups.length; i++) {
      this.scene.remove(this.pickups[i].mesh);
    }
    this.pickups = [];
  }
}
