import { Entity } from '../entities/Entity';
import { Vector2 } from '../utils/Vector2';
import { CollisionBox } from '../types/EntityTypes';

export class CollisionSystem {
  static checkAABBCollision(boxA: CollisionBox, boxB: CollisionBox): boolean {
    return (
      boxA.x < boxB.x + boxB.width &&
      boxA.x + boxA.width > boxB.x &&
      boxA.y < boxB.y + boxB.height &&
      boxA.y + boxA.height > boxB.y
    );
  }

  static checkCircleCollision(
    centerA: Vector2, radiusA: number,
    centerB: Vector2, radiusB: number
  ): boolean {
    const distance = centerA.distance(centerB);
    return distance < radiusA + radiusB;
  }

  static checkEntityCollision(entityA: Entity, entityB: Entity): boolean {
    // Use AABB collision for most entities
    return this.checkAABBCollision(entityA.getBounds(), entityB.getBounds());
  }

  static getCollisionPoint(entityA: Entity, entityB: Entity): Vector2 {
    const boundsA = entityA.getBounds();
    const boundsB = entityB.getBounds();

    const x = Math.max(boundsA.x, boundsB.x);
    const y = Math.max(boundsA.y, boundsB.y);

    return new Vector2(x, y);
  }

  static isPointInBounds(point: Vector2, bounds: CollisionBox): boolean {
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  static getOverlapArea(boxA: CollisionBox, boxB: CollisionBox): number {
    if (!this.checkAABBCollision(boxA, boxB)) return 0;

    const overlapWidth = Math.min(boxA.x + boxA.width, boxB.x + boxB.width) - 
                        Math.max(boxA.x, boxB.x);
    const overlapHeight = Math.min(boxA.y + boxA.height, boxB.y + boxB.height) - 
                         Math.max(boxA.y, boxB.y);

    return overlapWidth * overlapHeight;
  }
}