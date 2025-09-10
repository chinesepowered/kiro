export enum PowerUpType {
  RAPID_FIRE = 'rapid_fire',
  MULTI_SHOT = 'multi_shot',
  SHIELD = 'shield',
  DAMAGE_BOOST = 'damage_boost',
  HEALTH_RESTORE = 'health_restore'
}

export interface PowerUpEffect {
  type: PowerUpType;
  duration: number; // in seconds, 0 for permanent effects
  value: number; // multiplier or amount
  active: boolean;
  timeRemaining: number;
}

export interface PowerUpConfig {
  type: PowerUpType;
  duration: number;
  value: number;
  rarity: number; // 0-1, lower is rarer
  color: string;
  description: string;
}