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

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnPickup(type: PickupType, position: THREE.Vector3, amount = 1, subtype?: WeaponId): PickupInstance {
    const group = new THREE.Group();
    group.position.set(position.x, position.y + 0.35, position.z);

    if (type === 'health') {
      // White medkit with red cross
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.3, 0.25),
        new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 })
      );
      group.add(box);

      const crossMat = new THREE.MeshBasicMaterial({ color: 0xee2222 });
      const barV = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.22), crossMat);
      barV.position.set(0, 0, 0.13);
      group.add(barV);

      const barH = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.08), crossMat);
      barH.position.set(0, 0, 0.13);
      group.add(barH);

      const light = new THREE.PointLight(0x00ff88, 0.8, 3);
      group.add(light);

    } else if (type === 'ammo') {
      // Green military ammo box
      const ammoBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.26, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x3d4e32, roughness: 0.6, metalness: 0.3 })
      );
      group.add(ammoBox);

      // Yellow text / stripe
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.43, 0.06, 0.21),
        new THREE.MeshBasicMaterial({ color: 0xeebb22 })
      );
      group.add(stripe);

      const light = new THREE.PointLight(0xffdd44, 0.8, 3);
      group.add(light);

    } else if (type === 'armor') {
      // Blue armor vest plate
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.45, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.3, metalness: 0.7 })
      );
      group.add(plate);

      const light = new THREE.PointLight(0x38bdf8, 0.8, 3);
      group.add(light);

    } else if (type === 'cash') {
      // Stack of cash / currency
      const stack = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.15, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 })
      );
      group.add(stack);

      const light = new THREE.PointLight(0x22c55e, 0.8, 3);
      group.add(light);

    } else if (type === 'scrap') {
      // Mechanical scrap metal cog and salvaged beams
      const cog = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8),
        new THREE.MeshStandardMaterial({ color: 0x8a7051, metalness: 0.85, roughness: 0.4 })
      );
      cog.rotation.x = Math.PI / 4;
      group.add(cog);

      const scrapChunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.08, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.9, roughness: 0.3 })
      );
      scrapChunk.position.set(0.06, 0.05, 0);
      group.add(scrapChunk);

      const light = new THREE.PointLight(0xf59e0b, 0.9, 3.5);
      group.add(light);

    } else if (type === 'electronics') {
      // Circuit board wafer with microchip
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.04, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.3 })
      );
      group.add(board);

      const chip = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.05, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 })
      );
      chip.position.y = 0.03;
      group.add(chip);

      const light = new THREE.PointLight(0x06b6d4, 1.0, 3.5);
      group.add(light);

    } else if (type === 'chemicals') {
      // Glowing chemical solvent canister
      const vial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0xa3e635, emissive: 0x4d7c0f, emissiveIntensity: 0.6, roughness: 0.2 })
      );
      group.add(vial);

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12),
        new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5 })
      );
      cap.position.y = 0.16;
      group.add(cap);

      const light = new THREE.PointLight(0x84cc16, 1.1, 3.5);
      group.add(light);

    } else if (type === 'parts') {
      // Machined precision weapon components / barrel
      const barrelPart = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.38, 12),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.2 })
      );
      barrelPart.rotation.z = Math.PI / 3;
      group.add(barrelPart);

      const gear = new THREE.Mesh(
        new THREE.TorusGeometry(0.1, 0.03, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
      );
      gear.position.set(0, 0.05, 0);
      group.add(gear);

      const light = new THREE.PointLight(0xeab308, 1.2, 4);
      group.add(light);

    } else if (type === 'blueprint') {
      // Technical blueprint blueprint document cylinder / roll
      const roll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.42, 16),
        new THREE.MeshStandardMaterial({
          color: 0x1d4ed8,
          emissive: 0x1e40af,
          emissiveIntensity: 0.5,
          roughness: 0.4,
        })
      );
      roll.rotation.x = Math.PI / 4;
      group.add(roll);

      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.085, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5 })
      );
      band.rotation.x = Math.PI / 4;
      group.add(band);

      const light = new THREE.PointLight(0x3b82f6, 1.4, 4.5);
      group.add(light);

    } else {
      // Weapon crate/item
      const weaponCrate = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.25, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x9333ea, metalness: 0.8, roughness: 0.2 })
      );
      group.add(weaponCrate);

      const light = new THREE.PointLight(0xc084fc, 1.2, 4);
      group.add(light);
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

      // Bobbing and rotating
      p.mesh.rotation.y += delta * 1.8;
      p.mesh.position.y = p.baseY + Math.sin(time * 3 + i) * 0.12;

      // Distance to player
      const dx = playerPos.x - p.mesh.position.x;
      const dz = playerPos.z - p.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Collect radius (2.2m)
      if (dist < 2.2) {
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
    this.pickups.forEach((p) => {
      this.scene.remove(p.mesh);
    });
    this.pickups = [];
  }
}
