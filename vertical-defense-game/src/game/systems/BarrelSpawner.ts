import { Barrel } from '../entities/Barrel';
import { Vector2 } from '../utils/Vector2';
import { EntityManager } from '../engine/EntityManager';
import { EntityType } from '../types/EntityTypes';

export class BarrelSpawner {
  private canvasWidth: number;
  private canvasHeight: number;
  private spawnRate: number; // barrels per second
  private lastSpawnTime: number = 0;
  private currentLevel: number = 1;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.spawnRate = 0.15; // Start with 1 barrel every ~6.7 seconds
  }

  update(deltaTime: number, entityManager: EntityManager, level: number): void {
    this.currentLevel = level;
    this.updateSpawnRate();
    
    this.lastSpawnTime += deltaTime;
    
    const spawnInterval = 1.0 / this.spawnRate;
    if (this.lastSpawnTime >= spawnInterval) {
      // Only spawn if there aren't too many barrels already
      const existingBarrels = entityManager.getEntityCountByType(EntityType.BARREL);
      if (existingBarrels < 3) { // Max 3 barrels on screen
        this.spawnBarrel(entityManager);
      }
      this.lastSpawnTime = 0;
    }
  }

  private updateSpawnRate(): void {
    // Slightly increase barrel spawn rate with level, but keep it low
    this.spawnRate = 0.1 + (this.currentLevel - 1) * 0.02;
    // Cap the spawn rate
    this.spawnRate = Math.min(this.spawnRate, 0.3);
  }

  private spawnBarrel(entityManager: EntityManager): void {
    // Random spawn position along the top of the screen
    const spawnX = Math.random() * (this.canvasWidth - 100) + 50; // Leave some margin
    const spawnY = -50; // Start above the screen
    const spawnPosition = new Vector2(spawnX, spawnY);

    const barrel = new Barrel(spawnPosition, this.canvasWidth, this.canvasHeight);
    entityManager.addEntity(barrel);
  }

  // Getters and setters
  getSpawnRate(): number {
    return this.spawnRate;
  }

  setSpawnRate(rate: number): void {
    this.spawnRate = Math.max(0.05, rate);
  }
}