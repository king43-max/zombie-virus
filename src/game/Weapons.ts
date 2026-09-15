import * as THREE from 'three';
import { WeaponConfig, WeaponId } from '../types/game';

export const INITIAL_WEAPONS: Record<WeaponId, WeaponConfig> = {
  pistol: {
    id: 'pistol',
    name: '9mm Service Pistol',
    category: 'Handgun',
    damage: 34,
    fireRate: 4.5,
    magazineSize: 12,
    reserveAmmoMax: 120,
    reloadTime: 1.3,
    pellets: 1,
    spread: 0.015,
    range: 50,
    cost: 0,
    upgradeLevel: 1,
    headshotMultiplier: 2.2,
    automatic: false,
  },
  shotgun: {
    id: 'shotgun',
    name: '12-Gauge Pump Shotgun',
    category: 'Shotgun',
    damage: 19, // 19 x 8 pellets = 152 total
    fireRate: 1.3,
    magazineSize: 6,
    reserveAmmoMax: 48,
    reloadTime: 2.2,
    pellets: 8,
    spread: 0.075,
    range: 28,
    cost: 750,
    upgradeLevel: 1,
    headshotMultiplier: 1.6,
    automatic: false,
  },
  rifle: {
    id: 'rifle',
    name: 'M4 Tactical Carbine',
    category: 'Assault Rifle',
    damage: 30,
    fireRate: 9.5,
    magazineSize: 30,
    reserveAmmoMax: 210,
    reloadTime: 1.8,
    pellets: 1,
    spread: 0.028,
    range: 75,
    cost: 1500,
    upgradeLevel: 1,
    headshotMultiplier: 2.0,
    automatic: true,
  },
  marksman: {
    id: 'marksman',
    name: 'DMR Scout Sniper',
    category: 'Marksman',
    damage: 90,
    fireRate: 2.2,
    magazineSize: 10,
    reserveAmmoMax: 60,
    reloadTime: 2.1,
    pellets: 1,
    spread: 0.006,
    range: 120,
    cost: 2400,
    upgradeLevel: 1,
    headshotMultiplier: 3.0,
    automatic: false,
  },
  flamethrower: {
    id: 'flamethrower',
    name: "Dragon's Breath Flamethrower",
    category: 'Heavy / Crafted',
    damage: 32,
    fireRate: 11.0,
    magazineSize: 75,
    reserveAmmoMax: 300,
    reloadTime: 2.2,
    pellets: 1,
    spread: 0.045,
    range: 18,
    cost: 1800,
    upgradeLevel: 1,
    headshotMultiplier: 1.2,
    automatic: true,
    isCrafted: true,
  },
  arc_rifle: {
    id: 'arc_rifle',
    name: 'Tesla Arc Plasma Cannon',
    category: 'Energy / Crafted',
    damage: 135,
    fireRate: 2.6,
    magazineSize: 14,
    reserveAmmoMax: 84,
    reloadTime: 2.0,
    pellets: 1,
    spread: 0.01,
    range: 65,
    cost: 2600,
    upgradeLevel: 1,
    headshotMultiplier: 2.5,
    automatic: true,
    isCrafted: true,
  },
};

/**
 * Procedural 3D Weapon Models in Three.js
 */
