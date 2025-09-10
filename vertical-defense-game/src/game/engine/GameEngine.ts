import { EntityManager } from './EntityManager';
import { InputSystem } from '../systems/InputSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { GameState } from '../types/GameTypes';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';
import { Barrel } from '../entities/Barrel';
import { PowerUp } from '../entities/PowerUp';
import { Vector2 } from '../utils/Vector2';
import { EnemySpawner } from '../systems/EnemySpawner';
import { BarrelSpawner } from '../systems/BarrelSpawner';
import { EntityType } from '../types/EntityTypes';
import { PowerUpType } from '../types/PowerUpTypes';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private gameState: GameState;
  private entityManager: EntityManager;
  private inputSystem: InputSystem;
  private renderSystem: RenderSystem;
  private physicsSystem: PhysicsSystem;
  private audioSystem: AudioSystem;
  
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private player: Player | null = null;
  private enemySpawner: EnemySpawner;
  private barrelSpawner: BarrelSpawner;
  private levelProgressTimer: number = 0;
  private levelDuration: number = 30; // 30 seconds per level
  private enemiesKilledThisLevel: number = 0;
  private highScore: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.context = context;

    // Initialize game state
    this.gameState = {
      currentLevel: 1,
      score: 0,
      lives: 3,
      gameStatus: 'menu'
    };

    // Initialize systems
    this.entityManager = new EntityManager();
    this.inputSystem = new InputSystem();
    this.renderSystem = new RenderSystem(this.context);
    this.physicsSystem = new PhysicsSystem();
    this.audioSystem = new AudioSystem();
    this.enemySpawner = new EnemySpawner(this.canvas.width, this.canvas.height);
    this.barrelSpawner = new BarrelSpawner(this.canvas.width, this.canvas.height);
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.gameState.gameStatus = 'playing';
    this.initializeGame();
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private initializeGame(): void {
    // Clear any existing entities
    this.entityManager.clear();

    // Create player
    this.player = new Player(
      this.inputSystem,
      this.canvas.width,
      this.canvas.height
    );
    this.entityManager.addEntity(this.player);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1/30); // Cap at 30fps minimum
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Handle game state transitions
    this.handleGameStateInput();

    // Update input system
    this.inputSystem.update();

    // Only update game entities if playing
    if (this.gameState.gameStatus === 'playing') {
      // Handle auto-shooting
      this.handleAutoShooting();

      // Spawn enemies
      this.enemySpawner.update(deltaTime, this.entityManager, this.gameState.currentLevel);

      // Spawn barrels
      this.barrelSpawner.update(deltaTime, this.entityManager, this.gameState.currentLevel);

      // Update all entities
      this.entityManager.update(deltaTime);

      // Update physics
      this.physicsSystem.update(deltaTime, this.entityManager.getAllEntities());

      // Handle entity destruction and scoring
      this.handleEntityDestruction();

      // Update level progression
      this.updateLevelProgression(deltaTime);

      // Check game over conditions
      this.checkGameOver();
    }

    // Update audio
    this.audioSystem.update(deltaTime);
  }

  private handleGameStateInput(): void {
    if (this.gameState.gameStatus === 'menu' && this.inputSystem.isStartPressed()) {
      this.start();
    } else if (this.gameState.gameStatus === 'game_over' && this.inputSystem.isRestartPressed()) {
      this.restart();
    } else if (this.gameState.gameStatus === 'playing' && this.inputSystem.isPausePressed()) {
      this.pause();
    } else if (this.gameState.gameStatus === 'paused' && this.inputSystem.isPausePressed()) {
      this.resume();
    }
  }



  private render(): void {
    // Clear canvas
    this.context.fillStyle = '#0a0a1a';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render all entities
    this.renderSystem.render(this.entityManager.getAllEntities());

    // Render UI
    this.renderUI();
  }

  private renderUI(): void {
    // Render score
    this.context.fillStyle = '#ffffff';
    this.context.font = '20px Arial';
    this.context.textAlign = 'left';
    this.context.fillText(`Score: ${this.gameState.score}`, 20, 30);
    
    // Render lives
    this.context.fillText(`Lives: ${this.gameState.lives}`, 20, 60);
    
    // Render level
    this.context.fillText(`Level: ${this.gameState.currentLevel}`, 20, 90);

    // Render high score
    this.context.fillText(`High Score: ${this.highScore}`, 20, 120);

    // Render level progress bar (only during gameplay)
    if (this.gameState.gameStatus === 'playing') {
      this.renderLevelProgressBar();
    }

    // Render additional stats
    if (this.gameState.gameStatus === 'playing') {
      this.context.font = '16px Arial';
      this.context.fillText(`Enemies Killed: ${this.enemiesKilledThisLevel}`, this.canvas.width - 200, 30);
      
      const timeLeft = Math.max(0, this.levelDuration - this.levelProgressTimer);
      this.context.fillText(`Time to Next Level: ${Math.ceil(timeLeft)}s`, this.canvas.width - 200, 50);
    }

    // Render game status messages
    if (this.gameState.gameStatus === 'menu') {
      this.context.fillStyle = '#ffffff';
      this.context.font = '32px Arial';
      this.context.textAlign = 'center';
      this.context.fillText('VERTICAL DEFENSE', this.canvas.width / 2, this.canvas.height / 2 - 50);
      this.context.font = '18px Arial';
      this.context.fillText('Press SPACE to start', this.canvas.width / 2, this.canvas.height / 2 + 20);
    } else if (this.gameState.gameStatus === 'paused') {
      this.context.fillStyle = '#ffff00';
      this.context.font = '32px Arial';
      this.context.textAlign = 'center';
      this.context.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 50);
      this.context.fillStyle = '#ffffff';
      this.context.font = '18px Arial';
      this.context.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 20);
    } else if (this.gameState.gameStatus === 'game_over') {
      this.context.fillStyle = '#ff4444';
      this.context.font = '32px Arial';
      this.context.textAlign = 'center';
      this.context.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
      this.context.fillStyle = '#ffffff';
      this.context.font = '18px Arial';
      this.context.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2);
      this.context.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
  }

  // Getters for systems to be used by entities
  getGameState(): GameState {
    return this.gameState;
  }

  getEntityManager(): EntityManager {
    return this.entityManager;
  }

  getInputSystem(): InputSystem {
    return this.inputSystem;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getPlayer(): Player | null {
    return this.player;
  }

  // Game state management methods
  private restart(): void {
    // Update high score if current score is higher
    if (this.gameState.score > this.highScore) {
      this.highScore = this.gameState.score;
    }

    this.gameState = {
      currentLevel: 1,
      score: 0,
      lives: 3,
      gameStatus: 'playing'
    };
    
    // Reset level progression
    this.levelProgressTimer = 0;
    this.enemiesKilledThisLevel = 0;
    
    this.initializeGame();
  }

  private pause(): void {
    this.gameState.gameStatus = 'paused';
  }

  private resume(): void {
    this.gameState.gameStatus = 'playing';
  }

  private handleAutoShooting(): void {
    if (this.player && this.player.isActive() && this.player.shouldAutoShoot()) {
      const shootPosition = this.player.shoot();
      if (shootPosition) {
        this.createPlayerProjectile(shootPosition);
      }
    }
  }

  private createPlayerProjectile(position: Vector2): void {
    const direction = Vector2.up(); // Shoot upward
    const projectile = new Projectile(position, direction, 'player');
    projectile.setCanvasBounds(this.canvas.width, this.canvas.height);
    this.entityManager.addEntity(projectile);
  }

  // Public method to add score (called when enemies are destroyed)
  addScore(points: number): void {
    this.gameState.score += points;
    this.enemiesKilledThisLevel++;
  }

  private handleEntityDestruction(): void {
    // Check for destroyed enemies and award points
    const allEntities = this.entityManager.getAllEntities();
    
    for (const entity of allEntities) {
      if (!entity.isActive()) {
        if (entity.getEntityType() === EntityType.ENEMY) {
          const enemy = entity as Enemy;
          this.addScore(enemy.getPoints());
        } else if (entity.getEntityType() === EntityType.BARREL) {
          // Barrel destroyed, spawn power-up
          const barrel = entity as Barrel;
          this.spawnPowerUpFromBarrel(barrel);
        }
      }
    }

    // Check if enemies reached the bottom (damage player)
    const enemies = this.entityManager.getEntitiesByEntityType(EntityType.ENEMY);
    for (const enemy of enemies) {
      const position = enemy.getPosition();
      if (position.y > this.canvas.height + 50) {
        // Enemy reached bottom, damage player
        if (this.player && this.player.isActive()) {
          this.player.takeDamage(1);
        }
      }
    }

    // Handle power-up collection
    this.handlePowerUpCollection();
  }

  private spawnPowerUpFromBarrel(barrel: Barrel): void {
    const powerUpType = barrel.getPowerUpType();
    if (powerUpType) {
      const position = barrel.getPosition();
      const powerUp = new PowerUp(position, powerUpType, this.canvas.width, this.canvas.height);
      this.entityManager.addEntity(powerUp);
    }
  }

  private handlePowerUpCollection(): void {
    if (!this.player || !this.player.isActive()) return;

    const powerUps = this.entityManager.getEntitiesByEntityType(EntityType.POWERUP);
    const playerPos = this.player.getPosition();

    for (const powerUpEntity of powerUps) {
      const powerUp = powerUpEntity as PowerUp;
      const powerUpPos = powerUp.getPosition();
      const distance = playerPos.distance(powerUpPos);

      // Check if player is close enough to collect power-up
      if (distance < 30) {
        this.applyPowerUp(powerUp);
        powerUp.destroy();
      }
    }
  }

  private applyPowerUp(powerUp: PowerUp): void {
    const config = powerUp.getConfig();
    
    switch (config.type) {
      case PowerUpType.RAPID_FIRE:
        if (this.player) {
          const newFireRate = this.player.getFireRate() * config.value;
          this.player.setFireRate(newFireRate);
          // TODO: Add timer to revert after duration
        }
        break;
      case PowerUpType.MULTI_SHOT:
        // TODO: Implement multi-shot functionality
        break;
      case PowerUpType.SHIELD:
        // TODO: Implement shield functionality
        break;
      case PowerUpType.DAMAGE_BOOST:
        // TODO: Implement damage boost functionality
        break;
      case PowerUpType.HEALTH_RESTORE:
        if (this.player) {
          this.player.heal(config.value);
        }
        break;
    }

    // Add bonus points for collecting power-up
    this.addScore(50);
  }

  private updateLevelProgression(deltaTime: number): void {
    this.levelProgressTimer += deltaTime;

    // Check for level completion (either by time or enemy kills)
    const timeBasedLevelUp = this.levelProgressTimer >= this.levelDuration;
    const killBasedLevelUp = this.enemiesKilledThisLevel >= 10 + (this.gameState.currentLevel * 5);

    if (timeBasedLevelUp || killBasedLevelUp) {
      this.advanceLevel();
    }
  }

  private advanceLevel(): void {
    this.gameState.currentLevel++;
    this.levelProgressTimer = 0;
    this.enemiesKilledThisLevel = 0;

    // Award bonus points for level completion
    const levelBonus = this.gameState.currentLevel * 100;
    this.gameState.score += levelBonus;

    // Show level up notification (could be enhanced with visual effects)
    console.log(`Level ${this.gameState.currentLevel}! Bonus: ${levelBonus} points`);

    // Increase player fire rate slightly each level
    if (this.player) {
      const newFireRate = Math.max(0.1, this.player.getFireRate() - 0.02);
      this.player.setFireRate(newFireRate);
    }
  }

  private renderLevelProgressBar(): void {
    const barWidth = 200;
    const barHeight = 8;
    const barX = this.canvas.width / 2 - barWidth / 2;
    const barY = 20;

    // Background
    this.context.fillStyle = '#333333';
    this.context.fillRect(barX, barY, barWidth, barHeight);

    // Progress based on time and kills
    const timeProgress = this.levelProgressTimer / this.levelDuration;
    const killsNeeded = 10 + (this.gameState.currentLevel * 5);
    const killProgress = this.enemiesKilledThisLevel / killsNeeded;
    const progress = Math.max(timeProgress, killProgress);

    // Progress bar
    const progressColor = progress > 0.8 ? '#00ff00' : progress > 0.5 ? '#ffff00' : '#ff6600';
    this.context.fillStyle = progressColor;
    this.context.fillRect(barX, barY, barWidth * Math.min(progress, 1), barHeight);

    // Border
    this.context.strokeStyle = '#ffffff';
    this.context.lineWidth = 1;
    this.context.strokeRect(barX, barY, barWidth, barHeight);

    // Label
    this.context.fillStyle = '#ffffff';
    this.context.font = '12px Arial';
    this.context.textAlign = 'center';
    this.context.fillText('Level Progress', barX + barWidth / 2, barY - 5);
  }

  // Enhanced game over check with better feedback
  private checkGameOver(): void {
    if (this.player && !this.player.isActive()) {
      this.gameState.lives--;
      
      if (this.gameState.lives <= 0) {
        // Update high score
        if (this.gameState.score > this.highScore) {
          this.highScore = this.gameState.score;
        }
        this.gameState.gameStatus = 'game_over';
      } else {
        // Respawn player with brief invincibility
        this.player = new Player(
          this.inputSystem,
          this.canvas.width,
          this.canvas.height
        );
        this.entityManager.addEntity(this.player);
        
        // Clear some enemies to give player a chance
        this.clearNearbyEnemies();
      }
    }
  }

  private clearNearbyEnemies(): void {
    const enemies = this.entityManager.getEntitiesByEntityType(EntityType.ENEMY);
    const playerPos = this.player?.getPosition();
    
    if (!playerPos) return;

    for (const enemy of enemies) {
      const enemyPos = enemy.getPosition();
      const distance = playerPos.distance(enemyPos);
      
      // Clear enemies within 100 pixels of player spawn
      if (distance < 100) {
        enemy.destroy();
      }
    }
  }
}