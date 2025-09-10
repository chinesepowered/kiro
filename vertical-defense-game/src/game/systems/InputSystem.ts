export class InputSystem {
  private keys: Map<string, boolean> = new Map();
  private previousKeys: Map<string, boolean> = new Map();
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private mouseButtons: Map<number, boolean> = new Map();
  private previousMouseButtons: Map<number, boolean> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', (event) => {
      this.keys.set(event.code, true);
    });

    document.addEventListener('keyup', (event) => {
      this.keys.set(event.code, false);
    });

    // Mouse events
    document.addEventListener('mousemove', (event) => {
      this.mousePosition.x = event.clientX;
      this.mousePosition.y = event.clientY;
    });

    document.addEventListener('mousedown', (event) => {
      this.mouseButtons.set(event.button, true);
    });

    document.addEventListener('mouseup', (event) => {
      this.mouseButtons.set(event.button, false);
    });

    // Prevent context menu on right click
    document.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  }

  update(): void {
    // Update previous state for edge detection
    this.previousKeys.clear();
    for (const [key, value] of this.keys) {
      this.previousKeys.set(key, value);
    }

    this.previousMouseButtons.clear();
    for (const [button, value] of this.mouseButtons) {
      this.previousMouseButtons.set(button, value);
    }
  }

  // Key state methods
  isKeyDown(key: string): boolean {
    return this.keys.get(key) || false;
  }

  isKeyUp(key: string): boolean {
    return !this.isKeyDown(key);
  }

  isKeyPressed(key: string): boolean {
    return this.isKeyDown(key) && !this.wasKeyDown(key);
  }

  isKeyReleased(key: string): boolean {
    return !this.isKeyDown(key) && this.wasKeyDown(key);
  }

  private wasKeyDown(key: string): boolean {
    return this.previousKeys.get(key) || false;
  }

  // Mouse state methods
  isMouseButtonDown(button: number = 0): boolean {
    return this.mouseButtons.get(button) || false;
  }

  isMouseButtonPressed(button: number = 0): boolean {
    return this.isMouseButtonDown(button) && !this.wasMouseButtonDown(button);
  }

  isMouseButtonReleased(button: number = 0): boolean {
    return !this.isMouseButtonDown(button) && this.wasMouseButtonDown(button);
  }

  private wasMouseButtonDown(button: number): boolean {
    return this.previousMouseButtons.get(button) || false;
  }

  getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition };
  }

  // Convenience methods for common game controls
  isLeftPressed(): boolean {
    return this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA');
  }

  isRightPressed(): boolean {
    return this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD');
  }

  isUpPressed(): boolean {
    return this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW');
  }

  isDownPressed(): boolean {
    return this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS');
  }

  isShootPressed(): boolean {
    return this.isKeyPressed('Space') || this.isMouseButtonPressed(0);
  }

  isStartPressed(): boolean {
    return this.isKeyPressed('Space') || this.isKeyPressed('Enter');
  }

  isRestartPressed(): boolean {
    return this.isKeyPressed('KeyR');
  }

  isPausePressed(): boolean {
    return this.isKeyPressed('Escape') || this.isKeyPressed('KeyP');
  }
}