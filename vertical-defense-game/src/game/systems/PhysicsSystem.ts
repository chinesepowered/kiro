import { Entity } from '../entities/Entity';
import { CollisionSystem } from './CollisionSystem';
import { EntityType } from '../types/EntityTypes';

export class PhysicsSystem {
  update(deltaTime: number, entities: Entity[]): void {
    // Update entity positions based on velocity
    for (const entity of entities) {
      if (entity.isActive()) {
        const position = entity.getPosition();
        const velocity = entity.getVelocity();
        
        // Update position
        position.x += velocity.x * deltaTime;
        position.y += velocity.y * deltaTime;
        
        entity.setPosition(position);
      }
    }

    // Check collisions between entities
    this.checkCollisions(entities);
  }

  private checkCollisions(entities: Entity[]): void {
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i];
        const entityB = entities[j];

        if (entityA.isActive() && entityB.isActive()) {
          // Only check collisions between relevant entity types
          if (this.shouldCheckCollision(entityA, entityB)) {
            if (CollisionSystem.checkEntityCollision(entityA, entityB)) {
              entityA.onCollision(entityB);
              entityB.onCollision(entityA);
            }
          }
        }
      }
    }
  }

  private shouldCheckCollision(entityA: Entity, entityB: Entity): boolean {
    const typeA = entityA.getEntityType();
    const typeB = entityB.getEntityType();

    // Define which entity types should collide with each other
    const collisionRules: Record<EntityType, EntityType[]> = {
      [EntityType.PLAYER]: [EntityType.ENEMY, EntityType.POWERUP, EntityType.BARREL],
      [EntityType.ENEMY]: [EntityType.PLAYER, EntityType.PROJECTILE],
      [EntityType.PROJECTILE]: [EntityType.ENEMY, EntityType.BARREL],
      [EntityType.POWERUP]: [EntityType.PLAYER],
      [EntityType.BARREL]: [EntityType.PLAYER, EntityType.PROJECTILE],
      [EntityType.PARTICLE]: [] // Particles don't collide with anything
    };

    return collisionRules[typeA]?.includes(typeB) || collisionRules[typeB]?.includes(typeA);
  }

  // Boundary checking
  static isEntityInBounds(entity: Entity, canvasWidth: number, canvasHeight: number): boolean {
    const bounds = entity.getBounds();
    return (
      bounds.x >= 0 &&
      bounds.y >= 0 &&
      bounds.x + bounds.width <= canvasWidth &&
      bounds.y + bounds.height <= canvasHeight
    );
  }

  static clampEntityToBounds(entity: Entity, canvasWidth: number, canvasHeight: number): void {
    const position = entity.getPosition();
    const size = entity.getSize();
    const halfWidth = size.x / 2;
    const halfHeight = size.y / 2;

    position.x = Math.max(halfWidth, Math.min(canvasWidth - halfWidth, position.x));
    position.y = Math.max(halfHeight, Math.min(canvasHeight - halfHeight, position.y));

    entity.setPosition(position);
  }
}