'use client';

import { GameCanvas } from '@/components/GameCanvas';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col">
      {/* Header */}
      <header className="text-center py-6">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Kiro Challenge
          </span>
        </h1>
        <p className="text-gray-400 text-lg">Help Kiro Defend Against the Invasion</p>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex items-center justify-center px-4">
        <GameCanvas />
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Built with Next.js, TypeScript, and HTML5 Canvas</p>
        <p className="mt-1">© 2024 Kiro Challenge Game</p>
      </footer>
    </div>
  );
}