export function createWeaponMesh(weaponId: WeaponId): THREE.Group {
  const group = new THREE.Group();

  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1f2421,
    metalness: 0.85,
    roughness: 0.35,
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.85,
  });

  const woodStockMat = new THREE.MeshStandardMaterial({
    color: 0x4a2a18,
    roughness: 0.7,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x8b0000,
    metalness: 0.5,
    roughness: 0.4,
  });

  if (weaponId === 'pistol') {
    // Pistol Slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.28), gunMetalMat);
    slide.position.set(0, 0.06, -0.05);
    group.add(slide);

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 12), gunMetalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.065, -0.19);
    group.add(barrel);

    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.16, 0.08), gripMat);
    grip.rotation.x = -0.25;
    grip.position.set(0, -0.04, 0.03);
    group.add(grip);

    // Iron sights
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.02), accentMat);
    sight.position.set(0, 0.105, -0.18);
    group.add(sight);

  } else if (weaponId === 'shotgun') {
    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.7, 12), gunMetalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, -0.3);
    group.add(barrel);

    // Mag Tube under barrel
    const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.6, 12), gunMetalMat);
    magTube.rotation.x = Math.PI / 2;
    magTube.position.set(0, 0.01, -0.28);
    group.add(magTube);

    // Pump slide
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.2, 12), gripMat);
    pump.rotation.x = Math.PI / 2;
    pump.position.set(0, 0.01, -0.32);
    group.add(pump);

    // Receiver
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.25), gunMetalMat);
    receiver.position.set(0, 0.03, 0.05);
    group.add(receiver);

    // Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.35), woodStockMat);
    stock.position.set(0, -0.02, 0.32);
    stock.rotation.x = 0.08;
    group.add(stock);

  } else if (weaponId === 'rifle') {
    // Upper receiver & barrel
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.35), gunMetalMat);
    receiver.position.set(0, 0.03, -0.02);
    group.add(receiver);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.55, 12), gunMetalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, -0.45);
    group.add(barrel);

    // Flash hider
    const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.02, 0.06, 10), gunMetalMat);
    flashHider.rotation.x = Math.PI / 2;
    flashHider.position.set(0, 0.04, -0.74);
    group.add(flashHider);

    // Handguard
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.075, 0.32), gripMat);
    handguard.position.set(0, 0.04, -0.32);
    group.add(handguard);

    // Curved Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.09), gripMat);
    mag.rotation.x = 0.25;
    mag.position.set(0, -0.1, -0.08);
    group.add(mag);

    // Pistol Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.15, 0.07), gripMat);
    grip.rotation.x = -0.35;
    grip.position.set(0, -0.08, 0.1);
    group.add(grip);

    // Telescopic Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, 0.28), gripMat);
    stock.position.set(0, 0.01, 0.28);
    group.add(stock);

    // Red dot optic
    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.08), gunMetalMat);
    sightBase.position.set(0, 0.095, -0.03);
    group.add(sightBase);

    const opticLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.06, 12),
      new THREE.MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 })
    );
    opticLens.rotation.x = Math.PI / 2;
    opticLens.position.set(0, 0.12, -0.03);
    group.add(opticLens);

  } else if (weaponId === 'marksman') {
    // Marksman / Sniper
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.38), gunMetalMat);
    receiver.position.set(0, 0.03, 0);
    group.add(receiver);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 12), gunMetalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, -0.58);
    group.add(barrel);

    // Suppressor
    const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.18, 12), gunMetalMat);
    suppressor.rotation.x = Math.PI / 2;
    suppressor.position.set(0, 0.04, -1.05);
    group.add(suppressor);

    // Long Sniper Scope
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.32, 12), gunMetalMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.13, -0.05);
    group.add(scope);

    // Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.38), woodStockMat);
    stock.position.set(0, -0.02, 0.36);
    group.add(stock);

    // Straight Mag
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.15, 0.07), gripMat);
    mag.position.set(0, -0.08, -0.04);
    group.add(mag);

  } else if (weaponId === 'flamethrower') {
    // Heavy dual fuel tanks under receiver
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xc92a2a, metalness: 0.7, roughness: 0.35 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 });

    const tank1 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.42, 16), tankMat);
    tank1.rotation.x = Math.PI / 2;
    tank1.position.set(-0.06, -0.08, -0.05);
    group.add(tank1);

    const tank2 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.42, 16), tankMat);
    tank2.rotation.x = Math.PI / 2;
    tank2.position.set(0.06, -0.08, -0.05);
    group.add(tank2);

    // Pressure gauge
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), brassMat);
    gauge.position.set(0.08, 0.08, 0.02);
    group.add(gauge);

    // Main flame projector pipe
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.68, 14), gunMetalMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(0, 0.05, -0.42);
    group.add(pipe);

    // Perforated heat shield shroud
    const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.45, 12), gripMat);
    shroud.rotation.x = Math.PI / 2;
    shroud.position.set(0, 0.05, -0.38);
    group.add(shroud);

    // Flared flame nozzle
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.1, 12), brassMat);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0.05, -0.78);
    group.add(nozzle);

    // Pilot light flame glow tip
    const pilotGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6600 })
    );
    pilotGlow.position.set(0, 0.09, -0.77);
    group.add(pilotGlow);

    // Heavy rear pistol grip & trigger handle
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.08), gripMat);
    handle.rotation.x = -0.3;
    handle.position.set(0, -0.08, 0.18);
    group.add(handle);

  } else if (weaponId === 'arc_rifle') {
    // High-tech sci-fi plasma chassis
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.25 });
    const arcGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.48), chassisMat);
    body.position.set(0, 0.04, 0);
    group.add(body);

    // Central particle accelerator rail
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 12), gunMetalMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(0, 0.05, -0.52);
    group.add(rail);

    // 4 Magnetic Induction Accelerator Coils (Glowing cyan rings)
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 16), arcGlowMat);
      ring.position.set(0, 0.05, -0.32 - i * 0.13);
      group.add(ring);
    }

    // High capacity plasma battery capacitor block
    const battery = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.15, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 })
    );
    battery.position.set(0, -0.08, -0.06);
    group.add(battery);

    // Glowing energy cell indicator
    const cellGlow = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.08, 0.04), arcGlowMat);
    cellGlow.position.set(0, -0.08, -0.06);
    group.add(cellGlow);

    // Ergonomic combat stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.13, 0.28), gripMat);
    stock.position.set(0, 0.02, 0.32);
    group.add(stock);

    // Pistol grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.15, 0.07), gripMat);
    grip.rotation.x = -0.3;
    grip.position.set(0, -0.08, 0.1);
    group.add(grip);
  }

  // Cast shadow
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}
