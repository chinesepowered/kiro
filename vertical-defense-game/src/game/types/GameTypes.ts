// Game type definitions will be implemented here
export interface GameState {
  currentLevel: number;
  score: number;
  lives: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'game_over';
}