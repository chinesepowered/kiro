import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';
import { EntityType } from '../types/EntityTypes';

export class Enemy extends Entity {
  private points: number;
  private speed: number;
  private attackDamage: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private enemyType: 'basic' | 'fast' | 'heavy';

  constructor(
    position: Vector2,
    enemyType: 'basic' | 'fast' | 'heavy' = 'basic',
    canvasWidth: number = 800,
    canvasHeight: number = 600
  ) {
    // Set enemy properties based on type
    let size: Vector2;
    let health: number;
    let speed: number;
    let points: number;
    let attackDamage: number;

    switch (enemyType) {
      case 'fast':
        size = new Vector2(25, 25);
        health = 1;
        speed = 120;
        points = 15;
        attackDamage = 1;
        break;
      case 'heavy':
        size = new Vector2(50, 50);
        health = 3;
        speed = 60;
        points = 30;
        attackDamage = 2;
        break;
      default: // basic
        size = new Vector2(35, 35);
        health = 2;
        speed = 80;
        points = 10;
        attackDamage = 1;
        break;
    }

    super(EntityType.ENEMY, position, size, health);

    this.enemyType = enemyType;
    this.points = points;
    this.speed = speed;
    this.attackDamage = attackDamage;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Set initial velocity (moving downward)
    this.setVelocity(new Vector2(0, speed));
  }

  update(deltaTime: number): void {
    // Move towards player (downward)
    this.moveTowardsPlayer();

    // Check if enemy has reached the bottom of the screen
    if (this.hasReachedBottom()) {
      this.destroy();
    }
  }

  private moveTowardsPlayer(): void {
    // Simple downward movement for now
    // Could be enhanced later with more sophisticated AI
    const velocity = new Vector2(0, this.speed);
    this.setVelocity(velocity);
  }

  private hasReachedBottom(): boolean {
    const position = this.getPosition();
    const size = this.getSize();
    return position.y - size.y / 2 > this.canvasHeight;
  }

  render(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();

    // Set colors based on enemy type
    let fillColor: string;
    let strokeColor: string;

    switch (this.enemyType) {
      case 'fast':
        fillColor = '#ff6600'; // Orange
        strokeColor = '#ff9944';
        break;
      case 'heavy':
        fillColor = '#cc0000'; // Dark red
        strokeColor = '#ff4444';
        break;
      default: // basic
        fillColor = '#ff0000'; // Red
        strokeColor = '#ff6666';
        break;
    }

    context.fillStyle = fillColor;
    context.strokeStyle = strokeColor;
    context.lineWidth = 2;

    // Draw enemy as a diamond/rhombus shape
    context.beginPath();
    context.moveTo(position.x, position.y - size.y / 2); // Top
    context.lineTo(position.x + size.x / 2, position.y); // Right
    context.lineTo(position.x, position.y + size.y / 2); // Bottom
    context.lineTo(position.x - size.x / 2, position.y); // Left
    context.closePath();

    context.fill();
    context.stroke();

    // Draw health indicator for enemies with more than 1 HP
    if (this.getMaxHealth() > 1) {
      this.drawHealthBar(context);
    }

    // Add pulsing effect for heavy enemies
    if (this.enemyType === 'heavy') {
      const pulseAlpha = 0.3 + 0.2 * Math.sin(Date.now() * 0.01);
      context.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
      context.fill();
    }
  }

  private drawHealthBar(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();
    const barWidth = size.x * 0.8;
    const barHeight = 3;
    const barY = position.y - size.y / 2 - 8;

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

  // Getters
  getPoints(): number {
    return this.points;
  }

  getAttackDamage(): number {
    return this.attackDamage;
  }

  getEnemyType(): 'basic' | 'fast' | 'heavy' {
    return this.enemyType;
  }

  // Override collision behavior
  onCollision(other: Entity): void {
    const otherType = other.getEntityType();
    
    switch (otherType) {
      case EntityType.PROJECTILE:
        // Damage is handled by the projectile
        break;
      case EntityType.PLAYER:
        // Damage the player and destroy this enemy
        other.takeDamage(this.attackDamage);
        this.destroy();
        break;
      default:
        break;
    }
  }

  // Override destroy to handle scoring
  destroy(): void {
    super.destroy();
    // Note: Scoring will be handled by the game engine when it detects enemy destruction
  }
}