import { useMemo } from 'react';
import { LotoResult, GameConfig, PageId } from '../lib/types';
import { calcFrequency, getHotCold, calcConsecutive } from '../lib/analysis';
import LotoBall from '../components/LotoBall';
import GlassCard from '../components/GlassCard';
import FortuneCard from '../components/FortuneCard';
import { getKichijitsu } from '../lib/kichijitsu';
import AdSlot from '../components/AdSlot';
import ShareQR from '../components/ShareQR';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  data: LotoResult[];
  source: string;
  config: GameConfig;
  onNavigate: (page: PageId) => void;
}

export default function DashboardPage({ data, source, config, onNavigate }: Props) {
  const latest = data[data.length - 1];
  const freq = useMemo(() => calcFrequency(data, config), [data, config]);
  const { hot, cold } = useMemo(() => getHotCold(freq), [freq]);
  const consec = useMemo(() => calcConsecutive(data), [data]);
  const avgExpected = freq.length > 0 ? freq[0].expected : 0;

  const nextDraw = useMemo(() => {
    const now = new Date();
    const targetDay = config.drawDayOfWeek;
    const currentDay = now.getDay();
    let daysToNext = (targetDay - currentDay + 7) % 7;
    if (daysToNext === 0 && now.getHours() >= 19) daysToNext = 7;
    const next = new Date(now);
    next.setDate(next.getDate() + daysToNext);
    return next;
  }, [config.drawDayOfWeek]);

  const kichijitsu = useMemo(() => getKichijitsu(nextDraw), [nextDraw]);

  if (!latest) return <div className="p-8 text-center text-text-secondary text-lg">データがありません</div>;

  const bonusNumbers = Array.isArray(latest.bonus) ? latest.bonus : [latest.bonus];
  const hasCarryover = latest.carryover > 0;

  return (
    <div className="space-y-5">
      {/* ヒーロー: 最新結果 */}
      <GlassCard variant={hasCarryover ? 'highlight' : 'glow'} animate stagger={1} className={`p-6 relative overflow-hidden ${hasCarryover ? 'carryover-glow' : ''}`}>
        {/* hero-ball装飾 */}
        <img
          src="/images/hero-ball.png"
          alt=""
          className="absolute -right-10 -bottom-10 w-24 h-24 sm:w-40 sm:h-40 opacity-90 pointer-events-none drop-shadow-[0_0_15px_rgba(255,215,0,0.4)] z-10"
        />
        <div className="flex items-center justify-between mb-4 relative">
          <h2 className="text-xl font-bold text-text-primary">
            最新結果 — 第{latest.round}回
          </h2>
          <span className="text-sm text-text-secondary">{latest.date}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 justify-center mb-5 flex-wrap">
          {latest.numbers.map((n, i) => (
            <LotoBall key={n} number={n} size="lg" delay={i * 100} maxNumber={config.maxNumber} />
          ))}
          <span className="text-text-secondary mx-1 sm:mx-2 text-lg">+</span>
          {bonusNumbers.map((b, i) => (
            <LotoBall key={`b${b}`} number={b} size="lg" isBonus delay={600 + i * 100} maxNumber={config.maxNumber} />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Stat label="1等当選金" value={`¥${latest.firstPrize.toLocaleString()}`} gold={latest.firstPrize >= 100000000} />
          <Stat label="1等当選口数" value={`${latest.firstWinners}口`} />
          <Stat label="キャリーオーバー" value={`¥${latest.carryover.toLocaleString()}`} gold={hasCarryover} />
          <Stat label="データ件数" value={`${data.length}回分`} />
        </div>
      </GlassCard>

      {/* 広告枠A: ダッシュボード */}
      <AdSlot slotId="SLOT_A_DASHBOARD" format="horizontal" />

      {/* 情報カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="highlight" animate stagger={2} className="p-5">
          <div className="text-sm text-text-secondary mb-1">次回抽選日</div>
          <div className="text-3xl font-bold text-accent">
            {nextDraw.getMonth() + 1}/{nextDraw.getDate()}（{['日','月','火','水','木','金','土'][nextDraw.getDay()]}）
          </div>
          <div className="text-sm text-text-secondary mt-1">{config.drawDay} 18:45 頃抽選</div>
          {kichijitsu.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {kichijitsu.map(k => (
                <span key={k.name} className="text-xs px-2 py-1 rounded-full font-bold" style={{ backgroundColor: k.color + '22', color: k.color }}>
                  {k.emoji} {k.name}
                </span>
              ))}
            </div>
          )}
        </GlassCard>
        <GlassCard animate stagger={2} className="p-5">
          <div className="text-sm text-text-secondary mb-1">データ件数</div>
          <div className="text-2xl font-bold text-text-primary">{data.length}<span className="text-base font-normal ml-1">回分</span></div>
          <div className="text-sm text-text-secondary mt-1">{config.name}の全抽選結果</div>
        </GlassCard>
        <GlassCard animate stagger={3} className="p-5">
          <div className="text-sm text-text-secondary mb-1">連番出現率</div>
          <div className="text-2xl font-bold text-text-primary">{consec.percentage.toFixed(1)}%</div>
          <div className="text-sm text-text-secondary mt-1">{consec.hasConsecutive}/{data.length}回</div>
        </GlassCard>
        <FortuneCard config={config} onNavigateToFortune={() => onNavigate('fortune')} />
      </div>

      {/* 頻度グラフ */}
      <GlassCard animate stagger={4} className="p-4 sm:p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">出現頻度（全期間）</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={freq}>
            <XAxis dataKey="number" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={Math.max(1, Math.floor(config.maxNumber / 20))} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'rgba(15,20,50,0.9)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, color: '#f1f5f9', backdropFilter: 'blur(8px)' }} formatter={(v: any) => [`${v}回`, '出現回数']} labelFormatter={(l) => `番号 ${l}`} />
            <ReferenceLine y={avgExpected} stroke={config.color} strokeDasharray="4 4" label={{ value: '期待値', fill: config.color, fontSize: 11 }} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* ホット & コールド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard animate stagger={5} className="p-5">
          <h3 className="text-base font-bold text-hot mb-3">🔥 ホット番号 TOP 10</h3>
          <div className="flex flex-wrap gap-2">
            {hot.map(h => (
              <div key={h.number} className="flex items-center gap-1.5">
                <LotoBall number={h.number} size="sm" maxNumber={config.maxNumber} />
                <span className="text-sm text-text-secondary">{h.count}回</span>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard animate stagger={5} className="p-5">
          <h3 className="text-base font-bold text-cold mb-3">❄️ コールド番号 TOP 10</h3>
          <div className="flex flex-wrap gap-2">
            {cold.map(c => (
              <div key={c.number} className="flex items-center gap-1.5">
                <LotoBall number={c.number} size="sm" maxNumber={config.maxNumber} />
                <span className="text-sm text-text-secondary">{c.count}回</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* 共有 */}
      <ShareQR cardMode />
    </div>
  );
}

function Stat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-sm text-text-secondary">{label}</div>
      <div className={`text-base font-bold ${gold ? 'gold-shimmer' : 'text-text-primary'}`}>{value}</div>
    </div>
  );
}
