import * as THREE from 'three';
import { INITIAL_AUDIO_LOGS } from './AudioLogs';

export interface WorldObstacle {
  box: THREE.Box3;
  type: 'wall' | 'building' | 'car' | 'prop' | 'boundary';
}

export interface InteractivePoint {
  id: string;
  type: 'crate' | 'workbench' | 'extraction' | 'door' | 'audio_log';
  position: THREE.Vector3;
  label: string;
  mesh?: THREE.Object3D;
  activated?: boolean;
  audioLogId?: string;
}

export interface EnvironmentData {
  group: THREE.Group;
  obstacles: WorldObstacle[];
  interactivePoints: InteractivePoint[];
  streetLights: THREE.SpotLight[];
  moonLight: THREE.DirectionalLight;
  spawnPoints: THREE.Vector3[];
  extractionPoint: THREE.Vector3;
  fog: THREE.FogExp2;
  collidableMeshes: THREE.Mesh[];
}

export function buildEnvironment(scene: THREE.Scene): EnvironmentData {
  const envGroup = new THREE.Group();
  scene.add(envGroup);

  const obstacles: WorldObstacle[] = [];
  const interactivePoints: InteractivePoint[] = [];
  const streetLights: THREE.SpotLight[] = [];
  const spawnPoints: THREE.Vector3[] = [];

  // World dimensions
  const MAP_HALF = 70; // 140x140 playable area

  // Atmospheric Fog: Dark bluish-gray survival-horror fog
  const fog = new THREE.FogExp2(0x0a0c10, 0.022);
  scene.fog = fog;
  scene.background = new THREE.Color(0x06080c);

  // Ambient Light: very dim cold night ambient
  const ambientLight = new THREE.AmbientLight(0x222838, 0.6);
  scene.add(ambientLight);

  // Moon Directional Light
  const moonLight = new THREE.DirectionalLight(0x7085a6, 0.85);
  moonLight.position.set(40, 60, -30);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 2048;
  moonLight.shadow.mapSize.height = 2048;
  moonLight.shadow.camera.near = 10;
  moonLight.shadow.camera.far = 180;
  moonLight.shadow.camera.left = -80;
  moonLight.shadow.camera.right = 80;
  moonLight.shadow.camera.top = 80;
  moonLight.shadow.camera.bottom = -80;
  scene.add(moonLight);

  // --- TEXTURES / MATERIALS ---
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    roughness: 0.9,
    metalness: 0.1,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x2e3338,
    roughness: 0.85,
    metalness: 0.05,
  });

  const brickMat = new THREE.MeshStandardMaterial({
    color: 0x422a28,
    roughness: 0.92,
  });

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x33383d,
    roughness: 0.88,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2b1f,
    roughness: 0.95,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x252a30,
    metalness: 0.7,
    roughness: 0.4,
  });

  const rustyCarMat = new THREE.MeshStandardMaterial({
    color: 0x5a2d22,
    metalness: 0.4,
    roughness: 0.7,
  });

  const policeCarMat = new THREE.MeshStandardMaterial({
    color: 0x1c2438,
    metalness: 0.5,
    roughness: 0.4,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x446688,
    transparent: true,
    opacity: 0.4,
    roughness: 0.2,
  });

  // --- GROUND & STREETS ---
  // Main base ground
  const groundGeo = new THREE.PlaneGeometry(MAP_HALF * 2 + 20, MAP_HALF * 2 + 20);
  const groundMesh = new THREE.Mesh(groundGeo, asphaltMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  envGroup.add(groundMesh);

  // Cross intersection streets: Main Avenue (Z-axis) & Cross Street (X-axis)
  // Add road painted dashed lines
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x8f7f4f });
  for (let z = -MAP_HALF + 10; z < MAP_HALF - 10; z += 5) {
    if (Math.abs(z) > 12) {
      const lineMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 2.5), lineMat);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.position.set(0, 0.02, z);
      envGroup.add(lineMesh);
    }
  }
  for (let x = -MAP_HALF + 10; x < MAP_HALF - 10; x += 5) {
    if (Math.abs(x) > 12) {
      const lineMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.35), lineMat);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.position.set(x, 0.02, 0);
      envGroup.add(lineMesh);
    }
  }

  // Sidewalks
  const createSidewalk = (x: number, z: number, w: number, d: number) => {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), sidewalkMat);
    curb.position.set(x, 0.125, z);
    curb.receiveShadow = true;
    curb.castShadow = true;
    envGroup.add(curb);
  };

  // 4 Quads Sidewalks
  createSidewalk(35, 35, 52, 52);
  createSidewalk(-35, 35, 52, 52);
  createSidewalk(35, -35, 52, 52);
  createSidewalk(-35, -35, 52, 52);

  // Boundary Walls (Invisible / concrete barrier perimeter)
  const addBoundary = (x: number, z: number, w: number, d: number) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 6, d), concreteMat);
    wall.position.set(x, 3, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    envGroup.add(wall);

    const box = new THREE.Box3().setFromObject(wall);
    obstacles.push({ box, type: 'boundary' });
  };

  // Outer Map Boundaries
  addBoundary(0, -MAP_HALF, MAP_HALF * 2, 2);
  addBoundary(0, MAP_HALF, MAP_HALF * 2, 2);
  addBoundary(-MAP_HALF, 0, 2, MAP_HALF * 2);
  addBoundary(MAP_HALF, 0, 2, MAP_HALF * 2);

  // --- BUILDINGS WITH ENTERABLE INTERIORS ---
  // Helper to build an enterable abandoned building with door opening and interior rooms
  const createEnterableBuilding = (
    centerX: number,
    centerZ: number,
    width: number,
    depth: number,
    height: number,
    doorSide: 'north' | 'south' | 'east' | 'west',
    doorOffset = 0
  ) => {
    const wallThickness = 0.5;
    const doorWidth = 2.4;
    const doorHeight = 3.2;

    // Building Floors (Interior floor)
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.2, 0.2, depth - 0.2),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 })
    );
    floor.position.set(centerX, 0.1, centerZ);
    floor.receiveShadow = true;
    envGroup.add(floor);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.4, depth + 0.4), concreteMat);
    roof.position.set(centerX, height + 0.2, centerZ);
    roof.castShadow = true;
    roof.receiveShadow = true;
    envGroup.add(roof);

    // Obstacle helper for walls
    const addWallMesh = (x: number, z: number, w: number, d: number, h: number = height, y: number = height / 2) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), brickMat);
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      envGroup.add(wall);
      obstacles.push({ box: new THREE.Box3().setFromObject(wall), type: 'building' });
    };

    // North Wall (z = centerZ - depth/2)
    if (doorSide === 'north') {
      const halfRemaining = (width - doorWidth) / 2;
      addWallMesh(centerX - width / 2 + halfRemaining / 2, centerZ - depth / 2, halfRemaining, wallThickness);
      addWallMesh(centerX + width / 2 - halfRemaining / 2, centerZ - depth / 2, halfRemaining, wallThickness);
      // Lintel over door
      addWallMesh(centerX + doorOffset, centerZ - depth / 2, doorWidth, wallThickness, height - doorHeight, doorHeight + (height - doorHeight) / 2);
    } else {
      addWallMesh(centerX, centerZ - depth / 2, width, wallThickness);
    }

    // South Wall (z = centerZ + depth/2)
    if (doorSide === 'south') {
      const halfRemaining = (width - doorWidth) / 2;
      addWallMesh(centerX - width / 2 + halfRemaining / 2, centerZ + depth / 2, halfRemaining, wallThickness);
      addWallMesh(centerX + width / 2 - halfRemaining / 2, centerZ + depth / 2, halfRemaining, wallThickness);
      addWallMesh(centerX + doorOffset, centerZ + depth / 2, doorWidth, wallThickness, height - doorHeight, doorHeight + (height - doorHeight) / 2);
    } else {
      addWallMesh(centerX, centerZ + depth / 2, width, wallThickness);
    }

    // West Wall (x = centerX - width/2)
    if (doorSide === 'west') {
      const halfRemaining = (depth - doorWidth) / 2;
      addWallMesh(centerX - width / 2, centerZ - depth / 2 + halfRemaining / 2, wallThickness, halfRemaining);
      addWallMesh(centerX - width / 2, centerZ + depth / 2 - halfRemaining / 2, wallThickness, halfRemaining);
      addWallMesh(centerX - width / 2, centerZ + doorOffset, wallThickness, doorWidth, height - doorHeight, doorHeight + (height - doorHeight) / 2);
    } else {
      addWallMesh(centerX - width / 2, centerZ, wallThickness, depth);
    }

    // East Wall (x = centerX + width/2)
    if (doorSide === 'east') {
      const halfRemaining = (depth - doorWidth) / 2;
      addWallMesh(centerX + width / 2, centerZ - depth / 2 + halfRemaining / 2, wallThickness, halfRemaining);
      addWallMesh(centerX + width / 2, centerZ + depth / 2 - halfRemaining / 2, wallThickness, halfRemaining);
      addWallMesh(centerX + width / 2, centerZ + doorOffset, wallThickness, doorWidth, height - doorHeight, doorHeight + (height - doorHeight) / 2);
    } else {
      addWallMesh(centerX + width / 2, centerZ, wallThickness, depth);
    }

    // Interior dividing partition wall to create multi-room feel
    if (width > 14 && depth > 14) {
      const partitionLength = depth * 0.55;
      addWallMesh(centerX + 1, centerZ - depth / 4, wallThickness, partitionLength);
    }

    // Broken interior furniture (desks, overturned cabinets)
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1.2), woodMat);
    desk.position.set(centerX + 3, 0.5, centerZ - 2);
    desk.castShadow = true;
    desk.receiveShadow = true;
    envGroup.add(desk);
    obstacles.push({ box: new THREE.Box3().setFromObject(desk), type: 'prop' });

    // Interior eerie dim light source
    const interiorLight = new THREE.PointLight(0xff9944, 0.6, 12);
    interiorLight.position.set(centerX, height - 0.5, centerZ);
    interiorLight.castShadow = false;
    envGroup.add(interiorLight);

    // Lamp bulb fixture
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa55 })
    );
    bulb.position.set(centerX, height - 0.4, centerZ);
    envGroup.add(bulb);
  };

  // --- PLACED BUILDINGS ---
  // 1. Abandoned Police Station / Armory (North-West)
  createEnterableBuilding(-32, -32, 18, 16, 5, 'south');
  // Sign
  const stationSign = new THREE.Mesh(
    new THREE.BoxGeometry(7, 1.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x1d3557 })
  );
  stationSign.position.set(-32, 4.5, -23.9);
  envGroup.add(stationSign);

  // 2. Abandoned Pharmacy / Clinic (North-East)
  createEnterableBuilding(30, -32, 16, 16, 4.5, 'south');

  // 3. Convenience Store & Gas Mart (South-West)
  createEnterableBuilding(-30, 32, 16, 18, 4.5, 'north');

  // 4. Warehouse & Logistics Depot (South-East)
  createEnterableBuilding(35, 35, 22, 20, 6, 'west');

  // 5. Smaller Residential / Motel Units along alleys
  createEnterableBuilding(-48, -12, 10, 12, 4, 'east');
  createEnterableBuilding(48, -12, 10, 12, 4, 'west');

  // --- WRECKED CARS & VEHICLES ---
  const createWreckedCar = (x: number, z: number, rotY: number, isPolice = false) => {
    const carGroup = new THREE.Group();
    carGroup.position.set(x, 0, z);
    carGroup.rotation.y = rotY;

    // Body
    const bodyMat = isPolice ? policeCarMat : rustyCarMat;
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 4.2), bodyMat);
    chassis.position.set(0, 0.55, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    carGroup.add(chassis);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 2.2), bodyMat);
    cabin.position.set(0, 1.25, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 0.1), glassMat);
    windshield.position.set(0, 1.25, -1.35);
    windshield.rotation.x = -0.3;
    carGroup.add(windshield);

    // Wheels (flat / burned)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
    const wheelPositions = [
      [-1.05, 0.35, 1.3],
      [1.05, 0.35, 1.3],
      [-1.05, 0.35, -1.3],
      [1.05, 0.35, -1.3],
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 10), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      carGroup.add(wheel);
    });

    if (isPolice) {
      // Lightbar flashing emergency red/blue
      const lightbar = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.12, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6 })
      );
      lightbar.position.set(0, 1.65, -0.2);
      carGroup.add(lightbar);
    }

    envGroup.add(carGroup);

    // Obstacle bounding box
    const box = new THREE.Box3().setFromObject(carGroup);
    obstacles.push({ box, type: 'car' });
  };

  // Scattered wrecked vehicles in streets
  createWreckedCar(3, 14, 0.4, true); // Abandoned police car near center
  createWreckedCar(-5, -18, -0.6, false); // Rusty sedan
  createWreckedCar(16, 2, 1.8, false);
  createWreckedCar(-20, 2, -1.3, false);
  createWreckedCar(6, 42, -0.2, false);
  createWreckedCar(-4, -45, 0.8, false);

  // --- STREET LAMPS WITH LIGHT CONES ---
  const createStreetLamp = (x: number, z: number, active = true) => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, 0, z);

    // Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6, 8), metalMat);
    pole.position.set(0, 3, 0);
    pole.castShadow = true;
    lampGroup.add(pole);

    // Horizontal arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.8), metalMat);
    arm.position.set(0, 5.9, 0.8);
    lampGroup.add(arm);

    // Fixture head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.6), metalMat);
    head.position.set(0, 5.8, 1.6);
    lampGroup.add(head);

    if (active) {
      // Glowing bulb
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffe6aa })
      );
      bulb.position.set(0, 5.65, 1.6);
      lampGroup.add(bulb);

      // Spotlight cone casting down to the road
      const spot = new THREE.SpotLight(0xffe6aa, 3.5, 24, Math.PI / 4.5, 0.4, 1.2);
      spot.position.set(x, 5.6, z + 1.6);
      spot.target.position.set(x, 0, z + 1.6);
      spot.castShadow = true;
      spot.shadow.mapSize.width = 512;
      spot.shadow.mapSize.height = 512;
      scene.add(spot);
      scene.add(spot.target);
      streetLights.push(spot);
    }

    envGroup.add(lampGroup);

    // Small obstacle for lamp pole
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 2.5, z),
      new THREE.Vector3(0.6, 5, 0.6)
    );
    obstacles.push({ box, type: 'prop' });
  };

  // Streetlamps along sidewalks
  createStreetLamp(9, 9, true);
  createStreetLamp(-9, 9, true);
  createStreetLamp(9, -9, true);
  createStreetLamp(-9, -9, false); // broken flickering lamp
  createStreetLamp(9, 32, true);
  createStreetLamp(-9, 32, false);
  createStreetLamp(9, -32, true);
  createStreetLamp(-9, -32, true);
  createStreetLamp(32, 9, true);
  createStreetLamp(-32, 9, true);

  // --- BARRICADES, RUBBLE & OIL DRUMS ---
  const createBarricade = (x: number, z: number, rotY: number) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    // Concrete jersey barrier
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 0.7), concreteMat);
    base.position.set(0, 0.55, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Wooden planks leaning on it
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 0.1), woodMat);
    plank.position.set(0.6, 0.7, 0.45);
    plank.rotation.x = 0.35;
    group.add(plank);

    envGroup.add(group);
    obstacles.push({ box: new THREE.Box3().setFromObject(group), type: 'prop' });
  };

  createBarricade(0, 24, 0.1);
  createBarricade(24, 0, Math.PI / 2);
  createBarricade(-24, 0, Math.PI / 2);
  createBarricade(0, -24, 0);

  // Oil drums / Explosive barrels
  const drumMat = new THREE.MeshStandardMaterial({ color: 0x8b1e1e, metalness: 0.6, roughness: 0.4 });
  const createDrum = (x: number, z: number) => {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.1, 10), drumMat);
    drum.position.set(x, 0.55, z);
    drum.castShadow = true;
    drum.receiveShadow = true;
    envGroup.add(drum);
    obstacles.push({ box: new THREE.Box3().setFromObject(drum), type: 'prop' });
  };

  createDrum(10, 12);
  createDrum(10.7, 12);
  createDrum(-12, 14);
  createDrum(-28, -20);
  createDrum(28, 20);

  // --- DEAD TREES ---
  const deadWoodMat = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.95 });
  const createDeadTree = (x: number, z: number) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 4.5, 6), deadWoodMat);
    trunk.position.set(0, 2.25, 0);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Creepy gnarled branches
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 2.2, 5), deadWoodMat);
    b1.position.set(0.6, 3.6, 0);
    b1.rotation.z = -0.7;
    treeGroup.add(b1);

    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 1.8, 5), deadWoodMat);
    b2.position.set(-0.5, 3.2, 0.3);
    b2.rotation.z = 0.8;
    treeGroup.add(b2);

    envGroup.add(treeGroup);
    const box = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, 2, z), new THREE.Vector3(0.8, 4, 0.8));
    obstacles.push({ box, type: 'prop' });
  };

  createDeadTree(14, 18);
  createDeadTree(-14, 22);
  createDeadTree(18, -16);
  createDeadTree(-20, -14);
  createDeadTree(42, 12);
  createDeadTree(-45, 15);

  // --- INTERACTIVE SUPPLY CRATES ---
  const createSupplyCrate = (id: string, x: number, z: number, label: string) => {
    const crateGroup = new THREE.Group();
    crateGroup.position.set(x, 0.5, z);

    // Wooden Military Crate Body
    const crateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.9, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x4a4031, roughness: 0.85 })
    );
    crateMesh.castShadow = true;
    crateMesh.receiveShadow = true;
    crateGroup.add(crateMesh);

    // Glowing military stencil / supply icon
    const strapMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0x442200,
      metalness: 0.8,
    });
    const strap1 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.12, 0.12), strapMat);
    strap1.position.set(0, 0.2, 0.6);
    crateGroup.add(strap1);

    // Small beacon light
    const beacon = new THREE.PointLight(0xffbb33, 0.5, 4);
    beacon.position.set(0, 0.6, 0);
    crateGroup.add(beacon);

    envGroup.add(crateGroup);

    obstacles.push({ box: new THREE.Box3().setFromObject(crateGroup), type: 'prop' });

    interactivePoints.push({
      id,
      type: 'crate',
      position: new THREE.Vector3(x, 0.5, z),
      label: `[E] Open ${label}`,
      mesh: crateGroup,
      activated: false,
    });
  };

  // Scatter crates in interesting positions (inside buildings, behind barricades, alleyways)
  createSupplyCrate('crate_1', -30, -30, 'Armory Weapons Crate');
  createSupplyCrate('crate_2', 30, -30, 'Medical Supplies Crate');
  createSupplyCrate('crate_3', -28, 32, 'Survival Ammo Stash');
  createSupplyCrate('crate_4', 35, 33, 'Tactical Gear Crate');
  createSupplyCrate('crate_5', -18, 5, 'Street Patrol Cache');
  createSupplyCrate('crate_6', 15, -6, 'Alley Supply Crate');

  // --- UPGRADE WORKBENCH / ARMORY STATION ---
  const workbenchGroup = new THREE.Group();
  workbenchGroup.position.set(-26, 0, -26); // Just outside or inside the Police Armory

  const benchTable = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.1, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x2b303a, metalness: 0.8, roughness: 0.3 })
  );
  benchTable.position.set(0, 0.55, 0);
  benchTable.castShadow = true;
  benchTable.receiveShadow = true;
  workbenchGroup.add(benchTable);

  // Holographic blue terminal display
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.7, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.9 })
  );
  screen.position.set(0, 1.3, -0.3);
  screen.rotation.x = -0.15;
  workbenchGroup.add(screen);

  const workbenchLight = new THREE.PointLight(0x00e5ff, 1.2, 8);
  workbenchLight.position.set(0, 1.5, 0.2);
  workbenchGroup.add(workbenchLight);

  envGroup.add(workbenchGroup);
  obstacles.push({ box: new THREE.Box3().setFromObject(workbenchGroup), type: 'prop' });

  interactivePoints.push({
    id: 'workbench_1',
    type: 'workbench',
    position: new THREE.Vector3(-26, 1, -26),
    label: '[E] Weapon Upgrade Workbench',
    mesh: workbenchGroup,
  });

  // --- SAFE / EXTRACTION ZONE ---
  // Located at the North-Center Courtyard (0, 0, -55)
  const extractionPoint = new THREE.Vector3(0, 0, -56);

  const helipadGroup = new THREE.Group();
  helipadGroup.position.copy(extractionPoint);

  // Helipad Pad
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, 0.3, 32),
    new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.8 })
  );
  pad.position.set(0, 0.15, 0);
  pad.receiveShadow = true;
  helipadGroup.add(pad);

  // "H" marking
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffd60a });
  const barL = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 5), yellowMat);
  barL.rotation.x = -Math.PI / 2;
  barL.position.set(-1.8, 0.31, 0);
  helipadGroup.add(barL);

  const barR = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 5), yellowMat);
  barR.rotation.x = -Math.PI / 2;
  barR.position.set(1.8, 0.31, 0);
  helipadGroup.add(barR);

  const barC = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.8), yellowMat);
  barC.rotation.x = -Math.PI / 2;
  barC.position.set(0, 0.31, 0);
  helipadGroup.add(barC);

  // Perimeter Emergency Strobe Lights
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const lx = Math.cos(angle) * 7.5;
    const lz = Math.sin(angle) * 7.5;
    const lightPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff2222, emissiveIntensity: 0.8 })
    );
    lightPost.position.set(lx, 0.4, lz);
    helipadGroup.add(lightPost);
  }

  // Radio transmitter tower on the helipad edge
  const radioTower = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 8, 8), metalMat);
  radioTower.position.set(7, 4, 7);
  radioTower.castShadow = true;
  helipadGroup.add(radioTower);

  // Radio transmitter beacon light
  const radioBeacon = new THREE.PointLight(0x00ff88, 1.2, 16);
  radioBeacon.position.set(7, 8, 7);
  helipadGroup.add(radioBeacon);

  envGroup.add(helipadGroup);

  interactivePoints.push({
    id: 'extraction_radio',
    type: 'extraction',
    position: new THREE.Vector3(7, 1, -49),
    label: '[E] Activate Emergency Evac Beacon',
    mesh: helipadGroup,
    activated: false,
  });

  // --- NARRATIVE AUDIO LOGS INTERACTIVE POINTS ---
  for (const log of INITIAL_AUDIO_LOGS) {
    interactivePoints.push({
      id: log.id,
      type: 'audio_log',
      audioLogId: log.id,
      position: new THREE.Vector3(log.coordinates.x, log.coordinates.y, log.coordinates.z),
      label: `[E] Play Audio Log #${log.number}: "${log.title}"`,
    });
  }

  // --- ZOMBIE SPAWN POINTS ---
  // Placed in alleyways, dark corners, and perimeter ruins
  spawnPoints.push(
    new THREE.Vector3(-45, 0, -45),
    new THREE.Vector3(45, 0, -45),
    new THREE.Vector3(-45, 0, 45),
    new THREE.Vector3(45, 0, 45),
    new THREE.Vector3(0, 0, 52),
    new THREE.Vector3(-52, 0, 0),
    new THREE.Vector3(52, 0, 0),
    new THREE.Vector3(-22, 0, -48),
    new THREE.Vector3(22, 0, -48),
    new THREE.Vector3(0, 0, 38)
  );

  const collidableMeshes: THREE.Mesh[] = [];
  envGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      collidableMeshes.push(child);
    }
  });

  return {
    group: envGroup,
    obstacles,
    interactivePoints,
    streetLights,
    moonLight,
    spawnPoints,
    extractionPoint,
    fog,
    collidableMeshes,
  };
}
