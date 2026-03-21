import { GameType, GAME_CONFIGS } from '../lib/types';

interface GameSelectorProps {
  current: GameType;
  onChange: (game: GameType) => void;
}

const games: GameType[] = ['loto6', 'loto7', 'miniloto'];

export default function GameSelector({ current, onChange }: GameSelectorProps) {
  return (
    <div className="flex gap-1 bg-bg-primary/50 rounded-lg p-1">
      {games.map(id => {
        const cfg = GAME_CONFIGS[id];
        const isActive = current === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              isActive
                ? 'text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            style={isActive ? { backgroundColor: cfg.color } : undefined}
          >
            <span className="mr-1">{cfg.emoji}</span>
            <span className="hidden sm:inline">{cfg.name}</span>
          </button>
        );
      })}
    </div>
  );
}
