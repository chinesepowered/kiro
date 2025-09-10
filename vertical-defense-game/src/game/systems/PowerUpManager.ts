import { PowerUpType, PowerUpEffect, PowerUpConfig } from '../types/PowerUpTypes';
import { Player } from '../entities/Player';

export class PowerUpManager {
  private activePowerUps: Map<PowerUpType, PowerUpEffect> = new Map();
  private player: Player | null = null;

  setPlayer(player: Player): void {
    this.player = player;
  }

  update(deltaTime: number): void {
    // Update all active power-ups
    for (const [type, effect] of this.activePowerUps) {
      if (effect.duration > 0) {
        effect.timeRemaining -= deltaTime;
        
        if (effect.timeRemaining <= 0) {
          this.removePowerUp(type);
        }
      }
    }
  }

  addPowerUp(config: PowerUpConfig): void {
    const effect: PowerUpEffect = {
      type: config.type,
      duration: config.duration,
      value: config.value,
      active: true,
      timeRemaining: config.duration
    };

    // Remove existing power-up of same type if present
    if (this.activePowerUps.has(config.type)) {
      this.removePowerUp(config.type);
    }

    // Apply the power-up effect
    this.applyPowerUp(effect);
    
    // Store the active power-up
    this.activePowerUps.set(config.type, effect);
  }

  private applyPowerUp(effect: PowerUpEffect): void {
    if (!this.player) return;

    switch (effect.type) {
      case PowerUpType.RAPID_FIRE:
        const currentFireRate = this.player.getFireRate();
        const newFireRate = currentFireRate * effect.value;
        this.player.setFireRate(newFireRate);
        break;
      case PowerUpType.MULTI_SHOT:
        // Multi-shot will be handled in the shooting logic
        break;
      case PowerUpType.SHIELD:
        this.player.setShieldActive(true);
        break;
      case PowerUpType.DAMAGE_BOOST:
        // Damage boost will be handled in projectile creation
        break;
      case PowerUpType.HEALTH_RESTORE:
        // Instant effect
        this.player.heal(effect.value);
        break;
    }
  }

  private removePowerUp(type: PowerUpType): void {
    const effect = this.activePowerUps.get(type);
    if (!effect || !this.player) return;

    // Revert the power-up effect
    switch (type) {
      case PowerUpType.RAPID_FIRE:
        // Revert fire rate to base rate
        const baseFireRate = 0.3; // Default fire rate
        this.player.setFireRate(baseFireRate);
        break;
      case PowerUpType.MULTI_SHOT:
        // Multi-shot effect will be removed automatically
        break;
      case PowerUpType.SHIELD:
        this.player.setShieldActive(false);
        break;
      case PowerUpType.DAMAGE_BOOST:
        // Damage boost effect will be removed automatically
        break;
    }

    this.activePowerUps.delete(type);
  }

  // Getters for checking active power-ups
  hasPowerUp(type: PowerUpType): boolean {
    return this.activePowerUps.has(type);
  }

  getPowerUpEffect(type: PowerUpType): PowerUpEffect | null {
    return this.activePowerUps.get(type) || null;
  }

  getActivePowerUps(): PowerUpEffect[] {
    return Array.from(this.activePowerUps.values());
  }

  // Special getters for specific power-up effects
  getMultiShotCount(): number {
    const effect = this.getPowerUpEffect(PowerUpType.MULTI_SHOT);
    return effect ? effect.value : 1;
  }

  hasShield(): boolean {
    return this.hasPowerUp(PowerUpType.SHIELD);
  }

  getDamageMultiplier(): number {
    const effect = this.getPowerUpEffect(PowerUpType.DAMAGE_BOOST);
    return effect ? effect.value : 1;
  }

  clear(): void {
    // Remove all power-ups (used when player dies or game restarts)
    for (const type of this.activePowerUps.keys()) {
      this.removePowerUp(type);
    }
  }
}