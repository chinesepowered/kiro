// Game type definitions will be implemented here
export interface GameState {
  currentLevel: number;
  score: number;
  lives: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'game_over';
}

export interface GameStats {
  enemiesKilled: number;
  projectilesFired: number;
  accuracy: number;
  timeAlive: number;
  levelsCompleted: number;
}

export interface LevelConfig {
  levelNumber: number;
  enemySpawnRate: number;
  enemySpeedMultiplier: number;
  enemyHealthMultiplier: number;
  specialEnemyChance: number;
}