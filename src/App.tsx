import { useState, useEffect } from 'react';
import { PageId, GameType, GAME_CONFIGS } from './lib/types';
import { useLotoData } from './hooks/useLotoData';
import Header from './components/Header';
import Disclaimer from './components/Disclaimer';
import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import PredictionPage from './pages/PredictionPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [gameType, setGameType] = useState<GameType>('loto6');
  const config = GAME_CONFIGS[gameType];
  const { data, loading, error, source, refresh } = useLotoData(gameType);

  // ゲーム切り替え時にテーマカラーを更新
  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', config.color);
    document.documentElement.style.setProperty('--color-accent-light', config.colorLight);
  }, [config]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Header
        currentPage={page}
        onNavigate={setPage}
        gameType={gameType}
        onGameChange={setGameType}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary">{config.name} のデータを読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={refresh} className="px-4 py-2 bg-accent text-bg-primary rounded-lg">
              再試行
            </button>
          </div>
        ) : (
          <>
            {page === 'dashboard' && <DashboardPage data={data} source={source} config={config} />}
            {page === 'analysis' && <AnalysisPage data={data} config={config} />}
            {page === 'prediction' && <PredictionPage data={data} config={config} />}
            {page === 'history' && <HistoryPage data={data} config={config} />}
          </>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-4">
        <Disclaimer config={config} />
      </footer>
    </div>
  );
}
