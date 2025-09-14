# Kiro Challenge: Vertical Defense

[![Kiro Challenge](./public/kiro-challenge-banner.png)](https://github.com/your-username/vertical-defense-game)

Defend against waves of enemies in this fast-paced vertical shooter built with Next.js and HTML5 Canvas. Help Kiro survive as long as possible in this hackathon project!

## 🎮 Game Features

### Core Gameplay
- **Vertical Defense**: Classic arcade-style gameplay where you defend from above
- **Auto-Shooting**: Kiro automatically fires at enemies - just focus on movement!
- **Progressive Difficulty**: 10+ levels with increasing enemy speed, health, and spawn rates

### Power-Up System
- 🔥 **Rapid Fire**: Increase your firing speed
- 🌟 **Multi Shot**: Fire multiple projectiles simultaneously
- 🛡️ **Shield**: Temporarily become invincible
- 💥 **Damage Boost**: Double your projectile damage
- ❤️ **Health Restore**: Recover lost health

### Enemy Types
- **Basic Enemies**: Standard red diamond-shaped foes
- **Fast Enemies**: Orange triangles with zigzag movement patterns
- **Heavy Enemies**: Large red hexagons with armor and high health

### Visual Effects
- Dynamic backgrounds that change with each level
- Screen shake effects for impactful events
- Particle systems for explosions and power-up collection
- Animated UI elements with real-time feedback

## 🎯 Controls

| Action | Keys |
|--------|------|
| Move Kiro | Arrow Keys or WASD |
| Pause Game | ESC |
| Restart Game | R |
| Start Game | SPACE |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/vertical-defense-game.git
cd vertical-defense-game

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to play!

## 🏗️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Game Engine**: Custom HTML5 Canvas implementation
- **Build Tool**: Turbopack

## 🏆 Game Mechanics

### Scoring System
- Basic Enemies: 10 points
- Fast Enemies: 15 points
- Heavy Enemies: 30 points
- Power-Up Collection: 50 points
- Level Completion: 100 × level number

### Survival Elements
- 3 Lives per game session
- Progressive enemy waves every 30 seconds or after destroying required enemies
- Visual indicators for health, power-ups, and level progression

## 🎨 Visual Design

The game features a sleek dark theme with vibrant neon accents that highlight game elements:
- Kiro (player): Cyan triangular ship with glowing effect
- Enemies: Color-coded by type with distinct movement patterns
- UI: Clean, modern interface with real-time game status

## 🏅 High Score Tracking

The game tracks your highest score across sessions, encouraging replayability and skill improvement.

## 🛠️ Development

### Available Scripts

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

### Project Structure

```
src/
├── app/          # Next.js pages and routing
├── components/   # React components (GameCanvas)
├── game/         # Core game engine and entities
│   ├── engine/   # Main game loop and state management
│   ├── entities/ # Game objects (Player, Enemy, etc.)
│   ├── systems/  # Game systems (spawning, physics, etc.)
│   ├── types/    # TypeScript interfaces and enums
│   └── utils/    # Helper functions
└── public/       # Static assets
```

## 🤖 Built with AI

This project was developed as part of a hackathon using [Kiro](https://kiro.ai), an AI coding assistant that helped accelerate development of the game engine, entity systems, and visual effects.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙌 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Inspired by classic arcade shooters
- Developed during a hackathon event