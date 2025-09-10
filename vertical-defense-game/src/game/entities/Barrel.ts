import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';
import { EntityType } from '../types/EntityTypes';
import { PowerUpType } from '../types/PowerUpTypes';

export class Barrel extends Entity {
  private canvasWidth: number;
  private canvasHeight: number;
  private fallSpeed: number = 60; // pixels per second
  private powerUpType: PowerUpType | null = null;

  constructor(
    position: Vector2,
    canvasWidth: number = 800,
    canvasHeight: number = 600
  ) {
    const barrelSize = new Vector2(30, 30);
    const barrelHealth = 1;

    super(EntityType.BARREL, position, barrelSize, barrelHealth);

    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Set initial velocity (falling downward slowly)
    this.setVelocity(new Vector2(0, this.fallSpeed));

    // Randomly assign a power-up type that will drop when destroyed
    this.powerUpType = this.generateRandomPowerUp();
  }

  update(deltaTime: number): void {
    // Check if barrel has fallen off screen
    if (this.hasReachedBottom()) {
      this.destroy();
    }
  }

  private hasReachedBottom(): boolean {
    const position = this.getPosition();
    const size = this.getSize();
    return position.y - size.y / 2 > this.canvasHeight + 50;
  }

  private generateRandomPowerUp(): PowerUpType {
    const random = Math.random();
    
    // Power-up distribution (rarer = lower chance)
    if (random < 0.3) return PowerUpType.RAPID_FIRE;
    if (random < 0.5) return PowerUpType.MULTI_SHOT;
    if (random < 0.7) return PowerUpType.DAMAGE_BOOST;
    if (random < 0.9) return PowerUpType.HEALTH_RESTORE;
    return PowerUpType.SHIELD; // Rarest
  }

  render(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();

    // Draw barrel as a brown/wooden crate
    context.fillStyle = '#8B4513'; // Brown
    context.strokeStyle = '#654321'; // Darker brown
    context.lineWidth = 2;

    // Main barrel body
    context.fillRect(
      position.x - size.x / 2,
      position.y - size.y / 2,
      size.x,
      size.y
    );

    context.strokeRect(
      position.x - size.x / 2,
      position.y - size.y / 2,
      size.x,
      size.y
    );

    // Add wooden slats for texture
    context.strokeStyle = '#654321';
    context.lineWidth = 1;
    
    // Vertical slats
    for (let i = 1; i < 3; i++) {
      const x = position.x - size.x / 2 + (size.x / 3) * i;
      context.beginPath();
      context.moveTo(x, position.y - size.y / 2);
      context.lineTo(x, position.y + size.y / 2);
      context.stroke();
    }

    // Horizontal bands
    for (let i = 1; i < 3; i++) {
      const y = position.y - size.y / 2 + (size.y / 3) * i;
      context.beginPath();
      context.moveTo(position.x - size.x / 2, y);
      context.lineTo(position.x + size.x / 2, y);
      context.stroke();
    }

    // Add a subtle glow to indicate it contains power-ups
    const glowAlpha = 0.3 + 0.2 * Math.sin(Date.now() * 0.005);
    context.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`; // Golden glow
    context.fillRect(
      position.x - size.x / 2 - 2,
      position.y - size.y / 2 - 2,
      size.x + 4,
      size.y + 4
    );
  }

  // Getters
  getPowerUpType(): PowerUpType | null {
    return this.powerUpType;
  }

  // Override collision behavior
  onCollision(other: Entity): void {
    const otherType = other.getEntityType();
    
    switch (otherType) {
      case EntityType.PROJECTILE:
        // Barrel is destroyed by projectiles, power-up drop handled by game engine
        this.destroy();
        break;
      case EntityType.PLAYER:
        // Player can also destroy barrels by touching them
        this.destroy();
        break;
      default:
        break;
    }
  }
}