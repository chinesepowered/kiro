'use client';

import { useEffect, useRef } from 'react';
import { GameEngine } from '@/game/engine/GameEngine';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Responsive canvas sizing - make it much larger
    const updateCanvasSize = () => {
      // Use viewport dimensions for sizing
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Maintain 4:3 aspect ratio but make it much larger
      const aspectRatio = 4 / 3;
      
      // Use most of the viewport, leaving space for header/footer
      const maxWidth = Math.min(viewportWidth - 40, 1200); // Much larger max width
      const maxHeight = viewportHeight - 200; // Leave space for header/footer
      
      let canvasWidth = maxWidth;
      let canvasHeight = canvasWidth / aspectRatio;
      
      // If height is too tall, constrain by height instead
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }
      
      // Minimum size to ensure playability
      canvasWidth = Math.max(canvasWidth, 600);
      canvasHeight = Math.max(canvasHeight, 450);
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Update canvas style for crisp rendering
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
    };

    // Initial size
    updateCanvasSize();

    // Initialize game engine
    try {
      gameEngineRef.current = new GameEngine(canvas);
      gameEngineRef.current.start();
    } catch (error) {
      console.error('Failed to initialize game engine:', error);
    }

    // Handle window resize
    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full mx-auto p-4">
      <div className="border-2 border-cyan-500 rounded-lg overflow-hidden shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          className="block"
          style={{ imageRendering: 'pixelated' }}
          tabIndex={0} // Make canvas focusable for keyboard events
        />
      </div>
      <div className="mt-4 text-white text-sm text-center max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <h3 className="font-bold text-cyan-400 mb-2">Controls</h3>
            <p>ARROW KEYS or WASD to move Kiro</p>
            <p>Kiro auto-shoots at enemies</p>
            <p>ESC to pause</p>
          </div>
          <div>
            <h3 className="font-bold text-green-400 mb-2">Gameplay</h3>
            <p>Help Kiro destroy enemies and barrels</p>
            <p>Collect power-ups to enhance Kiro</p>
            <p>Help Kiro survive as long as possible</p>
          </div>
        </div>
        <div className="mt-4 text-gray-400">
          <p>Press SPACE to start • Press R to restart</p>
        </div>
      </div>
    </div>
  );
}