import { useState, useMemo } from 'react';
import { LotoResult, GameConfig } from '../lib/types';
import LotoBall from '../components/LotoBall';
import GlassCard from '../components/GlassCard';
import AdSlot from '../components/AdSlot';

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
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <label className="text-base text-text-secondary shrink-0">番号で検索:</label>
          <input
            type="number"
            min={1} max={config.maxNumber}
            value={searchNum}
            onChange={e => { setSearchNum(e.target.value); setPage(0); }}
            placeholder={`1〜${config.maxNumber}`}
            className="border border-border rounded-lg px-3 py-2.5 text-base text-text-primary w-28 focus:outline-none focus:border-accent min-h-[48px]"
            style={{ background: 'rgba(15,20,50,0.6)' }}
          />
          {searchNum && (
            <button onClick={() => { setSearchNum(''); setPage(0); }} className="text-sm text-text-secondary hover:text-text-primary px-3 py-2 min-h-[40px]">
              クリア
            </button>
          )}
          <span className="text-sm text-text-secondary ml-auto">{filtered.length}件</span>
        </div>
      </GlassCard>

      {/* 広告枠D: 履歴テーブルの上 */}
      <AdSlot slotId="SLOT_D_HISTORY" format="horizontal" />

      {/* テーブル */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-text-secondary text-sm">
                <th className="px-3 sm:px-4 py-3 text-left">回号</th>
                <th className="px-3 sm:px-4 py-3 text-left hidden sm:table-cell">日付</th>
                <th className="px-3 sm:px-4 py-3 text-left">当選番号</th>
                <th className="px-3 sm:px-4 py-3 text-center">B</th>
                <th className="px-3 sm:px-4 py-3 text-right hidden md:table-cell">1等金額</th>
                <th className="px-3 sm:px-4 py-3 text-right hidden md:table-cell">口数</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(r => {
                const bonusNums = Array.isArray(r.bonus) ? r.bonus : [r.bonus];
                return (
                  <tr key={r.round} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                    <td className="px-3 sm:px-4 py-3 font-mono text-text-secondary text-sm">{r.round}</td>
                    <td className="px-3 sm:px-4 py-3 text-text-secondary text-sm hidden sm:table-cell">{r.date}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                        {r.numbers.map(n => <LotoBall key={n} number={n} size="sm" maxNumber={config.maxNumber} />)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {bonusNums.map(b => <LotoBall key={`b${b}`} number={b} size="sm" isBonus />)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right font-mono text-text-secondary hidden md:table-cell text-sm">
                      ¥{r.firstPrize.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right text-text-secondary hidden md:table-cell text-sm">
                      {r.firstWinners}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-5 py-2.5 rounded-lg text-base glass text-text-secondary hover:text-text-primary disabled:opacity-30 min-h-[44px]"
          >
            ← 前
          </button>
          <span className="text-base text-text-secondary">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-5 py-2.5 rounded-lg text-base glass text-text-secondary hover:text-text-primary disabled:opacity-30 min-h-[44px]"
          >
            次 →
          </button>
        </div>
      )}
    </div>
  );
}
