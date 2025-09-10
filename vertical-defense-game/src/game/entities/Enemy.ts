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
  private movementTimer: number = 0;
  private zigzagDirection: number = 1;
  private originalSpeed: number;

  constructor(
    position: Vector2,
    enemyType: 'basic' | 'fast' | 'heavy' = 'basic',
    canvasWidth: number = 800,
    canvasHeight: number = 600,
    speedMultiplier: number = 1.0,
    healthMultiplier: number = 1.0
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
        health = Math.ceil(1 * healthMultiplier);
        speed = 120 * speedMultiplier;
        points = 15;
        attackDamage = 1;
        break;
      case 'heavy':
        size = new Vector2(50, 50);
        health = Math.ceil(3 * healthMultiplier);
        speed = 60 * speedMultiplier;
        points = 30;
        attackDamage = 2;
        break;
      default: // basic
        size = new Vector2(35, 35);
        health = Math.ceil(2 * healthMultiplier);
        speed = 80 * speedMultiplier;
        points = 10;
        attackDamage = 1;
        break;
    }

    super(EntityType.ENEMY, position, size, health);

    this.enemyType = enemyType;
    this.points = points;
    this.speed = speed;
    this.originalSpeed = speed;
    this.attackDamage = attackDamage;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Set initial velocity based on enemy type
    this.initializeMovement();
  }

  update(deltaTime: number): void {
    this.movementTimer += deltaTime;

    // Update movement based on enemy type
    this.updateMovement(deltaTime);

    // Check if enemy has reached the bottom of the screen
    if (this.hasReachedBottom()) {
      this.destroy();
    }
  }

  private initializeMovement(): void {
    switch (this.enemyType) {
      case 'fast':
        // Fast enemies move straight down quickly
        this.setVelocity(new Vector2(0, this.speed));
        break;
      case 'heavy':
        // Heavy enemies move slowly but steadily
        this.setVelocity(new Vector2(0, this.speed));
        break;
      default: // basic
        // Basic enemies have simple downward movement
        this.setVelocity(new Vector2(0, this.speed));
        break;
    }
  }

  private updateMovement(deltaTime: number): void {
    switch (this.enemyType) {
      case 'fast':
        this.updateFastEnemyMovement(deltaTime);
        break;
      case 'heavy':
        this.updateHeavyEnemyMovement(deltaTime);
        break;
      default: // basic
        this.updateBasicEnemyMovement(deltaTime);
        break;
    }
  }

  private updateBasicEnemyMovement(deltaTime: number): void {
    // Basic enemies zigzag slightly as they move down
    const zigzagSpeed = 30; // pixels per second horizontal movement
    const zigzagFrequency = 2; // direction changes per second
    
    if (this.movementTimer > 1 / zigzagFrequency) {
      this.zigzagDirection *= -1;
      this.movementTimer = 0;
    }

    const horizontalVelocity = zigzagSpeed * this.zigzagDirection;
    this.setVelocity(new Vector2(horizontalVelocity, this.speed));
  }

  private updateFastEnemyMovement(deltaTime: number): void {
    // Fast enemies move in a sine wave pattern
    const waveAmplitude = 50; // pixels
    const waveFrequency = 3; // waves per second
    
    const position = this.getPosition();
    const waveOffset = Math.sin(this.movementTimer * waveFrequency * Math.PI * 2) * waveAmplitude;
    
    // Calculate horizontal velocity to create wave motion
    const horizontalVelocity = Math.cos(this.movementTimer * waveFrequency * Math.PI * 2) * waveAmplitude * waveFrequency * Math.PI * 2;
    
    this.setVelocity(new Vector2(horizontalVelocity, this.speed));
  }

  private updateHeavyEnemyMovement(deltaTime: number): void {
    // Heavy enemies move straight down but occasionally pause and speed up
    const pauseInterval = 3; // seconds between behavior changes
    const speedBoostDuration = 1; // seconds of speed boost
    
    const cycleTime = this.movementTimer % pauseInterval;
    
    if (cycleTime < speedBoostDuration) {
      // Speed boost phase
      this.setVelocity(new Vector2(0, this.originalSpeed * 1.5));
    } else if (cycleTime < speedBoostDuration + 0.5) {
      // Brief pause
      this.setVelocity(new Vector2(0, this.originalSpeed * 0.2));
    } else {
      // Normal movement
      this.setVelocity(new Vector2(0, this.originalSpeed));
    }
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

    // Draw different shapes based on enemy type
    this.drawEnemyShape(context, position, size);

    // Draw health indicator for enemies with more than 1 HP
    if (this.getMaxHealth() > 1) {
      this.drawHealthBar(context);
    }

    // Add special effects based on enemy type
    this.drawSpecialEffects(context, position, size);
  }

  private drawEnemyShape(context: CanvasRenderingContext2D, position: Vector2, size: Vector2): void {
    switch (this.enemyType) {
      case 'fast':
        // Fast enemies - triangle pointing down (aggressive)
        context.beginPath();
        context.moveTo(position.x, position.y + size.y / 2); // Bottom point
        context.lineTo(position.x - size.x / 2, position.y - size.y / 2); // Top left
        context.lineTo(position.x + size.x / 2, position.y - size.y / 2); // Top right
        context.closePath();
        break;
      case 'heavy':
        // Heavy enemies - hexagon (sturdy)
        context.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = position.x + Math.cos(angle) * size.x / 2;
          const y = position.y + Math.sin(angle) * size.y / 2;
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.closePath();
        break;
      default: // basic
        // Basic enemies - diamond/rhombus
        context.beginPath();
        context.moveTo(position.x, position.y - size.y / 2); // Top
        context.lineTo(position.x + size.x / 2, position.y); // Right
        context.lineTo(position.x, position.y + size.y / 2); // Bottom
        context.lineTo(position.x - size.x / 2, position.y); // Left
        context.closePath();
        break;
    }

    context.fill();
    context.stroke();
  }

  private drawSpecialEffects(context: CanvasRenderingContext2D, position: Vector2, size: Vector2): void {
    switch (this.enemyType) {
      case 'fast':
        // Speed trail effect
        const trailAlpha = 0.4 + 0.2 * Math.sin(this.movementTimer * 10);
        context.fillStyle = `rgba(255, 102, 0, ${trailAlpha})`;
        context.fillRect(
          position.x - size.x / 4,
          position.y - size.y,
          size.x / 2,
          size.y / 2
        );
        break;
      case 'heavy':
        // Pulsing armor effect
        const pulseAlpha = 0.3 + 0.2 * Math.sin(this.movementTimer * 4);
        context.strokeStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
        context.lineWidth = 3;
        context.beginPath();
        context.arc(position.x, position.y, Math.max(size.x, size.y) / 2 + 3, 0, Math.PI * 2);
        context.stroke();
        break;
      default: // basic
        // Subtle glow effect
        const glowAlpha = 0.2 + 0.1 * Math.sin(this.movementTimer * 6);
        context.fillStyle = `rgba(255, 0, 0, ${glowAlpha})`;
        context.fillRect(
          position.x - size.x / 2 - 2,
          position.y - size.y / 2 - 2,
          size.x + 4,
          size.y + 4
        );
        break;
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