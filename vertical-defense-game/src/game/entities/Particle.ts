import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';
import { EntityType } from '../types/EntityTypes';

export class Particle extends Entity {
  private lifeTime: number;
  private maxLifeTime: number;
  private color: string;
  private startSize: number;
  private endSize: number;
  private gravity: number;
  private fadeOut: boolean;

  constructor(
    position: Vector2,
    velocity: Vector2,
    color: string = '#ff6600',
    lifeTime: number = 1.0,
    startSize: number = 4,
    endSize: number = 0,
    gravity: number = 0
  ) {
    const particleSize = new Vector2(startSize, startSize);
    super(EntityType.PARTICLE, position, particleSize, 1);

    this.setVelocity(velocity);
    this.lifeTime = 0;
    this.maxLifeTime = lifeTime;
    this.color = color;
    this.startSize = startSize;
    this.endSize = endSize;
    this.gravity = gravity;
    this.fadeOut = true;
  }

  update(deltaTime: number): void {
    this.lifeTime += deltaTime;

    // Apply gravity
    if (this.gravity > 0) {
      const velocity = this.getVelocity();
      velocity.y += this.gravity * deltaTime;
      this.setVelocity(velocity);
    }

    // Update size based on life progress
    const lifeProgress = this.lifeTime / this.maxLifeTime;
    const currentSize = this.startSize + (this.endSize - this.startSize) * lifeProgress;
    this.size = new Vector2(currentSize, currentSize);

    // Destroy particle when life time is over
    if (this.lifeTime >= this.maxLifeTime) {
      this.destroy();
    }
  }

  render(context: CanvasRenderingContext2D): void {
    const position = this.getPosition();
    const size = this.getSize();
    const lifeProgress = this.lifeTime / this.maxLifeTime;

    // Calculate alpha based on life progress
    let alpha = 1.0;
    if (this.fadeOut) {
      alpha = 1.0 - lifeProgress;
    }

    // Parse color and add alpha
    const colorWithAlpha = this.addAlphaToColor(this.color, alpha);

    context.fillStyle = colorWithAlpha;
    context.beginPath();
    context.arc(position.x, position.y, size.x / 2, 0, Math.PI * 2);
    context.fill();
  }

  private addAlphaToColor(color: string, alpha: number): string {
    // Simple color parsing for hex colors
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }
}

export class ExplosionParticle extends Particle {
  constructor(position: Vector2, velocity: Vector2, color: string = '#ff6600') {
    super(
      position,
      velocity,
      color,
      0.8, // lifeTime
      6,   // startSize
      0,   // endSize
      100  // gravity
    );
  }
}

export class SparkParticle extends Particle {
  constructor(position: Vector2, velocity: Vector2, color: string = '#ffff00') {
    super(
      position,
      velocity,
      color,
      0.5, // lifeTime
      2,   // startSize
      0,   // endSize
      50   // gravity
    );
  }
}