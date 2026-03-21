import { useState, useMemo } from 'react';
import { LotoResult, GameConfig } from '../lib/types';
import LotoBall from '../components/LotoBall';

interface Props { data: LotoResult[]; config: GameConfig }

const PAGE_SIZE = 20;

export default function HistoryPage({ data, config }: Props) {
  const [page, setPage] = useState(0);
  const [searchNum, setSearchNum] = useState<string>('');

  const filtered = useMemo(() => {
    const reversed = [...data].reverse();
    if (!searchNum.trim()) return reversed;
    const num = parseInt(searchNum.trim());
    if (isNaN(num) || num < 1 || num > config.maxNumber) return reversed;
    return reversed.filter(r => {
      if (r.numbers.includes(num)) return true;
      if (Array.isArray(r.bonus)) return r.bonus.includes(num);
      return r.bonus === num;
    });
  }, [data, searchNum, config.maxNumber]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* 検索 */}
      <div className="flex items-center gap-3 bg-bg-card rounded-xl p-4 border border-border">
        <label className="text-sm text-text-secondary shrink-0">番号で検索:</label>
        <input
          type="number"
          min={1} max={config.maxNumber}
          value={searchNum}
          onChange={e => { setSearchNum(e.target.value); setPage(0); }}
          placeholder={`1〜${config.maxNumber}`}
          className="bg-bg-card-hover border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary w-24 focus:outline-none focus:border-accent"
        />
        {searchNum && (
          <button onClick={() => { setSearchNum(''); setPage(0); }} className="text-xs text-text-secondary hover:text-text-primary">
            クリア
          </button>
        )}
        <span className="text-xs text-text-secondary ml-auto">{filtered.length}件</span>
      </div>

      {/* テーブル */}
      <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th className="px-2 sm:px-4 py-3 text-left">回号</th>
                <th className="px-2 sm:px-4 py-3 text-left hidden sm:table-cell">日付</th>
                <th className="px-2 sm:px-4 py-3 text-left">当選番号</th>
                <th className="px-2 sm:px-4 py-3 text-center">B</th>
                <th className="px-2 sm:px-4 py-3 text-right hidden md:table-cell">1等金額</th>
                <th className="px-2 sm:px-4 py-3 text-right hidden md:table-cell">口数</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(r => {
                const bonusNums = Array.isArray(r.bonus) ? r.bonus : [r.bonus];
                return (
                  <tr key={r.round} className="border-b border-border/50 hover:bg-bg-card-hover/50 transition-colors">
                    <td className="px-2 sm:px-4 py-2.5 font-mono text-text-secondary text-xs sm:text-sm">{r.round}</td>
                    <td className="px-2 sm:px-4 py-2.5 text-text-secondary text-xs sm:text-sm hidden sm:table-cell">{r.date}</td>
                    <td className="px-2 sm:px-4 py-2.5">
                      <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                        {r.numbers.map(n => <LotoBall key={n} number={n} size="sm" maxNumber={config.maxNumber} />)}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2.5 text-center">
                      <div className="flex gap-0.5 justify-center">
                        {bonusNums.map(b => <LotoBall key={`b${b}`} number={b} size="sm" isBonus />)}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2.5 text-right font-mono text-text-secondary hidden md:table-cell">
                      ¥{r.firstPrize.toLocaleString()}
                    </td>
                    <td className="px-2 sm:px-4 py-2.5 text-right text-text-secondary hidden md:table-cell">
                      {r.firstWinners}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-sm bg-bg-card-hover text-text-secondary hover:text-text-primary disabled:opacity-30"
          >
            ← 前
          </button>
          <span className="text-sm text-text-secondary">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-bg-card-hover text-text-secondary hover:text-text-primary disabled:opacity-30"
          >
            次 →
          </button>
        </div>
      )}
    </div>
  );
}
