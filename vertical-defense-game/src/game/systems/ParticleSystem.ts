import { Vector2 } from '../utils/Vector2';
import { EntityManager } from '../engine/EntityManager';
import { Particle, ExplosionParticle, SparkParticle } from '../entities/Particle';

export class ParticleSystem {
  private entityManager: EntityManager;
  private performanceMode: 'high' | 'medium' | 'low' = 'high';

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  setPerformanceMode(mode: 'high' | 'medium' | 'low'): void {
    this.performanceMode = mode;
  }

  createExplosion(position: Vector2, intensity: number = 1, color: string = '#ff6600'): void {
    let particleCount = Math.floor(8 + intensity * 4);
    
    // Adjust particle count based on performance mode
    switch (this.performanceMode) {
      case 'low':
        particleCount = Math.floor(particleCount * 0.3);
        break;
      case 'medium':
        particleCount = Math.floor(particleCount * 0.6);
        break;
    }
    
    for (let i = 0; i < particleCount; i++) {
      // Random direction
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 50 + Math.random() * 100 * intensity;
      
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      // Slight position variation
      const particlePos = new Vector2(
        position.x + (Math.random() - 0.5) * 10,
        position.y + (Math.random() - 0.5) * 10
      );

      const particle = new ExplosionParticle(particlePos, velocity, color);
      this.entityManager.addEntity(particle);
    }

    // Add some sparks for extra effect
    this.createSparks(position, Math.floor(intensity * 3));
  }

  createSparks(position: Vector2, count: number = 5): void {
    // Adjust spark count based on performance mode
    if (this.performanceMode === 'low') {
      count = Math.floor(count * 0.4);
    } else if (this.performanceMode === 'medium') {
      count = Math.floor(count * 0.7);
    }
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 20 // Slight upward bias
      );

      const sparkPos = new Vector2(
        position.x + (Math.random() - 0.5) * 5,
        position.y + (Math.random() - 0.5) * 5
      );

      const colors = ['#ffff00', '#ffffff', '#ffaa00'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const spark = new SparkParticle(sparkPos, velocity, color);
      this.entityManager.addEntity(spark);
    }
  }

  createProjectileTrail(position: Vector2, velocity: Vector2, color: string = '#00ffcc'): void {
    // Create a small trail particle
    const trailVelocity = new Vector2(
      velocity.x * 0.3 + (Math.random() - 0.5) * 20,
      velocity.y * 0.3 + (Math.random() - 0.5) * 20
    );

    const trail = new Particle(
      position,
      trailVelocity,
      color,
      0.3, // short life
      3,   // start size
      0,   // end size
      0    // no gravity
    );

    this.entityManager.addEntity(trail);
  }

  createPowerUpEffect(position: Vector2, color: string = '#00ff00'): void {
    const particleCount = 6;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 40 + Math.random() * 30;
      
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 30 // Upward movement
      );

      const particlePos = new Vector2(
        position.x + (Math.random() - 0.5) * 8,
        position.y + (Math.random() - 0.5) * 8
      );

      const particle = new Particle(
        particlePos,
        velocity,
        color,
        1.2, // longer life for power-up effect
        4,   // start size
        8,   // grow larger
        -20  // negative gravity (float up)
      );

      this.entityManager.addEntity(particle);
    }
  }

  createMuzzleFlash(position: Vector2, direction: Vector2): void {
    const particleCount = 3;
    
    for (let i = 0; i < particleCount; i++) {
      // Create particles in the shooting direction
      const spread = 0.3; // radians
      const angle = Math.atan2(direction.y, direction.x) + (Math.random() - 0.5) * spread;
      const speed = 80 + Math.random() * 40;
      
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      const flashPos = new Vector2(
        position.x + direction.x * 10,
        position.y + direction.y * 10
      );

      const colors = ['#ffffff', '#ffff00', '#ffaa00'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const flash = new Particle(
        flashPos,
        velocity,
        color,
        0.15, // very short life
        3,    // start size
        0,    // end size
        0     // no gravity
      );

      this.entityManager.addEntity(flash);
    }
  }

  createScreenShake(): void {
    // This would be implemented in the camera/render system
    // For now, we'll just create a visual effect
  }
}