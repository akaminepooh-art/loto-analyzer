import { useMemo } from 'react';
import { LotoResult, GameConfig } from '../lib/types';
import { calcFrequency, getHotCold, calcConsecutive } from '../lib/analysis';
import LotoBall from '../components/LotoBall';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  data: LotoResult[];
  source: string;
  config: GameConfig;
}

export default function DashboardPage({ data, source, config }: Props) {
  const latest = data[data.length - 1];
  const freq = useMemo(() => calcFrequency(data, config), [data, config]);
  const { hot, cold } = useMemo(() => getHotCold(freq), [freq]);
  const consec = useMemo(() => calcConsecutive(data), [data]);
  const avgExpected = freq.length > 0 ? freq[0].expected : 0;

  // 次回抽選日を計算
  const nextDraw = useMemo(() => {
    const now = new Date();
    const targetDay = config.drawDayOfWeek;
    const currentDay = now.getDay();
    let daysToNext = (targetDay - currentDay + 7) % 7;
    // 当日で19時以降なら次の週
    if (daysToNext === 0 && now.getHours() >= 19) {
      daysToNext = 7;
    }
    const next = new Date(now);
    next.setDate(next.getDate() + daysToNext);
    return next;
  }, [config.drawDayOfWeek]);

  if (!latest) return <div className="p-8 text-center text-text-secondary">データがありません</div>;

  // ボーナス番号の表示
  const bonusNumbers = Array.isArray(latest.bonus) ? latest.bonus : [latest.bonus];

  return (
    <div className="space-y-6">
      {/* 最新結果 */}
      <div className="bg-bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            最新結果 — 第{latest.round}回
          </h2>
          <span className="text-sm text-text-secondary">{latest.date}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 justify-center mb-4 flex-wrap">
          {latest.numbers.map((n, i) => (
            <LotoBall key={n} number={n} size="lg" delay={i * 80} maxNumber={config.maxNumber} />
          ))}
          <span className="text-text-secondary mx-1 sm:mx-2">+</span>
          {bonusNumbers.map((b, i) => (
            <LotoBall key={`b${b}`} number={b} size="lg" isBonus delay={500 + i * 80} maxNumber={config.maxNumber} />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <Stat label="1等当選金" value={`¥${latest.firstPrize.toLocaleString()}`} />
          <Stat label="1等当選口数" value={`${latest.firstWinners}口`} />
          <Stat label="キャリーオーバー" value={`¥${latest.carryover.toLocaleString()}`} />
          <Stat label="データ件数" value={`${data.length}回分`} />
        </div>
      </div>

      {/* 情報カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          title="次回抽選日"
          value={`${nextDraw.getMonth() + 1}/${nextDraw.getDate()}（${['日','月','火','水','木','金','土'][nextDraw.getDay()]}）`}
          sub={`${config.drawDay} 18:45 頃抽選`}
          accent
        />
        <InfoCard
          title="データソース"
          value={source}
          sub={`${config.name} 全${data.length}回`}
        />
        <InfoCard
          title="連番出現率"
          value={`${consec.percentage.toFixed(1)}%`}
          sub={`${consec.hasConsecutive}/${data.length}回`}
        />
      </div>

      {/* ミニ頻度グラフ */}
      <div className="bg-bg-card rounded-xl p-4 sm:p-6 border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">出現頻度（全期間）</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={freq}>
            <XAxis
              dataKey="number"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              interval={Math.max(1, Math.floor(config.maxNumber / 20))}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              formatter={(v: any) => [`${v}回`, '出現回数']}
              labelFormatter={(l) => `番号 ${l}`}
            />
            <ReferenceLine y={avgExpected} stroke={config.color} strokeDasharray="4 4" label={{ value: '期待値', fill: config.color, fontSize: 11 }} />
            <Bar
              dataKey="count"
              radius={[2, 2, 0, 0]}
              fill="#3b82f6"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ホット & コールド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-bg-card rounded-xl p-5 border border-border">
          <h3 className="text-base font-semibold text-hot mb-3">🔥 ホット番号 TOP 10</h3>
          <div className="flex flex-wrap gap-2">
            {hot.map(h => (
              <div key={h.number} className="flex items-center gap-1.5">
                <LotoBall number={h.number} size="sm" maxNumber={config.maxNumber} />
                <span className="text-xs text-text-secondary">{h.count}回</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-bg-card rounded-xl p-5 border border-border">
          <h3 className="text-base font-semibold text-cold mb-3">❄️ コールド番号 TOP 10</h3>
          <div className="flex flex-wrap gap-2">
            {cold.map(c => (
              <div key={c.number} className="flex items-center gap-1.5">
                <LotoBall number={c.number} size="sm" maxNumber={config.maxNumber} />
                <span className="text-xs text-text-secondary">{c.count}回</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-text-secondary">{label}</div>
      <div className="text-sm font-semibold text-text-primary">{value}</div>
    </div>
  );
}

function InfoCard({ title, value, sub, accent }: { title: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-5 border ${accent ? 'bg-amber-900/20 border-amber-700/40' : 'bg-bg-card border-border'}`}>
      <div className="text-xs text-text-secondary mb-1">{title}</div>
      <div className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-text-primary'}`}>{value}</div>
      <div className="text-xs text-text-secondary mt-1">{sub}</div>
    </div>
  );
}
