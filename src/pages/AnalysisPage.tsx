import { useMemo, useState } from 'react';
import { LotoResult, GameConfig } from '../lib/types';
import {
  calcFrequency, calcGaps, calcPairs, calcSumStats,
  calcOddEven, calcTrend, getHotCold,
} from '../lib/analysis';
import LotoBall from '../components/LotoBall';
import GlassCard from '../components/GlassCard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts';

const tooltipStyle = { background: 'rgba(15,20,50,0.9)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, color: '#f1f5f9' };

interface Props { data: LotoResult[]; config: GameConfig }

type Tab = 'frequency' | 'gap' | 'pair' | 'sum' | 'trend';
const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'frequency', label: '出現頻度', icon: '📊' },
  { id: 'gap', label: 'ギャップ', icon: '⏳' },
  { id: 'pair', label: 'ペア', icon: '🔗' },
  { id: 'sum', label: '分布', icon: '📉' },
  { id: 'trend', label: 'トレンド', icon: '📈' },
];

export default function AnalysisPage({ data, config }: Props) {
  const [tab, setTab] = useState<Tab>('frequency');
  const [freqRange, setFreqRange] = useState<number>(0);

  return (
    <div className="space-y-4">
      <GlassCard className="p-1.5">
        <div className="flex gap-1.5">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-2 sm:px-4 py-3 rounded-md text-sm sm:text-base font-bold transition-colors text-center min-h-[44px] ${
                tab === t.id
                  ? 'bg-accent text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <span className="sm:hidden">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6 min-h-[400px]">
        {tab === 'frequency' && <FrequencyTab data={data} config={config} range={freqRange} setRange={setFreqRange} />}
        {tab === 'gap' && <GapTab data={data} config={config} />}
        {tab === 'pair' && <PairTab data={data} config={config} />}
        {tab === 'sum' && <SumTab data={data} config={config} />}
        {tab === 'trend' && <TrendTab data={data} config={config} />}
      </GlassCard>
    </div>
  );
}

/* =================== 出現頻度 =================== */
function FrequencyTab({ data, config, range, setRange }: { data: LotoResult[]; config: GameConfig; range: number; setRange: (r: number) => void }) {
  const freq = useMemo(() => calcFrequency(data, config, range || undefined), [data, config, range]);
  const { hot, cold } = useMemo(() => getHotCold(freq, 5), [freq]);
  const avgExpected = freq.length > 0 ? freq[0].expected : 0;
  const rangeOptions = [
    { label: '全期間', value: 0 },
    { label: '直近50回', value: 50 },
    { label: '直近100回', value: 100 },
    { label: '直近200回', value: 200 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-bold">出現頻度分析</h3>
        <div className="flex gap-1">
          {rangeOptions.map(o => (
            <button
              key={o.value}
              onClick={() => setRange(o.value)}
              className={`px-3 py-2 rounded text-sm font-bold min-h-[36px] ${
                range === o.value ? 'bg-accent text-bg-primary' : 'bg-bg-card-hover text-text-secondary'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={freq}>
          <XAxis dataKey="number" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={1} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: any, _: any, entry: any) => [
              `${v}回 (${entry.payload.percentage.toFixed(1)}%)`, '出現回数'
            ]}
            labelFormatter={l => `番号 ${l}`}
          />
          <ReferenceLine y={avgExpected} stroke={config.color} strokeDasharray="4 4" />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {freq.map((entry) => (
              <Cell
                key={entry.number}
                fill={
                  hot.some(h => h.number === entry.number) ? '#ef4444' :
                  cold.some(c => c.number === entry.number) ? '#3b82f6' : '#64748b'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-hot font-bold mb-2 text-base">🔥 ホット TOP 5</h4>
          <div className="flex flex-wrap gap-2">
            {hot.map(h => (
              <div key={h.number} className="flex items-center gap-1.5">
                <LotoBall number={h.number} size="sm" maxNumber={config.maxNumber} /><span className="text-sm text-text-secondary">{h.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-cold font-bold mb-2 text-base">❄️ コールド TOP 5</h4>
          <div className="flex flex-wrap gap-2">
            {cold.map(c => (
              <div key={c.number} className="flex items-center gap-1.5">
                <LotoBall number={c.number} size="sm" maxNumber={config.maxNumber} /><span className="text-sm text-text-secondary">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================== ギャップ =================== */
function GapTab({ data, config }: { data: LotoResult[]; config: GameConfig }) {
  const gaps = useMemo(() => calcGaps(data, config), [data, config]);
  const chartData = gaps.map(g => ({
    ...g,
    diff: g.currentGap - g.averageGap,
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">出現間隔（ギャップ）分析</h3>
      <p className="text-base text-text-secondary">
        各番号が最後に出現してからの回数。平均間隔より長い番号は「出やすい」可能性があります。
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="number" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={1} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: any, name: any) => [
              `${v.toFixed(1)}回`,
              name === 'currentGap' ? '現在のギャップ' : '平均ギャップ'
            ]}
            labelFormatter={l => `番号 ${l}`}
          />
          <Bar dataKey="currentGap" fill="#ef4444" radius={[2, 2, 0, 0]} name="currentGap" />
          <Bar dataKey="averageGap" fill="#334155" radius={[2, 2, 0, 0]} name="averageGap" />
        </BarChart>
      </ResponsiveContainer>

      <div>
        <h4 className="text-base font-bold text-text-secondary mb-2">ヒートマップ（赤=長期未出現）</h4>
        <div className="grid grid-cols-7 sm:grid-cols-11 gap-1.5">
          {gaps.map(g => {
            const intensity = Math.min(1, g.currentGap / Math.max(1, g.averageGap * 2));
            const r = Math.round(59 + intensity * 196);
            const gb = Math.round(130 - intensity * 100);
            return (
              <div
                key={g.number}
                className="aspect-square flex items-center justify-center rounded text-sm font-bold text-white min-h-[36px]"
                style={{ background: `rgb(${r},${gb},${gb})` }}
                title={`番号${g.number}: ${g.currentGap}回未出現 (平均${g.averageGap.toFixed(1)})`}
              >
                {g.number}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =================== ペア =================== */
function PairTab({ data, config }: { data: LotoResult[]; config: GameConfig }) {
  const pairs = useMemo(() => calcPairs(data, config, 20), [data, config]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">ペア分析</h3>
      <p className="text-base text-text-secondary">よく一緒に出現する番号のペア TOP 20</p>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={pairs} layout="vertical">
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis type="category" dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} width={55} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: any) => [`${v}回`, '共出現回数']}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =================== 合計・分布 =================== */
function SumTab({ data, config }: { data: LotoResult[]; config: GameConfig }) {
  const sumStats = useMemo(() => calcSumStats(data), [data]);
  const oddEven = useMemo(() => calcOddEven(data, config), [data, config]);
  const COLORS = ['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">合計値の分布</h3>
        <p className="text-base text-text-secondary mb-3">
          平均: {sumStats.mean.toFixed(1)} / 標準偏差: {sumStats.stddev.toFixed(1)} / 範囲: {sumStats.min}〜{sumStats.max}
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sumStats.distribution}>
            <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="count" fill={config.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-3">奇数・偶数の比率</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={oddEven}
              dataKey="count"
              nameKey="pattern"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ pattern, percentage }: any) => `${pattern} (${percentage.toFixed(1)}%)`}
            >
              {oddEven.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* =================== トレンド =================== */
function TrendTab({ data, config }: { data: LotoResult[]; config: GameConfig }) {
  const defaultNums = useMemo(() => {
    const step = Math.floor(config.maxNumber / 5);
    return [1, step, step * 2, step * 3, config.maxNumber];
  }, [config.maxNumber]);

  const [selectedNums, setSelectedNums] = useState<number[]>(defaultNums);
  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const trendData = useMemo(() => {
    if (data.length < 60) return [];
    const windowSize = 50;
    const result: Record<string, number | string>[] = [];
    for (let i = windowSize; i <= data.length; i++) {
      const entry: Record<string, number | string> = { round: data[i - 1].round };
      for (const num of selectedNums) {
        const window = data.slice(i - windowSize, i);
        const count = window.filter(r => r.numbers.includes(num)).length;
        entry[`n${num}`] = (count / windowSize) * 100;
      }
      result.push(entry);
    }
    return result;
  }, [data, selectedNums]);

  const toggleNum = (num: number) => {
    setSelectedNums(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].slice(-5)
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">トレンド分析（50回移動平均）</h3>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: config.maxNumber }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            onClick={() => toggleNum(num)}
            className={`w-9 h-9 rounded text-sm font-bold transition-colors min-h-[36px] ${
              selectedNums.includes(num)
                ? 'bg-accent text-bg-primary'
                : 'bg-bg-card-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      <p className="text-sm text-text-secondary">番号をクリックして表示/非表示（最大5つ）</p>

      {trendData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <XAxis dataKey="round" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: any, name: any) => [`${v.toFixed(1)}%`, `番号 ${name.slice(1)}`]}
            />
            {selectedNums.map((num, i) => (
              <Line
                key={num}
                type="monotone"
                dataKey={`n${num}`}
                stroke={COLORS[i % COLORS.length]}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-text-secondary text-base text-center py-8">データが不足しています（60回以上必要）</p>
      )}
    </div>
  );
}
