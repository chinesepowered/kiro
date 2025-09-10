import { LevelConfig } from '../types/GameTypes';

export class LevelManager {
  private levelConfigs: Map<number, LevelConfig> = new Map();
  private currentLevel: number = 1;

  constructor() {
    this.initializeLevelConfigs();
  }

  private initializeLevelConfigs(): void {
    // Define level configurations with escalating difficulty
    const levels: LevelConfig[] = [
      {
        levelNumber: 1,
        enemySpawnRate: 0.8,
        enemySpeedMultiplier: 1.0,
        enemyHealthMultiplier: 1.0,
        specialEnemyChance: 0.0
      },
      {
        levelNumber: 2,
        enemySpawnRate: 1.0,
        enemySpeedMultiplier: 1.1,
        enemyHealthMultiplier: 1.0,
        specialEnemyChance: 0.2
      },
      {
        levelNumber: 3,
        enemySpawnRate: 1.2,
        enemySpeedMultiplier: 1.2,
        enemyHealthMultiplier: 1.2,
        specialEnemyChance: 0.3
      },
      {
        levelNumber: 4,
        enemySpawnRate: 1.4,
        enemySpeedMultiplier: 1.3,
        enemyHealthMultiplier: 1.3,
        specialEnemyChance: 0.4
      },
      {
        levelNumber: 5,
        enemySpawnRate: 1.6,
        enemySpeedMultiplier: 1.4,
        enemyHealthMultiplier: 1.5,
        specialEnemyChance: 0.5
      },
      {
        levelNumber: 6,
        enemySpawnRate: 1.8,
        enemySpeedMultiplier: 1.5,
        enemyHealthMultiplier: 1.7,
        specialEnemyChance: 0.6
      },
      {
        levelNumber: 7,
        enemySpawnRate: 2.0,
        enemySpeedMultiplier: 1.6,
        enemyHealthMultiplier: 2.0,
        specialEnemyChance: 0.7
      },
      {
        levelNumber: 8,
        enemySpawnRate: 2.2,
        enemySpeedMultiplier: 1.7,
        enemyHealthMultiplier: 2.2,
        specialEnemyChance: 0.8
      },
      {
        levelNumber: 9,
        enemySpawnRate: 2.5,
        enemySpeedMultiplier: 1.8,
        enemyHealthMultiplier: 2.5,
        specialEnemyChance: 0.9
      },
      {
        levelNumber: 10,
        enemySpawnRate: 3.0,
        enemySpeedMultiplier: 2.0,
        enemyHealthMultiplier: 3.0,
        specialEnemyChance: 1.0
      }
    ];

    // Store level configs
    for (const config of levels) {
      this.levelConfigs.set(config.levelNumber, config);
    }
  }

  setCurrentLevel(level: number): void {
    this.currentLevel = level;
  }

  getCurrentLevel(): number {
    return this.currentLevel;
  }

  getLevelConfig(level?: number): LevelConfig {
    const targetLevel = level || this.currentLevel;
    
    // If level is beyond predefined configs, generate dynamic config
    if (!this.levelConfigs.has(targetLevel)) {
      return this.generateDynamicLevelConfig(targetLevel);
    }

    return this.levelConfigs.get(targetLevel)!;
  }

  private generateDynamicLevelConfig(level: number): LevelConfig {
    // For levels beyond 10, use exponential scaling
    const baseMultiplier = Math.pow(1.1, level - 10);
    
    return {
      levelNumber: level,
      enemySpawnRate: Math.min(3.0 + (level - 10) * 0.2, 8.0), // Cap at 8 enemies/sec
      enemySpeedMultiplier: Math.min(2.0 * baseMultiplier, 4.0), // Cap at 4x speed
      enemyHealthMultiplier: Math.min(3.0 * baseMultiplier, 10.0), // Cap at 10x health
      specialEnemyChance: 1.0 // Always spawn special enemies at high levels
    };
  }

  getEnemiesRequiredForLevel(level?: number): number {
    const targetLevel = level || this.currentLevel;
    return 10 + (targetLevel * 5); // 15 enemies for level 1, 20 for level 2, etc.
  }

  getLevelDuration(): number {
    return 30; // 30 seconds per level
  }

  calculateLevelBonus(level: number): number {
    return level * 100; // 100 points per level
  }

  // Check if player should advance to next level
  shouldAdvanceLevel(timeElapsed: number, enemiesKilled: number): boolean {
    const timeBasedAdvance = timeElapsed >= this.getLevelDuration();
    const killBasedAdvance = enemiesKilled >= this.getEnemiesRequiredForLevel();
    
    return timeBasedAdvance || killBasedAdvance;
  }

  // Get level progress (0-1)
  getLevelProgress(timeElapsed: number, enemiesKilled: number): number {
    const timeProgress = timeElapsed / this.getLevelDuration();
    const killProgress = enemiesKilled / this.getEnemiesRequiredForLevel();
    
    return Math.max(timeProgress, killProgress);
  }

  // Get next level preview
  getNextLevelPreview(): string {
    const nextLevel = this.currentLevel + 1;
    const config = this.getLevelConfig(nextLevel);
    
    return `Level ${nextLevel}: ${Math.round(config.enemySpawnRate * 10)/10}x spawn rate, ${Math.round(config.enemySpeedMultiplier * 10)/10}x speed`;
  }
}