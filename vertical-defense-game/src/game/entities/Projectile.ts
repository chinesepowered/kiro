import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';
import { EntityType } from '../types/EntityTypes';

export class Projectile extends Entity {
  private damage: number;
  private owner: 'player' | 'enemy';
  private speed: number;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(
    position: Vector2,
    direction: Vector2,
    owner: 'player' | 'enemy' = 'player',
    damage: number = 1,
    speed: number = 500
  ) {
    const projectileSize = new Vector2(6, 12);
    super(EntityType.PROJECTILE, position, projectileSize, 1);

    this.damage = damage;
    this.owner = owner;
    this.speed = speed;
    this.canvasWidth = 800; // Will be set by game engine
    this.canvasHeight = 600; // Will be set by game engine

    // Set velocity based on direction and speed
    const normalizedDirection = direction.normalize();
    this.setVelocity(normalizedDirection.multiply(speed));
  }

  update(deltaTime: number): void {
    // Check if projectile is out of bounds
    if (!this.isInBounds()) {
      this.destroy();
    }
  }

  render(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();

    if (this.owner === 'player') {
      // Player projectiles - bright blue/white
      context.fillStyle = '#00ffff';
      context.strokeStyle = '#ffffff';
    } else {
      // Enemy projectiles - red/orange
      context.fillStyle = '#ff4444';
      context.strokeStyle = '#ff8888';
    }

    context.lineWidth = 1;

    // Draw projectile as a small rectangle/bullet
    context.fillRect(
      position.x - size.x / 2,
      position.y - size.y / 2,
      size.x,
      size.y
    );

    // Add a small glow effect
    context.strokeRect(
      position.x - size.x / 2,
      position.y - size.y / 2,
      size.x,
      size.y
    );

    // Add trail effect for player projectiles
    if (this.owner === 'player') {
      context.fillStyle = 'rgba(0, 255, 255, 0.3)';
      context.fillRect(
        position.x - size.x / 2,
        position.y + size.y / 2,
        size.x,
        size.y * 0.5
      );
    }
  }

  private isInBounds(): boolean {
    const position = this.getPosition();
    const size = this.getSize();

    return (
      position.x + size.x / 2 >= 0 &&
      position.x - size.x / 2 <= this.canvasWidth &&
      position.y + size.y / 2 >= 0 &&
      position.y - size.y / 2 <= this.canvasHeight
    );
  }

  // Getters
  getDamage(): number {
    return this.damage;
  }

  getOwner(): 'player' | 'enemy' {
    return this.owner;
  }

  // Setters for canvas bounds
  setCanvasBounds(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  // Override collision behavior
  onCollision(other: Entity): void {
    const otherType = other.getEntityType();
    
    // Player projectiles hit enemies and barrels
    if (this.owner === 'player') {
      if (otherType === EntityType.ENEMY || otherType === EntityType.BARREL) {
        other.takeDamage(this.damage);
        this.destroy();
      }
    }
    // Enemy projectiles hit player
    else if (this.owner === 'enemy') {
      if (otherType === EntityType.PLAYER) {
        other.takeDamage(this.damage);
        this.destroy();
      }
    }
  }
}