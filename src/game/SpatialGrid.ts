import * as THREE from 'three';
import { WorldObstacle } from './Environment';
import { ZombieInstance } from './Zombies';

/**
 * 2D Spatial Partitioning Grid for Fast Obstacle & Entity Collision Queries
 * Prevents O(N^2) checks between zombies and avoids testing against all 60+ world obstacles
 */
export class SpatialObstacleGrid {
  private cellSize: number;
  private minX: number;
  private minZ: number;
  private cols: number;
  private rows: number;
  private grid: WorldObstacle[][][]; // [row][col] -> obstacles in that cell

  constructor(obstacles: WorldObstacle[], cellSize = 10, bounds = 80) {
    this.cellSize = cellSize;
    this.minX = -bounds;
    this.minZ = -bounds;
    this.cols = Math.ceil((bounds * 2) / cellSize);
    this.rows = Math.ceil((bounds * 2) / cellSize);

    // Initialize grid cells
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = [];
      }
    }

    // Populate grid
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      const minCol = Math.max(0, Math.floor((obs.box.min.x - this.minX) / this.cellSize));
      const maxCol = Math.min(this.cols - 1, Math.floor((obs.box.max.x - this.minX) / this.cellSize));
      const minRow = Math.max(0, Math.floor((obs.box.min.z - this.minZ) / this.cellSize));
      const maxRow = Math.min(this.rows - 1, Math.floor((obs.box.max.z - this.minZ) / this.cellSize));

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          this.grid[r][c].push(obs);
        }
      }
    }
  }

  /**
   * Fast query for obstacles near a 2D position (x, z)
   * Reuses output array to prevent garbage collection
   */
  public queryNearby(x: number, z: number, outList: WorldObstacle[]): WorldObstacle[] {
    outList.length = 0;
    const centerCol = Math.floor((x - this.minX) / this.cellSize);
    const centerRow = Math.floor((z - this.minZ) / this.cellSize);

    const minCol = Math.max(0, centerCol - 1);
    const maxCol = Math.min(this.cols - 1, centerCol + 1);
    const minRow = Math.max(0, centerRow - 1);
    const maxRow = Math.min(this.rows - 1, centerRow + 1);

    // Fast deduplication via simple check
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = this.grid[r][c];
        for (let k = 0; k < cell.length; k++) {
          const obs = cell[k];
          if (!outList.includes(obs)) {
            outList.push(obs);
          }
        }
      }
    }

    return outList;
  }
}

/**
 * Lightweight Spatial Hash for dynamic zombie-to-zombie separation
 */
export class ZombieSpatialHash {
  private cellSize: number;
  private buckets: Map<number, ZombieInstance[]> = new Map();
  private nearbyBuffer: ZombieInstance[] = [];

  constructor(cellSize = 3.5) {
    this.cellSize = cellSize;
  }

  private hash(x: number, z: number): number {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    // Simple 2D integer hash
    return (cx * 73856093) ^ (cz * 19349663);
  }

  public clear() {
    for (const list of this.buckets.values()) {
      list.length = 0;
    }
  }

  public insert(z: ZombieInstance) {
    const key = this.hash(z.group.position.x, z.group.position.z);
    let list = this.buckets.get(key);
    if (!list) {
      list = [];
      this.buckets.set(key, list);
    }
    list.push(z);
  }

  public getNearbyZombies(x: number, z: number): ZombieInstance[] {
    this.nearbyBuffer.length = 0;
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const key = ((cx + dx) * 73856093) ^ ((cz + dz) * 19349663);
        const list = this.buckets.get(key);
        if (list && list.length > 0) {
          for (let i = 0; i < list.length; i++) {
            this.nearbyBuffer.push(list[i]);
          }
        }
      }
    }

    return this.nearbyBuffer;
  }
}
