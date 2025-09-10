import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';
import { EntityType } from '../types/EntityTypes';
import { PowerUpType, PowerUpConfig } from '../types/PowerUpTypes';

export class PowerUp extends Entity {
  private powerUpType: PowerUpType;
  private config: PowerUpConfig;
  private canvasWidth: number;
  private canvasHeight: number;
  private floatOffset: number = 0;
  private lifeTime: number = 0;
  private maxLifeTime: number = 15; // Power-ups disappear after 15 seconds

  constructor(
    position: Vector2,
    powerUpType: PowerUpType,
    canvasWidth: number = 800,
    canvasHeight: number = 600
  ) {
    const powerUpSize = new Vector2(24, 24);
    super(EntityType.POWERUP, position, powerUpSize, 1);

    this.powerUpType = powerUpType;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.config = this.getPowerUpConfig(powerUpType);

    // Power-ups float in place with slight movement
    this.setVelocity(new Vector2(0, 20)); // Slow downward drift
  }

  update(deltaTime: number): void {
    this.lifeTime += deltaTime;
    this.floatOffset += deltaTime * 3; // For floating animation

    // Destroy power-up if it's been around too long
    if (this.lifeTime > this.maxLifeTime) {
      this.destroy();
    }

    // Check if power-up has fallen off screen
    if (this.hasReachedBottom()) {
      this.destroy();
    }
  }

  private hasReachedBottom(): boolean {
    const position = this.getPosition();
    const size = this.getSize();
    return position.y - size.y / 2 > this.canvasHeight + 50;
  }

  private getPowerUpConfig(type: PowerUpType): PowerUpConfig {
    switch (type) {
      case PowerUpType.RAPID_FIRE:
        return {
          type,
          duration: 8,
          value: 0.5, // Multiply fire rate by 0.5 (faster)
          rarity: 0.3,
          color: '#ff6600',
          description: 'Rapid Fire'
        };
      case PowerUpType.MULTI_SHOT:
        return {
          type,
          duration: 10,
          value: 3, // Fire 3 projectiles
          rarity: 0.2,
          color: '#00ff00',
          description: 'Multi Shot'
        };
      case PowerUpType.SHIELD:
        return {
          type,
          duration: 12,
          value: 1, // Invincibility
          rarity: 0.1,
          color: '#0099ff',
          description: 'Shield'
        };
      case PowerUpType.DAMAGE_BOOST:
        return {
          type,
          duration: 15,
          value: 2, // Double damage
          rarity: 0.25,
          color: '#ff0099',
          description: 'Damage Boost'
        };
      case PowerUpType.HEALTH_RESTORE:
        return {
          type,
          duration: 0, // Instant effect
          value: 1, // Restore 1 health
          rarity: 0.4,
          color: '#ff0000',
          description: 'Health Restore'
        };
      default:
        return {
          type,
          duration: 5,
          value: 1,
          rarity: 0.5,
          color: '#ffffff',
          description: 'Unknown'
        };
    }
  }

  render(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();

    // Add floating animation
    const floatY = position.y + Math.sin(this.floatOffset) * 3;

    // Draw power-up with pulsing glow effect
    const pulseAlpha = 0.6 + 0.4 * Math.sin(this.floatOffset * 2);
    
    // Outer glow
    context.fillStyle = `rgba(${this.hexToRgb(this.config.color)}, ${pulseAlpha * 0.3})`;
    context.fillRect(
      position.x - size.x / 2 - 4,
      floatY - size.y / 2 - 4,
      size.x + 8,
      size.y + 8
    );

    // Main power-up body
    context.fillStyle = this.config.color;
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;

    // Draw different shapes based on power-up type
    switch (this.powerUpType) {
      case PowerUpType.RAPID_FIRE:
        // Draw as a diamond
        context.beginPath();
        context.moveTo(position.x, floatY - size.y / 2);
        context.lineTo(position.x + size.x / 2, floatY);
        context.lineTo(position.x, floatY + size.y / 2);
        context.lineTo(position.x - size.x / 2, floatY);
        context.closePath();
        break;
      case PowerUpType.MULTI_SHOT:
        // Draw as a triangle
        context.beginPath();
        context.moveTo(position.x, floatY - size.y / 2);
        context.lineTo(position.x + size.x / 2, floatY + size.y / 2);
        context.lineTo(position.x - size.x / 2, floatY + size.y / 2);
        context.closePath();
        break;
      case PowerUpType.SHIELD:
        // Draw as a hexagon
        context.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = position.x + Math.cos(angle) * size.x / 2;
          const y = floatY + Math.sin(angle) * size.y / 2;
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.closePath();
        break;
      case PowerUpType.DAMAGE_BOOST:
        // Draw as a star
        context.beginPath();
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5;
          const radius = i % 2 === 0 ? size.x / 2 : size.x / 4;
          const x = position.x + Math.cos(angle) * radius;
          const y = floatY + Math.sin(angle) * radius;
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.closePath();
        break;
      case PowerUpType.HEALTH_RESTORE:
        // Draw as a cross/plus
        context.fillRect(position.x - size.x / 6, floatY - size.y / 2, size.x / 3, size.y);
        context.fillRect(position.x - size.x / 2, floatY - size.y / 6, size.x, size.y / 3);
        break;
      default:
        // Draw as a circle
        context.beginPath();
        context.arc(position.x, floatY, size.x / 2, 0, Math.PI * 2);
        break;
    }

    if (this.powerUpType !== PowerUpType.HEALTH_RESTORE) {
      context.fill();
      context.stroke();
    } else {
      context.strokeRect(position.x - size.x / 6, floatY - size.y / 2, size.x / 3, size.y);
      context.strokeRect(position.x - size.x / 2, floatY - size.y / 6, size.x, size.y / 3);
    }

    // Draw power-up name
    context.fillStyle = '#ffffff';
    context.font = '10px Arial';
    context.textAlign = 'center';
    context.fillText(this.config.description, position.x, floatY + size.y / 2 + 12);
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '255, 255, 255';
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `${r}, ${g}, ${b}`;
  }

  // Getters
  getPowerUpType(): PowerUpType {
    return this.powerUpType;
  }

  getConfig(): PowerUpConfig {
    return this.config;
  }

  // Override collision behavior
  onCollision(other: Entity): void {
    const otherType = other.getEntityType();
    
    if (otherType === EntityType.PLAYER) {
      // Power-up collection is handled by the player or game engine
      this.destroy();
    }
  }
}