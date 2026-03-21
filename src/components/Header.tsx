import { useState } from 'react';
import { PageId, GameType, GAME_CONFIGS } from '../lib/types';
import GameSelector from './GameSelector';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  gameType: GameType;
  onGameChange: (game: GameType) => void;
}

const navItems: { id: PageId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'ダッシュボード', icon: '📊' },
  { id: 'analysis', label: '分析', icon: '📈' },
  { id: 'prediction', label: '予測', icon: '🎯' },
  { id: 'history', label: '履歴', icon: '📋' },
];

export default function Header({ currentPage, onNavigate, gameType, onGameChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const config = GAME_CONFIGS[gameType];

  return (
    <>
      <header className="bg-bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <h1
            className="text-lg sm:text-xl font-bold cursor-pointer flex items-center gap-2 shrink-0"
            style={{ color: config.color }}
            onClick={() => { onNavigate('dashboard'); setMenuOpen(false); }}
          >
            <span className="text-2xl">{config.emoji}</span>
            <span className="hidden lg:inline">ロト アナライザー</span>
          </h1>

          {/* ゲーム切り替え */}
          <GameSelector current={gameType} onChange={onGameChange} />

          {/* デスクトップナビ */}
          <nav className="hidden md:flex gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-accent text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* モバイル ハンバーガー */}
          <button
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card-hover"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* モバイルメニュー */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] z-30 bg-bg-primary/95 backdrop-blur-sm">
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-accent text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary bg-bg-card hover:bg-bg-card-hover'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
