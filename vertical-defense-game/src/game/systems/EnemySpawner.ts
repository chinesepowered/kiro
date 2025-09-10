import { Enemy } from '../entities/Enemy';
import { BossEnemy } from '../entities/BossEnemy';
import { Vector2 } from '../utils/Vector2';
import { EntityManager } from '../engine/EntityManager';
import { LevelManager } from './LevelManager';
import { EntityType } from '../types/EntityTypes';

export class EnemySpawner {
  private canvasWidth: number;
  private canvasHeight: number;
  private spawnRate: number; // enemies per second
  private lastSpawnTime: number = 0;
  private currentLevel: number = 1;
  private levelManager: LevelManager;
  private lastBossSpawn: number = 0;
  private bossSpawnInterval: number = 45; // Spawn boss every 45 seconds

  constructor(canvasWidth: number, canvasHeight: number, levelManager: LevelManager) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.levelManager = levelManager;
    this.spawnRate = 1.0; // Start with 1 enemy per second
  }

  update(deltaTime: number, entityManager: EntityManager, level: number): void {
    this.currentLevel = level;
    this.updateSpawnRate();
    
    this.lastSpawnTime += deltaTime;
    this.lastBossSpawn += deltaTime;
    
    // Check for boss spawn (only after level 3)
    if (this.currentLevel >= 3 && this.lastBossSpawn >= this.bossSpawnInterval) {
      this.spawnBoss(entityManager);
      this.lastBossSpawn = 0;
    }
    
    // Regular enemy spawning
    const spawnInterval = 1.0 / this.spawnRate;
    if (this.lastSpawnTime >= spawnInterval) {
      this.spawnEnemy(entityManager);
      this.lastSpawnTime = 0;
    }
  }

  private updateSpawnRate(): void {
    // Use level manager to get spawn rate
    const levelConfig = this.levelManager.getLevelConfig(this.currentLevel);
    this.spawnRate = levelConfig.enemySpawnRate;
  }

  private spawnEnemy(entityManager: EntityManager): void {
    // Random spawn position along the top of the screen
    const spawnX = Math.random() * (this.canvasWidth - 100) + 50; // Leave some margin
    const spawnY = -50; // Start above the screen
    const spawnPosition = new Vector2(spawnX, spawnY);

    // Choose enemy type based on level and random chance
    const enemyType = this.chooseEnemyType();
    
    // Get level multipliers
    const levelConfig = this.levelManager.getLevelConfig(this.currentLevel);

    const enemy = new Enemy(
      spawnPosition, 
      enemyType, 
      this.canvasWidth, 
      this.canvasHeight,
      levelConfig.enemySpeedMultiplier,
      levelConfig.enemyHealthMultiplier
    );
    entityManager.addEntity(enemy);
  }

  private chooseEnemyType(): 'basic' | 'fast' | 'heavy' {
    const random = Math.random();
    const levelConfig = this.levelManager.getLevelConfig(this.currentLevel);
    
    // Use special enemy chance from level config
    if (random < levelConfig.specialEnemyChance) {
      // Spawn special enemies (fast or heavy)
      if (this.currentLevel >= 3) {
        // Level 3+: Both fast and heavy
        return random < 0.7 ? 'fast' : 'heavy';
      } else {
        // Level 2: Only fast enemies
        return 'fast';
      }
    } else {
      // Spawn basic enemies
      return 'basic';
    }
  }

  private spawnBoss(entityManager: EntityManager): void {
    // Don't spawn boss if there's already one active
    const existingBosses = entityManager.getEntitiesByEntityType(EntityType.ENEMY)
      .filter(enemy => enemy instanceof BossEnemy);
    
    if (existingBosses.length > 0) {
      return;
    }

    // Spawn boss from random side of the screen
    const spawnFromLeft = Math.random() < 0.5;
    const spawnX = spawnFromLeft ? -100 : this.canvasWidth + 100;
    const spawnY = -100;
    const spawnPosition = new Vector2(spawnX, spawnY);

    // Get level multipliers
    const levelConfig = this.levelManager.getLevelConfig(this.currentLevel);

    const boss = new BossEnemy(
      spawnPosition,
      this.canvasWidth,
      this.canvasHeight,
      levelConfig.enemySpeedMultiplier,
      levelConfig.enemyHealthMultiplier
    );
    
    entityManager.addEntity(boss);
    console.log(`Boss spawned at level ${this.currentLevel}!`);
  }

  // Getters and setters
  getSpawnRate(): number {
    return this.spawnRate;
  }

  setSpawnRate(rate: number): void {
    this.spawnRate = Math.max(0.1, rate);
  }

  getBossSpawnInterval(): number {
    return this.bossSpawnInterval;
  }

  setBossSpawnInterval(interval: number): void {
    this.bossSpawnInterval = Math.max(20, interval);
  }
}