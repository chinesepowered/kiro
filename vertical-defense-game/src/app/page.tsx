'use client';

import { GameCanvas } from '@/components/GameCanvas';

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Vertical Defense</h1>
        <GameCanvas />
      </div>
    </div>
  );
}
