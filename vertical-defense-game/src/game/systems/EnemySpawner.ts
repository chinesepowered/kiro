import { Enemy } from '../entities/Enemy';
import { Vector2 } from '../utils/Vector2';
import { EntityManager } from '../engine/EntityManager';

export class EnemySpawner {
  private canvasWidth: number;
  private canvasHeight: number;
  private spawnRate: number; // enemies per second
  private lastSpawnTime: number = 0;
  private currentLevel: number = 1;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.spawnRate = 1.0; // Start with 1 enemy per second
  }

  update(deltaTime: number, entityManager: EntityManager, level: number): void {
    this.currentLevel = level;
    this.updateSpawnRate();
    
    this.lastSpawnTime += deltaTime;
    
    const spawnInterval = 1.0 / this.spawnRate;
    if (this.lastSpawnTime >= spawnInterval) {
      this.spawnEnemy(entityManager);
      this.lastSpawnTime = 0;
    }
  }

  private updateSpawnRate(): void {
    // Increase spawn rate based on level
    this.spawnRate = 0.8 + (this.currentLevel - 1) * 0.3;
    // Cap the spawn rate to prevent overwhelming
    this.spawnRate = Math.min(this.spawnRate, 4.0);
  }

  private spawnEnemy(entityManager: EntityManager): void {
    // Random spawn position along the top of the screen
    const spawnX = Math.random() * (this.canvasWidth - 100) + 50; // Leave some margin
    const spawnY = -50; // Start above the screen
    const spawnPosition = new Vector2(spawnX, spawnY);

    // Choose enemy type based on level and random chance
    const enemyType = this.chooseEnemyType();

    const enemy = new Enemy(spawnPosition, enemyType, this.canvasWidth, this.canvasHeight);
    entityManager.addEntity(enemy);
  }

  private chooseEnemyType(): 'basic' | 'fast' | 'heavy' {
    const random = Math.random();
    
    // Enemy type distribution based on level
    if (this.currentLevel >= 3) {
      // Level 3+: All enemy types
      if (random < 0.6) return 'basic';
      if (random < 0.85) return 'fast';
      return 'heavy';
    } else if (this.currentLevel >= 2) {
      // Level 2: Basic and fast enemies
      if (random < 0.7) return 'basic';
      return 'fast';
    } else {
      // Level 1: Only basic enemies
      return 'basic';
    }
  }

  // Getters and setters
  getSpawnRate(): number {
    return this.spawnRate;
  }

  setSpawnRate(rate: number): void {
    this.spawnRate = Math.max(0.1, rate);
  }
}