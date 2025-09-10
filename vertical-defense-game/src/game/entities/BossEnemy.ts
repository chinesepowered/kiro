import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';
import { EntityType } from '../types/EntityTypes';

export class BossEnemy extends Entity {
  private phase: 'entering' | 'attacking' | 'retreating' = 'entering';
  private phaseTimer: number = 0;
  private attackCooldown: number = 0;
  private targetX: number;
  private entryComplete: boolean = false;
  private points: number;
  private speed: number;
  private originalSpeed: number;
  private attackDamage: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private enemyType: 'basic' | 'fast' | 'heavy';
  private movementTimer: number = 0;

  constructor(
    position: Vector2,
    canvasWidth: number = 800,
    canvasHeight: number = 600,
    speedMultiplier: number = 1.0,
    healthMultiplier: number = 1.0
  ) {
    // Boss enemies are much larger and stronger
    const bossSize = new Vector2(80, 80);
    const bossHealth = Math.ceil(15 * healthMultiplier);
    
    super(EntityType.ENEMY, position, bossSize, bossHealth);
    
    this.points = 200; // High point value
    this.speed = 40 * speedMultiplier; // Slower than normal enemies
    this.originalSpeed = this.speed;
    this.attackDamage = 3; // High damage
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.enemyType = 'heavy'; // Use heavy type as base
    
    // Set target position for horizontal movement
    this.targetX = canvasWidth / 2;
  }

  update(deltaTime: number): void {
    this.movementTimer += deltaTime;
    this.phaseTimer += deltaTime;
    this.attackCooldown -= deltaTime;

    this.updateBossMovement(deltaTime);

    // Check if boss has moved too far down
    if (this.hasReachedBottom()) {
      this.destroy();
    }
  }

  private hasReachedBottom(): boolean {
    const position = this.getPosition();
    const size = this.getSize();
    return position.y - size.y / 2 > this.canvasHeight + 100;
  }

  private updateBossMovement(deltaTime: number): void {
    const position = this.getPosition();

    switch (this.phase) {
      case 'entering':
        // Move to center of screen horizontally while descending
        const horizontalDistance = this.targetX - position.x;
        const horizontalSpeed = Math.sign(horizontalDistance) * Math.min(Math.abs(horizontalDistance) * 2, 100);
        
        this.setVelocity(new Vector2(horizontalSpeed, this.speed * 0.5));
        
        // Switch to attacking phase when roughly centered and descended enough
        if (Math.abs(horizontalDistance) < 20 && position.y > 100) {
          this.phase = 'attacking';
          this.phaseTimer = 0;
          this.entryComplete = true;
        }
        break;

      case 'attacking':
        // Hover and move side to side while occasionally moving down
        const sideMovement = Math.sin(this.movementTimer * 2) * 80;
        const verticalMovement = this.phaseTimer > 5 ? this.speed * 0.3 : 0;
        
        this.setVelocity(new Vector2(sideMovement, verticalMovement));
        
        // Switch to retreating if too far down or after long attack phase
        if (position.y > this.canvasHeight * 0.7 || this.phaseTimer > 8) {
          this.phase = 'retreating';
          this.phaseTimer = 0;
        }
        break;

      case 'retreating':
        // Move upward and to the side, then back to attacking
        const retreatHorizontal = Math.sin(this.movementTimer * 3) * 60;
        this.setVelocity(new Vector2(retreatHorizontal, -this.speed * 0.8));
        
        // Return to attacking phase after retreating
        if (this.phaseTimer > 2) {
          this.phase = 'attacking';
          this.phaseTimer = 0;
        }
        break;
    }
  }

  render(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();

    // Boss-specific colors
    const fillColor = '#660000'; // Dark red
    const strokeColor = '#ff0000'; // Bright red
    
    context.fillStyle = fillColor;
    context.strokeStyle = strokeColor;
    context.lineWidth = 3;

    // Draw boss as a large octagon
    context.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = position.x + Math.cos(angle) * size.x / 2;
      const y = position.y + Math.sin(angle) * size.y / 2;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
    context.stroke();

    // Add menacing glow effect
    const glowAlpha = 0.4 + 0.3 * Math.sin(this.movementTimer * 8);
    context.strokeStyle = `rgba(255, 0, 0, ${glowAlpha})`;
    context.lineWidth = 6;
    context.stroke();

    // Draw health bar (always visible for boss)
    this.drawHealthBar(context);

    // Add phase indicator
    this.drawPhaseIndicator(context);
  }

  private drawPhaseIndicator(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();
    
    let phaseColor = '#ffffff';
    let phaseText = '';
    
    switch (this.phase) {
      case 'entering':
        phaseColor = '#ffff00';
        phaseText = 'INCOMING';
        break;
      case 'attacking':
        phaseColor = '#ff0000';
        phaseText = 'ATTACKING';
        break;
      case 'retreating':
        phaseColor = '#00ff00';
        phaseText = 'RETREATING';
        break;
    }

    context.fillStyle = phaseColor;
    context.font = '12px Arial';
    context.textAlign = 'center';
    context.fillText(phaseText, position.x, position.y - size.y / 2 - 20);
  }

  // Override collision behavior
  onCollision(other: Entity): void {
    const otherType = other.getEntityType();
    
    switch (otherType) {
      case EntityType.PROJECTILE:
        // Damage is handled by the projectile
        break;
      case EntityType.PLAYER:
        // Damage the player and don't destroy boss
        other.takeDamage(this.attackDamage);
        break;
      default:
        break;
    }
  }

  // Health bar to make it more prominent
  private drawHealthBar(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();
    const barWidth = size.x * 1.2;
    const barHeight = 6;
    const barY = position.y - size.y / 2 - 15;

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

    // Border
    context.strokeStyle = '#ffffff';
    context.lineWidth = 1;
    context.strokeRect(
      position.x - barWidth / 2,
      barY,
      barWidth,
      barHeight
    );
  }

  // Bosses are worth more points and should be prioritized
  getPoints(): number {
    return this.points + (this.getMaxHealth() - this.getHealth()) * 10; // Bonus for damage dealt
  }
}