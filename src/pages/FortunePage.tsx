import { useState, useMemo, useCallback } from 'react';
import { GameConfig, BirthDate } from '../lib/types';
import { generateLuckyNumbers, calcDailyScore, loadBirthDate, saveBirthDate, calcNumerologyProfile } from '../lib/fortune';
import { getRokuyoDescription } from '../lib/rokuyo';
import BirthDateInput from '../components/BirthDateInput';
import FortuneCalendar from '../components/FortuneCalendar';
import LotoBall from '../components/LotoBall';
import GlassCard from '../components/GlassCard';
import AdSlot from '../components/AdSlot';

interface Props { config: GameConfig }

export default function FortunePage({ config }: Props) {
  const [birthDate, setBirthDate] = useState<BirthDate | null>(() => loadBirthDate());

  const handleBirthDateChange = useCallback((bd: BirthDate) => {
    setBirthDate(bd);
    saveBirthDate(bd);
  }, []);

  const profile = useMemo(() => {
    if (!birthDate) return null;
    return calcNumerologyProfile(birthDate, new Date());
  }, [birthDate]);

  const luckyNumbers = useMemo(() => {
    if (!birthDate) return null;
    return generateLuckyNumbers(birthDate, new Date(), config);
  }, [birthDate, config]);

  const dailyScore = useMemo(() => {
    if (!birthDate) return null;
    return calcDailyScore(birthDate, new Date());
  }, [birthDate]);

  const stars = (score: number) => '★'.repeat(score) + '☆'.repeat(5 - score);

  return (
    <div className="page-fortune space-y-6">
      {/* 生年月日入力 */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          🔮 あなたの数秘プロフィール
        </h2>
        <BirthDateInput value={birthDate} onChange={handleBirthDateChange} />
        <p className="text-sm text-text-secondary mt-2">
          ※ 生年月日はお使いのブラウザにのみ保存されます（サーバーには送信しません）
        </p>
      </GlassCard>

      {/* 占い手法の説明 */}
      <details className="glass rounded-xl">
        <summary className="px-6 py-4 cursor-pointer text-base font-bold text-text-primary hover:text-accent transition-colors">
          📖 この占いについて
        </summary>
        <div className="px-6 pb-5 space-y-4 text-base text-text-secondary leading-relaxed">
          <div>
            <h4 className="font-bold text-text-primary mb-1">数秘術（ヌメロロジー）とは</h4>
            <p>
              古代ギリシャの数学者ピタゴラスに由来する占術で、生年月日から算出される数字に固有の意味があるとする考え方です。
              西洋占星術と並ぶ歴史ある占いの体系で、個人の性格や運勢の傾向を数字で読み解きます。
            </p>
          </div>
          <div>
            <h4 className="font-bold text-text-primary mb-1">ライフパス数</h4>
            <p>
              生年月日の全桁を1桁になるまで足し合わせた数。あなたの人生の基本的な性質や運命の方向性を表す、数秘術で最も重要な数字です。
              11・22・33は「マスターナンバー」として特別な意味を持ちます。
            </p>
          </div>
          <div>
            <h4 className="font-bold text-text-primary mb-1">個人日数</h4>
            <p>
              個人年数（生まれ月日+今年の西暦）と今月・今日の日付から算出される、日替わりの運勢指標です。
              ライフパス数との組合せにより、その日の数字との相性を判定します。
            </p>
          </div>
          <div>
            <h4 className="font-bold text-text-primary mb-1">六曜</h4>
            <p>
              大安・友引・先勝・先負・赤口・仏滅の6種からなる日本の暦注です。
              旧暦の日付から算出され、古くから縁起の良し悪しの判断に用いられてきました。
              購入おすすめ日の判定に、個人日数と組み合わせて使用しています。
            </p>
          </div>
          <div>
            <h4 className="font-bold text-text-primary mb-1">ラッキーナンバーの算出</h4>
            <p>
              ライフパス数・誕生数・個人日数を各ゲームの番号範囲（{config.name}なら1〜{config.maxNumber}）に投影して算出します。
              同じ生年月日でもゲームごとに番号範囲が異なるため、それぞれに最適化された番号が導き出されます。
            </p>
          </div>
        </div>
      </details>

      {/* プロフィール表示 */}
      {profile && (
        <GlassCard variant="glow" className="p-6 border border-purple-700/40 relative">
          {/* lucky-cat装飾 */}
          <img
            src="/images/lucky-cat.png"
            alt=""
            className="absolute -right-10 -bottom-12 w-32 h-32 sm:w-40 sm:h-40 opacity-90 pointer-events-none drop-shadow-[0_0_15px_rgba(255,215,0,0.3)] z-20"
          />
          <div className="text-center mb-4 relative">
            <div className="text-5xl mb-2">{profile.emoji}</div>
            <h3 className="text-2xl font-bold" style={{ color: profile.color }}>
              {profile.lifePath} — {profile.systemName}
            </h3>
            <p className="text-base text-text-secondary mt-1">
              「{profile.systemTitle}」
            </p>
          </div>

          <div className="glass rounded-lg p-4 mb-4">
            <p className="text-base text-text-secondary leading-relaxed">
              {profile.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="glass rounded-lg p-3">
              <div className="text-sm text-text-secondary">属性</div>
              <div className="font-bold text-text-primary text-lg">{profile.element}</div>
            </div>
            <div className="glass rounded-lg p-3">
              <div className="text-sm text-text-secondary">誕生数</div>
              <div className="font-bold text-text-primary text-lg">{profile.birthNumber}</div>
            </div>
            <div className="glass rounded-lg p-3">
              <div className="text-sm text-text-secondary">個人年数</div>
              <div className="font-bold text-text-primary text-lg">{profile.personalYear}</div>
            </div>
            <div className="glass rounded-lg p-3">
              <div className="text-sm text-text-secondary">個人日数</div>
              <div className="font-bold text-text-primary text-lg">{profile.personalDay}</div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 今日のラッキーナンバー */}
      {luckyNumbers && dailyScore && (
        <GlassCard variant="highlight" className="p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            🎯 今日の{config.name}ラッキーナンバー
          </h2>

          <div className="space-y-3 mb-4">
            {luckyNumbers.numbers.map((n, i) => (
              <div key={n} className="flex items-start gap-3 glass rounded-lg p-4">
                <LotoBall number={n} size="lg" isPrediction delay={i * 150} maxNumber={config.maxNumber} />
                <p className="text-base text-text-secondary flex-1 pt-1">
                  {luckyNumbers.reasoning[i] || '数秘術が導いた番号です'}
                </p>
              </div>
            ))}
          </div>

          {/* 今日の購入運 */}
          <div className="glass rounded-lg p-5 text-center" style={{ background: 'rgba(60, 20, 90, 0.35)' }}>
            <div className={`text-2xl tracking-wider mb-1 ${dailyScore.score >= 4 ? 'star-twinkle' : ''}`} style={{ color: '#FFD700' }}>
              {stars(dailyScore.score)}
            </div>
            <div className="text-lg font-bold" style={{ color: '#c084fc' }}>
              {dailyScore.label}
            </div>
            <p className="text-base text-text-secondary mt-1">
              {dailyScore.message}
            </p>
            <p className="text-sm text-text-secondary mt-2">
              {dailyScore.rokuyo} — {getRokuyoDescription(dailyScore.rokuyo)}
            </p>
          </div>
        </GlassCard>
      )}

      {/* 広告枠C: 占い結果の下 */}
      <AdSlot slotId="SLOT_C_FORTUNE" format="rectangle" />

      {/* 購入おすすめカレンダー */}
      {birthDate && (
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            📅 購入おすすめカレンダー（4週間）
          </h2>
          <FortuneCalendar birthDate={birthDate} />
        </GlassCard>
      )}

      {/* 免責 */}
      <GlassCard className="p-4">
        <p className="text-sm text-text-secondary text-center">
          ※ 占い機能は数秘術に基づくエンターテインメントです。宝くじの当選を保証するものではありません。
          購入は自己責任でお楽しみください。
        </p>
      </GlassCard>
    </div>
  );
}
