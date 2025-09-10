import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';
import { EntityType } from '../types/EntityTypes';
import { InputSystem } from '../systems/InputSystem';

export class Player extends Entity {
  private inputSystem: InputSystem;
  private moveSpeed: number = 300; // pixels per second
  private canvasWidth: number;
  private canvasHeight: number;
  private fireRate: number = 0.3; // seconds between shots
  private lastShotTime: number = 0;

  constructor(
    inputSystem: InputSystem,
    canvasWidth: number,
    canvasHeight: number,
    position?: Vector2
  ) {
    const startPosition = position || new Vector2(canvasWidth / 2, canvasHeight - 50);
    const playerSize = new Vector2(40, 40);
    const playerHealth = 3;

    super(EntityType.PLAYER, startPosition, playerSize, playerHealth);

    this.inputSystem = inputSystem;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  update(deltaTime: number): void {
    this.handleInput(deltaTime);
    this.constrainToBounds();
  }

  // Auto-shooting method to be called by game engine
  shouldAutoShoot(): boolean {
    return this.canShoot();
  }

  private handleInput(deltaTime: number): void {
    const velocity = new Vector2();

    // Handle horizontal movement
    if (this.inputSystem.isLeftPressed()) {
      velocity.x = -this.moveSpeed;
    }
    if (this.inputSystem.isRightPressed()) {
      velocity.x = this.moveSpeed;
    }

    // Handle vertical movement (optional - for more dynamic gameplay)
    if (this.inputSystem.isUpPressed()) {
      velocity.y = -this.moveSpeed * 0.5; // Slower vertical movement
    }
    if (this.inputSystem.isDownPressed()) {
      velocity.y = this.moveSpeed * 0.5;
    }

    this.setVelocity(velocity);

    // Update last shot time
    this.lastShotTime += deltaTime;
  }

  private constrainToBounds(): void {
    const position = this.getPosition();
    const size = this.getSize();
    const halfWidth = size.x / 2;
    const halfHeight = size.y / 2;

    // Constrain horizontal movement
    if (position.x - halfWidth < 0) {
      position.x = halfWidth;
    } else if (position.x + halfWidth > this.canvasWidth) {
      position.x = this.canvasWidth - halfWidth;
    }

    // Constrain vertical movement (keep player in bottom portion of screen)
    const minY = this.canvasHeight * 0.6; // Allow player in bottom 40% of screen
    const maxY = this.canvasHeight - halfHeight;

    if (position.y - halfHeight < minY) {
      position.y = minY + halfHeight;
    } else if (position.y + halfHeight > maxY) {
      position.y = maxY;
    }

    this.setPosition(position);
  }

  render(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();

    // Draw Kiro as a distinctive character - triangle with Kiro's signature cyan color
    context.fillStyle = '#00ffcc'; // Kiro's signature cyan
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;

    context.beginPath();
    // Triangle pointing up (representing Kiro)
    context.moveTo(position.x, position.y - size.y / 2); // Top point
    context.lineTo(position.x - size.x / 2, position.y + size.y / 2); // Bottom left
    context.lineTo(position.x + size.x / 2, position.y + size.y / 2); // Bottom right
    context.closePath();

    context.fill();
    context.stroke();

    // Add Kiro's distinctive glow effect
    const glowAlpha = 0.3 + 0.2 * Math.sin(Date.now() * 0.005);
    context.fillStyle = `rgba(0, 255, 204, ${glowAlpha})`;
    context.beginPath();
    context.moveTo(position.x, position.y - size.y / 2 - 2);
    context.lineTo(position.x - size.x / 2 - 2, position.y + size.y / 2 + 2);
    context.lineTo(position.x + size.x / 2 + 2, position.y + size.y / 2 + 2);
    context.closePath();
    context.fill();

    // Draw shield effect if active
    if (this.shieldActive) {
      this.drawShieldEffect(context);
    }

    // Draw health indicator
    this.drawHealthBar(context);
  }

  private drawShieldEffect(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();
    const shieldRadius = Math.max(size.x, size.y) / 2 + 8;

    // Pulsing shield effect
    const pulseAlpha = 0.3 + 0.2 * Math.sin(Date.now() * 0.01);
    
    context.strokeStyle = `rgba(0, 153, 255, ${pulseAlpha})`;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(position.x, position.y, shieldRadius, 0, Math.PI * 2);
    context.stroke();

    // Inner glow
    context.strokeStyle = `rgba(255, 255, 255, ${pulseAlpha * 0.5})`;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(position.x, position.y, shieldRadius - 2, 0, Math.PI * 2);
    context.stroke();
  }

  private drawHealthBar(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();
    const barWidth = size.x;
    const barHeight = 4;
    const barY = position.y + size.y / 2 + 8;

    // Background
    context.fillStyle = '#333333';
    context.fillRect(
      position.x - barWidth / 2,
      barY,
      barWidth,
      barHeight
    );

    // Health bar
    const healthPercent = this.getHealth() / this.getMaxHealth();
    const healthColor = healthPercent > 0.6 ? '#00ff00' : 
                       healthPercent > 0.3 ? '#ffff00' : '#ff0000';
    
    context.fillStyle = healthColor;
    context.fillRect(
      position.x - barWidth / 2,
      barY,
      barWidth * healthPercent,
      barHeight
    );
  }

  // Shooting methods
  canShoot(): boolean {
    return this.lastShotTime >= this.fireRate;
  }

  shoot(): Vector2 | null {
    if (!this.canShoot()) return null;

    this.lastShotTime = 0;
    
    // Return the position where the projectile should spawn
    const position = this.getPosition();
    const size = this.getSize();
    return new Vector2(position.x, position.y - size.y / 2 - 5);
  }

  // Getters and setters
  getMoveSpeed(): number {
    return this.moveSpeed;
  }

  setMoveSpeed(speed: number): void {
    this.moveSpeed = speed;
  }

  getFireRate(): number {
    return this.fireRate;
  }

  setFireRate(rate: number): void {
    this.fireRate = Math.max(0.05, rate); // Minimum fire rate
  }

  // Shield functionality
  private shieldActive: boolean = false;

  setShieldActive(active: boolean): void {
    this.shieldActive = active;
  }

  isShieldActive(): boolean {
    return this.shieldActive;
  }

  // Override takeDamage to handle shield
  takeDamage(damage: number): void {
    if (this.shieldActive) {
      // Shield blocks damage
      return;
    }
    super.takeDamage(damage);
    // Note: Damage sound will be played by the game engine
  }

  // Override collision behavior
  onCollision(other: Entity): void {
    const otherType = other.getEntityType();
    
    switch (otherType) {
      case EntityType.ENEMY:
        this.takeDamage(1);
        break;
      case EntityType.POWERUP:
        // Power-up collection will be handled by the power-up entity
        break;
      default:
        break;
    }
  }
}