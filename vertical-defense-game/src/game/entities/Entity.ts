import { Vector2 } from '../utils/Vector2';
import { EntityType, CollisionBox } from '../types/EntityTypes';

export abstract class Entity {
  protected id: string;
  protected position: Vector2;
  protected velocity: Vector2;
  protected size: Vector2;
  protected health: number;
  protected maxHealth: number;
  protected active: boolean;
  protected entityType: EntityType;

  constructor(
    entityType: EntityType,
    position: Vector2 = new Vector2(),
    size: Vector2 = new Vector2(32, 32),
    health: number = 1
  ) {
    this.id = this.generateId();
    this.entityType = entityType;
    this.position = position.clone();
    this.velocity = new Vector2();
    this.size = size.clone();
    this.health = health;
    this.maxHealth = health;
    this.active = true;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  abstract update(deltaTime: number): void;
  abstract render(context: CanvasRenderingContext2D): void;

  onCollision(_other: Entity): void {
    // Default collision behavior - can be overridden
  }

  takeDamage(damage: number): void {
    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      this.destroy();
    }
  }

  heal(amount: number): void {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  destroy(): void {
    this.active = false;
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getPosition(): Vector2 {
    return this.position.clone();
  }

  getVelocity(): Vector2 {
    return this.velocity.clone();
  }

  getSize(): Vector2 {
    return this.size.clone();
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  isActive(): boolean {
    return this.active;
  }

  getEntityType(): EntityType {
    return this.entityType;
  }

  // Setters
  setPosition(position: Vector2): void {
    this.position = position.clone();
  }

  setVelocity(velocity: Vector2): void {
    this.velocity = velocity.clone();
  }

  // Collision detection helpers
  getBounds(): CollisionBox {
    return {
      x: this.position.x - this.size.x / 2,
      y: this.position.y - this.size.y / 2,
      width: this.size.x,
      height: this.size.y
    };
  }

  getCenter(): Vector2 {
    return this.position.clone();
  }

  getRadius(): number {
    return Math.max(this.size.x, this.size.y) / 2;
  }

  intersects(other: Entity): boolean {
    const thisBounds = this.getBounds();
    const otherBounds = other.getBounds();

    return (
      thisBounds.x < otherBounds.x + otherBounds.width &&
      thisBounds.x + thisBounds.width > otherBounds.x &&
      thisBounds.y < otherBounds.y + otherBounds.height &&
      thisBounds.y + thisBounds.height > otherBounds.y
    );
  }
}