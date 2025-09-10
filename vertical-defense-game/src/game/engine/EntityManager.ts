import { Entity } from '../entities/Entity';
import { EntityType } from '../types/EntityTypes';

export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private entitiesToAdd: Entity[] = [];
  private entitiesToRemove: string[] = [];
  private entitiesByType: Map<EntityType, Set<string>> = new Map();

  constructor() {
    // Initialize entity type tracking
    for (const type of Object.values(EntityType)) {
      this.entitiesByType.set(type, new Set());
    }
  }

  addEntity(entity: Entity): void {
    this.entitiesToAdd.push(entity);
  }

  removeEntity(id: string): void {
    this.entitiesToRemove.push(id);
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  getEntitiesByType<T extends Entity>(type: new (...args: unknown[]) => T): T[] {
    return this.getAllEntities().filter((entity): entity is T => entity instanceof type);
  }

  getEntitiesByEntityType(entityType: EntityType): Entity[] {
    const entityIds = this.entitiesByType.get(entityType) || new Set();
    return Array.from(entityIds)
      .map(id => this.entities.get(id))
      .filter((entity): entity is Entity => entity !== undefined);
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  getEntityCountByType(entityType: EntityType): number {
    return this.entitiesByType.get(entityType)?.size || 0;
  }

  update(deltaTime: number): void {
    // Add new entities
    for (const entity of this.entitiesToAdd) {
      this.entities.set(entity.getId(), entity);
      
      // Track by entity type
      const typeSet = this.entitiesByType.get(entity.getEntityType());
      if (typeSet) {
        typeSet.add(entity.getId());
      }
    }
    this.entitiesToAdd = [];

    // Remove entities
    for (const id of this.entitiesToRemove) {
      const entity = this.entities.get(id);
      if (entity) {
        // Remove from type tracking
        const typeSet = this.entitiesByType.get(entity.getEntityType());
        if (typeSet) {
          typeSet.delete(id);
        }
      }
      this.entities.delete(id);
    }
    this.entitiesToRemove = [];

    // Update all entities
    for (const entity of this.entities.values()) {
      if (entity.isActive()) {
        entity.update(deltaTime);
      } else {
        // Remove inactive entities
        this.removeEntity(entity.getId());
      }
    }
  }

  clear(): void {
    this.entities.clear();
    this.entitiesToAdd = [];
    this.entitiesToRemove = [];
    
    // Clear type tracking
    for (const typeSet of this.entitiesByType.values()) {
      typeSet.clear();
    }
  }

  // Utility methods for common queries
  hasEntitiesOfType(entityType: EntityType): boolean {
    return this.getEntityCountByType(entityType) > 0;
  }

  removeAllEntitiesOfType(entityType: EntityType): void {
    const entities = this.getEntitiesByEntityType(entityType);
    for (const entity of entities) {
      this.removeEntity(entity.getId());
    }
  }
}