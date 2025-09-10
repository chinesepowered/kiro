import { EntityManager } from './EntityManager';
import { InputSystem } from '../systems/InputSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { GameState } from '../types/GameTypes';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';
import { BossEnemy } from '../entities/BossEnemy';
import { Barrel } from '../entities/Barrel';
import { PowerUp } from '../entities/PowerUp';
import { Vector2 } from '../utils/Vector2';
import { EnemySpawner } from '../systems/EnemySpawner';
import { BarrelSpawner } from '../systems/BarrelSpawner';
import { PowerUpManager } from '../systems/PowerUpManager';
import { LevelManager } from '../systems/LevelManager';
import { ParticleSystem } from '../systems/ParticleSystem';
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
  private powerUpManager: PowerUpManager;
  private levelManager: LevelManager;
  private particleSystem: ParticleSystem;
  private levelProgressTimer: number = 0;
  private levelDuration: number = 30; // 30 seconds per level
  private enemiesKilledThisLevel: number = 0;
  private highScore: number = 0;
  private screenShake: { x: number; y: number; intensity: number; duration: number } = { x: 0, y: 0, intensity: 0, duration: 0 };
  
  // Performance monitoring
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 60;
  private performanceMode: 'high' | 'medium' | 'low' = 'high';
  private transitionAlpha: number = 0;
  private transitionDirection: 'in' | 'out' | 'none' = 'none';
  private transitionSpeed: number = 2;

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
    this.levelManager = new LevelManager();
    this.enemySpawner = new EnemySpawner(this.canvas.width, this.canvas.height, this.levelManager);
    this.barrelSpawner = new BarrelSpawner(this.canvas.width, this.canvas.height);
    this.powerUpManager = new PowerUpManager();
    this.particleSystem = new ParticleSystem(this.entityManager);
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
    
    // Set player in power-up manager
    this.powerUpManager.setPlayer(this.player);
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

    // Update FPS counter
    this.updatePerformanceMetrics(currentTime);

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

      // Update power-ups
      this.powerUpManager.update(deltaTime);

      // Update screen shake
      this.updateScreenShake(deltaTime);

      // Cull off-screen entities for performance
      this.cullOffScreenEntities();

      // Update physics
      this.physicsSystem.update(deltaTime, this.entityManager.getAllEntities());

      // Handle entity destruction and scoring
      this.handleEntityDestruction();

      // Update level progression
      this.updateLevelProgression(deltaTime);

      // Check game over conditions
      this.checkGameOver();
    }

    // Update transitions
    this.updateTransitions(deltaTime);

    // Update audio
    this.audioSystem.update(deltaTime);
  }

  private handleGameStateInput(): void {
    if (this.gameState.gameStatus === 'menu' && this.inputSystem.isStartPressed()) {
      this.start();
    } else if (this.gameState.gameStatus === 'game_over') {
      if (this.inputSystem.isRestartPressed()) {
        this.restart();
      } else if (this.inputSystem.isStartPressed()) {
        this.returnToMenu();
      }
    } else if (this.gameState.gameStatus === 'playing' && this.inputSystem.isPausePressed()) {
      this.pause();
    } else if (this.gameState.gameStatus === 'paused') {
      if (this.inputSystem.isPausePressed()) {
        this.resume();
      } else if (this.inputSystem.isRestartPressed()) {
        this.restart();
      }
    }
  }



  private render(): void {
    // Apply screen shake
    this.context.save();
    this.context.translate(this.screenShake.x, this.screenShake.y);

    // Render background
    this.renderBackground();

    // Render all entities
    this.renderSystem.render(this.entityManager.getAllEntities());

    this.context.restore();

    // Render UI (not affected by screen shake)
    this.renderUI();
    
    // Render transitions on top
    this.renderTransitions();
  }

  private renderBackground(): void {
    // Dynamic background based on level
    const level = this.gameState.currentLevel;
    
    // Base gradient
    const gradient = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
    
    if (level <= 3) {
      // Early levels - dark blue space
      gradient.addColorStop(0, '#0a0a2e');
      gradient.addColorStop(1, '#000011');
    } else if (level <= 6) {
      // Mid levels - purple nebula
      gradient.addColorStop(0, '#2e0a2e');
      gradient.addColorStop(1, '#110011');
    } else {
      // High levels - red danger zone
      gradient.addColorStop(0, '#2e0a0a');
      gradient.addColorStop(1, '#110000');
    }
    
    this.context.fillStyle = gradient;
    this.context.fillRect(-this.screenShake.x, -this.screenShake.y, this.canvas.width, this.canvas.height);

    // Add animated stars/particles in background
    this.renderBackgroundStars();
    
    // Add level-based atmospheric effects
    if (level > 5) {
      this.renderAtmosphericEffects();
    }
  }

  private renderBackgroundStars(): void {
    if (this.performanceMode === 'low') return; // Skip in low performance mode
    
    const time = Date.now() * 0.001;
    const starCount = this.performanceMode === 'medium' ? 30 : 50;
    
    this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (let i = 0; i < starCount; i++) {
      const x = (i * 137.5) % this.canvas.width; // Pseudo-random distribution
      const y = ((i * 73.7 + time * 20) % this.canvas.height);
      const size = (i % 3) + 1;
      
      // Twinkling effect
      const alpha = 0.3 + 0.7 * Math.sin(time * 2 + i);
      this.context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      
      this.context.fillRect(x, y, size, size);
    }
  }

  private renderAtmosphericEffects(): void {
    if (this.performanceMode === 'low') return;
    
    const time = Date.now() * 0.001;
    
    // Danger zone warning effects
    if (this.gameState.currentLevel > 7) {
      const warningAlpha = 0.1 + 0.05 * Math.sin(time * 4);
      this.context.fillStyle = `rgba(255, 0, 0, ${warningAlpha})`;
      this.context.fillRect(-this.screenShake.x, -this.screenShake.y, this.canvas.width, this.canvas.height);
    }
    
    // Energy field effects for high levels
    if (this.gameState.currentLevel > 5) {
      this.context.strokeStyle = `rgba(0, 255, 255, ${0.2 + 0.1 * Math.sin(time * 3)})`;
      this.context.lineWidth = 2;
      
      for (let i = 0; i < 3; i++) {
        const y = (time * 50 + i * 200) % (this.canvas.height + 100);
        this.context.beginPath();
        this.context.moveTo(0, y);
        this.context.lineTo(this.canvas.width, y);
        this.context.stroke();
      }
    }
  }

  private renderUI(): void {
    switch (this.gameState.gameStatus) {
      case 'menu':
        this.renderMainMenu();
        break;
      case 'playing':
        this.renderGameplayUI();
        break;
      case 'paused':
        this.renderGameplayUI();
        this.renderPauseMenu();
        break;
      case 'game_over':
        this.renderGameOverScreen();
        break;
    }
  }

  private renderMainMenu(): void {
    // Background overlay
    this.context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Title with glow effect
    this.context.textAlign = 'center';
    this.context.font = 'bold 48px Arial';
    
    // Glow effect
    this.context.shadowColor = '#00ffff';
    this.context.shadowBlur = 20;
    this.context.fillStyle = '#ffffff';
    this.context.fillText('KIRO CHALLENGE', centerX, centerY - 100);
    this.context.shadowBlur = 0;

    // Subtitle
    this.context.font = '20px Arial';
    this.context.fillStyle = '#cccccc';
    this.context.fillText('Help Kiro Defend Against the Invasion', centerX, centerY - 60);

    // Menu options
    this.context.font = '24px Arial';
    this.context.fillStyle = '#ffffff';
    this.context.fillText('Press SPACE to Help Kiro', centerX, centerY + 20);
    
    this.context.font = '16px Arial';
    this.context.fillStyle = '#aaaaaa';
    this.context.fillText('Use ARROW KEYS or WASD to move Kiro', centerX, centerY + 60);
    this.context.fillText('Kiro auto-shoots at enemies', centerX, centerY + 80);
    this.context.fillText('Press ESC to pause • Press R to restart', centerX, centerY + 100);

    // High score display
    if (this.highScore > 0) {
      this.context.font = '20px Arial';
      this.context.fillStyle = '#ffff00';
      this.context.fillText(`High Score: ${this.highScore}`, centerX, centerY + 140);
    }

    // Version info
    this.context.font = '12px Arial';
    this.context.fillStyle = '#666666';
    this.context.textAlign = 'right';
    this.context.fillText('Built with Next.js', this.canvas.width - 10, this.canvas.height - 10);
  }

  private renderGameplayUI(): void {
    // HUD Background
    this.context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.context.fillRect(0, 0, this.canvas.width, 140);

    // Score and stats
    this.context.fillStyle = '#ffffff';
    this.context.font = 'bold 24px Arial';
    this.context.textAlign = 'left';
    this.context.fillText(`Score: ${this.gameState.score.toLocaleString()}`, 20, 35);
    
    this.context.font = '18px Arial';
    this.context.fillText(`Lives: ${this.gameState.lives}`, 20, 60);
    this.context.fillText(`Level: ${this.gameState.currentLevel}`, 20, 85);

    // High score (smaller, in corner)
    this.context.font = '14px Arial';
    this.context.fillStyle = '#cccccc';
    this.context.fillText(`Best: ${this.highScore.toLocaleString()}`, 20, 110);

    // Level progress bar
    this.renderLevelProgressBar();

    // Right side stats
    this.context.font = '16px Arial';
    this.context.fillStyle = '#ffffff';
    this.context.textAlign = 'right';
    
    const timeLeft = Math.max(0, this.levelManager.getLevelDuration() - this.levelProgressTimer);
    const killsNeeded = this.levelManager.getEnemiesRequiredForLevel();
    const killsRemaining = Math.max(0, killsNeeded - this.enemiesKilledThisLevel);
    
    this.context.fillText(`Time: ${Math.ceil(timeLeft)}s`, this.canvas.width - 20, 35);
    this.context.fillText(`Targets: ${killsRemaining}`, this.canvas.width - 20, 55);
    this.context.fillText(`Kiro's Kills: ${this.enemiesKilledThisLevel}/${killsNeeded}`, this.canvas.width - 20, 75);

    // Render active power-ups
    this.renderActivePowerUps();
  }

  private renderPauseMenu(): void {
    // Semi-transparent overlay
    this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Pause title
    this.context.textAlign = 'center';
    this.context.font = 'bold 36px Arial';
    this.context.fillStyle = '#ffff00';
    this.context.fillText('PAUSED', centerX, centerY - 40);

    // Instructions
    this.context.font = '20px Arial';
    this.context.fillStyle = '#ffffff';
    this.context.fillText('Press ESC to resume', centerX, centerY + 20);
    this.context.fillText('Press R to restart', centerX, centerY + 50);

    // Current stats
    this.context.font = '16px Arial';
    this.context.fillStyle = '#cccccc';
    this.context.fillText(`Level ${this.gameState.currentLevel} • Score: ${this.gameState.score.toLocaleString()}`, centerX, centerY + 90);
  }

  private renderGameOverScreen(): void {
    // Background overlay with fade effect
    this.context.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Game Over title with red glow
    this.context.textAlign = 'center';
    this.context.font = 'bold 42px Arial';
    this.context.shadowColor = '#ff0000';
    this.context.shadowBlur = 15;
    this.context.fillStyle = '#ff4444';
    this.context.fillText('GAME OVER', centerX, centerY - 80);
    this.context.shadowBlur = 0;

    // Final score
    this.context.font = 'bold 28px Arial';
    this.context.fillStyle = '#ffffff';
    this.context.fillText(`Final Score: ${this.gameState.score.toLocaleString()}`, centerX, centerY - 20);

    // Level reached
    this.context.font = '20px Arial';
    this.context.fillStyle = '#cccccc';
    this.context.fillText(`Level Reached: ${this.gameState.currentLevel}`, centerX, centerY + 10);

    // High score notification
    if (this.gameState.score === this.highScore && this.highScore > 0) {
      this.context.font = 'bold 24px Arial';
      this.context.fillStyle = '#ffff00';
      this.context.fillText('NEW HIGH SCORE!', centerX, centerY + 50);
    } else if (this.highScore > 0) {
      this.context.font = '16px Arial';
      this.context.fillStyle = '#aaaaaa';
      this.context.fillText(`High Score: ${this.highScore.toLocaleString()}`, centerX, centerY + 50);
    }

    // Restart instruction
    this.context.font = '22px Arial';
    this.context.fillStyle = '#ffffff';
    this.context.fillText('Press R to Play Again', centerX, centerY + 100);

    // Return to menu
    this.context.font = '16px Arial';
    this.context.fillStyle = '#aaaaaa';
    this.context.fillText('Press SPACE for Main Menu', centerX, centerY + 130);
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
    
    // Clear power-ups
    this.powerUpManager.clear();
    
    this.initializeGame();
  }

  private pause(): void {
    this.gameState.gameStatus = 'paused';
  }

  private resume(): void {
    this.gameState.gameStatus = 'playing';
  }

  private returnToMenu(): void {
    this.gameState.gameStatus = 'menu';
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Clear entities
    this.entityManager.clear();
    this.powerUpManager.clear();
    
    // Reset game state but keep high score
    this.gameState = {
      currentLevel: 1,
      score: 0,
      lives: 3,
      gameStatus: 'menu'
    };
    
    // Reset timers
    this.levelProgressTimer = 0;
    this.enemiesKilledThisLevel = 0;
    
    // Restart the game loop for menu
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
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
    const multiShotCount = this.powerUpManager.getMultiShotCount();
    const damageMultiplier = this.powerUpManager.getDamageMultiplier();
    
    if (multiShotCount === 1) {
      // Single shot
      const direction = Vector2.up();
      const projectile = new Projectile(position, direction, 'player', damageMultiplier);
      projectile.setCanvasBounds(this.canvas.width, this.canvas.height);
      this.entityManager.addEntity(projectile);
      
      // Create muzzle flash effect
      this.particleSystem.createMuzzleFlash(position, direction);
      
      // Play shooting sound
      this.audioSystem.playShootSound();
    } else {
      // Multi-shot - create multiple projectiles with spread
      const spreadAngle = Math.PI / 6; // 30 degrees total spread
      const angleStep = spreadAngle / (multiShotCount - 1);
      const startAngle = -spreadAngle / 2;
      
      for (let i = 0; i < multiShotCount; i++) {
        const angle = startAngle + (angleStep * i);
        const direction = new Vector2(Math.sin(angle), -Math.cos(angle));
        
        const projectile = new Projectile(position, direction, 'player', damageMultiplier);
        projectile.setCanvasBounds(this.canvas.width, this.canvas.height);
        this.entityManager.addEntity(projectile);
        
        // Create muzzle flash for each projectile
        this.particleSystem.createMuzzleFlash(position, direction);
      }
      
      // Play shooting sound (once for multi-shot)
      this.audioSystem.playShootSound();
    }
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
          
          // Create explosion effect
          const position = enemy.getPosition();
          const size = enemy.getSize();
          const intensity = Math.max(size.x, size.y) / 35; // Scale with enemy size
          this.particleSystem.createExplosion(position, intensity, '#ff4400');
          
          // Play enemy destruction sound
          this.audioSystem.playEnemyDestroySound();
          
          // Add screen shake for larger enemies
          if (intensity > 1) {
            this.addScreenShake(intensity * 2, 0.2);
            this.audioSystem.playExplosionSound(intensity);
          }
          
        } else if (entity.getEntityType() === EntityType.BARREL) {
          // Barrel destroyed, spawn power-up
          const barrel = entity as Barrel;
          this.spawnPowerUpFromBarrel(barrel);
          
          // Create barrel destruction effect
          const position = barrel.getPosition();
          this.particleSystem.createExplosion(position, 0.8, '#8B4513');
          
          // Play barrel break sound
          this.audioSystem.playBarrelBreakSound();
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
    
    // Use PowerUpManager to handle the power-up
    this.powerUpManager.addPowerUp(config);

    // Create power-up collection effect
    const position = powerUp.getPosition();
    this.particleSystem.createPowerUpEffect(position, config.color);

    // Play power-up collection sound
    this.audioSystem.playPowerUpSound();

    // Add bonus points for collecting power-up
    this.addScore(50);
  }

  private renderActivePowerUps(): void {
    const activePowerUps = this.powerUpManager.getActivePowerUps();
    
    if (activePowerUps.length === 0) return;

    // Render power-up indicators on the right side
    let yOffset = 80;
    this.context.font = '14px Arial';
    this.context.textAlign = 'right';

    for (const effect of activePowerUps) {
      // Choose color based on power-up type
      let color = '#ffffff';
      let name = '';
      
      switch (effect.type) {
        case PowerUpType.RAPID_FIRE:
          color = '#ff6600';
          name = 'Rapid Fire';
          break;
        case PowerUpType.MULTI_SHOT:
          color = '#00ff00';
          name = 'Multi Shot';
          break;
        case PowerUpType.SHIELD:
          color = '#0099ff';
          name = 'Shield';
          break;
        case PowerUpType.DAMAGE_BOOST:
          color = '#ff0099';
          name = 'Damage Boost';
          break;
      }

      // Add pulsing effect for active power-ups
      const pulseAlpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);
      
      // Draw background box for power-up
      const textWidth = this.context.measureText(`${name}: 99s`).width;
      this.context.fillStyle = `rgba(0, 0, 0, 0.5)`;
      this.context.fillRect(this.canvas.width - textWidth - 30, yOffset - 15, textWidth + 20, 18);
      
      // Draw border with power-up color
      this.context.strokeStyle = color;
      this.context.lineWidth = 1;
      this.context.strokeRect(this.canvas.width - textWidth - 30, yOffset - 15, textWidth + 20, 18);
      
      // Draw text with pulsing effect
      this.context.fillStyle = `rgba(${this.hexToRgb(color)}, ${pulseAlpha})`;
      
      if (effect.duration > 0) {
        const timeLeft = Math.ceil(effect.timeRemaining);
        this.context.fillText(`${name}: ${timeLeft}s`, this.canvas.width - 20, yOffset);
        
        // Draw progress bar
        const progress = effect.timeRemaining / effect.duration;
        const barWidth = textWidth + 10;
        this.context.fillStyle = color;
        this.context.fillRect(
          this.canvas.width - textWidth - 25, 
          yOffset + 3, 
          barWidth * progress, 
          2
        );
      } else {
        this.context.fillText(name, this.canvas.width - 20, yOffset);
      }
      
      yOffset += 25;
    }
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      // Handle non-hex colors
      if (hex === '#ff6600') return '255, 102, 0';
      if (hex === '#00ff00') return '0, 255, 0';
      if (hex === '#0099ff') return '0, 153, 255';
      if (hex === '#ff0099') return '255, 0, 153';
      return '255, 255, 255';
    }
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `${r}, ${g}, ${b}`;
  }

  private updateLevelProgression(deltaTime: number): void {
    this.levelProgressTimer += deltaTime;

    // Use level manager to check if should advance
    if (this.levelManager.shouldAdvanceLevel(this.levelProgressTimer, this.enemiesKilledThisLevel)) {
      this.advanceLevel();
    }
  }

  private advanceLevel(): void {
    this.gameState.currentLevel++;
    this.levelManager.setCurrentLevel(this.gameState.currentLevel);
    this.levelProgressTimer = 0;
    this.enemiesKilledThisLevel = 0;

    // Award bonus points for level completion
    const levelBonus = this.levelManager.calculateLevelBonus(this.gameState.currentLevel);
    this.gameState.score += levelBonus;

    // Show level up notification with transition effect
    this.startTransition('out');
    
    // Play level completion sound
    this.audioSystem.playLevelCompleteSound();

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

    // Use level manager to get progress
    const progress = this.levelManager.getLevelProgress(this.levelProgressTimer, this.enemiesKilledThisLevel);

    // Progress bar
    const progressColor = progress > 0.8 ? '#00ff00' : progress > 0.5 ? '#ffff00' : '#ff6600';
    this.context.fillStyle = progressColor;
    this.context.fillRect(barX, barY, barWidth * Math.min(progress, 1), barHeight);

    // Border
    this.context.strokeStyle = '#ffffff';
    this.context.lineWidth = 1;
    this.context.strokeRect(barX, barY, barWidth, barHeight);

    // Label with next level preview
    this.context.fillStyle = '#ffffff';
    this.context.font = '12px Arial';
    this.context.textAlign = 'center';
    this.context.fillText('Level Progress', barX + barWidth / 2, barY - 5);
    
    // Show next level info
    this.context.font = '10px Arial';
    this.context.fillText(this.levelManager.getNextLevelPreview(), barX + barWidth / 2, barY + barHeight + 15);
  }

  // Enhanced game over check with better feedback
  private checkGameOver(): void {
    if (this.player && !this.player.isActive()) {
      this.gameState.lives--;
      
      // Play player damage/death sound
      this.audioSystem.playPlayerDamageSound();
      
      if (this.gameState.lives <= 0) {
        // Update high score
        if (this.gameState.score > this.highScore) {
          this.highScore = this.gameState.score;
        }
        this.gameState.gameStatus = 'game_over';
        
        // Play game over sound
        this.audioSystem.playGameOverSound();
      } else {
        // Respawn player with brief invincibility
        this.player = new Player(
          this.inputSystem,
          this.canvas.width,
          this.canvas.height
        );
        this.entityManager.addEntity(this.player);
        
        // Reset power-up manager with new player
        this.powerUpManager.setPlayer(this.player);
        
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

  private updateScreenShake(deltaTime: number): void {
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime;
      
      if (this.screenShake.duration <= 0) {
        this.screenShake.x = 0;
        this.screenShake.y = 0;
        this.screenShake.intensity = 0;
      } else {
        // Random shake based on intensity
        this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
        this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
      }
    }
  }

  private addScreenShake(intensity: number, duration: number): void {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    this.screenShake.duration = Math.max(this.screenShake.duration, duration);
  }

  private updatePerformanceMetrics(currentTime: number): void {
    this.frameCount++;
    
    if (currentTime - this.lastFpsUpdate >= 1000) { // Update every second
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
      
      // Adjust performance mode based on FPS
      if (this.currentFps < 30) {
        this.performanceMode = 'low';
      } else if (this.currentFps < 50) {
        this.performanceMode = 'medium';
      } else {
        this.performanceMode = 'high';
      }
      
      // Update particle system performance mode
      this.particleSystem.setPerformanceMode(this.performanceMode);
    }
  }

  private cullOffScreenEntities(): void {
    const entities = this.entityManager.getAllEntities();
    const margin = 100; // Extra margin for culling
    
    for (const entity of entities) {
      const position = entity.getPosition();
      const entityType = entity.getEntityType();
      
      // Don't cull the player or boss enemies
      if (entityType === EntityType.PLAYER || entity instanceof BossEnemy) {
        continue;
      }
      
      // Cull entities that are far off screen
      if (position.x < -margin || 
          position.x > this.canvas.width + margin ||
          position.y < -margin || 
          position.y > this.canvas.height + margin) {
        
        // Only cull if they've been off screen for a while (not just spawning)
        if (entityType === EntityType.PROJECTILE || 
            entityType === EntityType.PARTICLE ||
            (entityType === EntityType.ENEMY && position.y > this.canvas.height + margin)) {
          entity.destroy();
        }
      }
    }
  }

  // Performance-aware particle creation
  private shouldCreateParticle(): boolean {
    switch (this.performanceMode) {
      case 'low':
        return Math.random() < 0.3; // Only 30% of particles
      case 'medium':
        return Math.random() < 0.7; // 70% of particles
      default:
        return true; // All particles
    }
  }

  // Get performance stats for debugging
  getPerformanceStats(): { fps: number; entities: number; mode: string } {
    return {
      fps: this.currentFps,
      entities: this.entityManager.getEntityCount(),
      mode: this.performanceMode
    };
  }

  private updateTransitions(deltaTime: number): void {
    if (this.transitionDirection === 'out') {
      this.transitionAlpha += this.transitionSpeed * deltaTime;
      if (this.transitionAlpha >= 1) {
        this.transitionAlpha = 1;
        this.transitionDirection = 'in';
      }
    } else if (this.transitionDirection === 'in') {
      this.transitionAlpha -= this.transitionSpeed * deltaTime;
      if (this.transitionAlpha <= 0) {
        this.transitionAlpha = 0;
        this.transitionDirection = 'none';
      }
    }
  }

  private startTransition(direction: 'in' | 'out'): void {
    this.transitionDirection = direction;
    if (direction === 'out') {
      this.transitionAlpha = 0;
    } else {
      this.transitionAlpha = 1;
    }
  }

  private renderTransitions(): void {
    if (this.transitionDirection === 'none') return;

    this.context.fillStyle = `rgba(255, 255, 255, ${this.transitionAlpha * 0.8})`;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Level up text during transition
    if (this.transitionDirection === 'out' && this.transitionAlpha > 0.5) {
      this.context.fillStyle = `rgba(0, 0, 0, ${(this.transitionAlpha - 0.5) * 2})`;
      this.context.font = 'bold 36px Arial';
      this.context.textAlign = 'center';
      this.context.fillText(`KIRO LEVEL ${this.gameState.currentLevel}`, this.canvas.width / 2, this.canvas.height / 2);
    }
  }
}