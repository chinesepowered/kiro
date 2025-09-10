export enum EntityType {
  PLAYER = 'player',
  ENEMY = 'enemy',
  PROJECTILE = 'projectile',
  POWERUP = 'powerup',
  BARREL = 'barrel',
  PARTICLE = 'particle'
}

export interface CollisionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EntityConfig {
  position?: { x: number; y: number };
  size?: { x: number; y: number };
  health?: number;
  velocity?: { x: number; y: number };
}