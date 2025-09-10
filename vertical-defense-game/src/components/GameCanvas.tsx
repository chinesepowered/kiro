'use client';

import { useEffect, useRef } from 'react';
import { GameEngine } from '@/game/engine/GameEngine';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Initialize game engine
    try {
      gameEngineRef.current = new GameEngine(canvas);
      gameEngineRef.current.start();
    } catch (error) {
      console.error('Failed to initialize game engine:', error);
    }

    // Cleanup function
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="border-2 border-gray-600 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block"
        style={{ imageRendering: 'pixelated' }}
        tabIndex={0} // Make canvas focusable for keyboard events
      />
      <div className="mt-4 text-white text-sm text-center">
        <p>Use ARROW KEYS or WASD to move • Auto-shooting enabled</p>
        <p>Press SPACE to start • Press R to restart • Press ESC to pause</p>
      </div>
    </div>
  );
}