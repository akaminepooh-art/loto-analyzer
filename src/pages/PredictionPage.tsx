import { useState, useCallback } from 'react';
import { LotoResult, Prediction, PredictionConfig, GameConfig } from '../lib/types';
import { predictStatistical, predictLSTM, predictEnsemble } from '../lib/prediction';
import LotoBall from '../components/LotoBall';
import Disclaimer from '../components/Disclaimer';

interface Props { data: LotoResult[]; config: GameConfig }

function loadPredictions(gameId: string): Prediction[] {
  try {
    return JSON.parse(localStorage.getItem(`${gameId}_predictions`) || '[]');
  } catch { return []; }
}
function savePredictions(gameId: string, preds: Prediction[]) {
  localStorage.setItem(`${gameId}_predictions`, JSON.stringify(preds.slice(0, 50)));
}

type Method = 'statistical' | 'lstm' | 'ensemble';

export default function PredictionPage({ data, config }: Props) {
  const [method, setMethod] = useState<Method>('statistical');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<Prediction[]>(() => loadPredictions(config.id));
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ epoch: 0, total: 0 });
  const [mustInclude, setMustInclude] = useState<number[]>([]);
  const [mustExclude, setMustExclude] = useState<number[]>([]);
  const [weights, setWeights] = useState({ frequency: 0.3, gap: 0.3, trend: 0.2, pair: 0.2 });

  const generate = useCallback(async () => {
    if (data.length < 10) return;
    setLoading(true);
    setPrediction(null);
    setProgress({ epoch: 0, total: 0 });

    const predConfig: PredictionConfig = {
      method,
      mustInclude,
      mustExclude,
      weights,
    };

    try {
      let pred: Prediction;
      const onProgress = (epoch: number, total: number) => setProgress({ epoch, total });

      if (method === 'statistical') {
        pred = predictStatistical(data, predConfig, config);
      } else if (method === 'lstm') {
        pred = await predictLSTM(data, predConfig, config, onProgress);
      } else {
        pred = await predictEnsemble(data, predConfig, config, onProgress);
      }

      setPrediction(pred);
      const newHistory = [pred, ...history];
      setHistory(newHistory);
      savePredictions(config.id, newHistory);
    } catch (err) {
      console.error('Prediction failed:', err);
    }
    setLoading(false);
  }, [data, method, mustInclude, mustExclude, weights, history, config]);

  const toggleNumber = (num: number, list: 'include' | 'exclude') => {
    if (list === 'include') {
      setMustExclude(prev => prev.filter(n => n !== num));
      setMustInclude(prev =>
        prev.includes(num) ? prev.filter(n => n !== num) : prev.length < config.pickCount ? [...prev, num] : prev
      );
    } else {
      setMustInclude(prev => prev.filter(n => n !== num));
      setMustExclude(prev =>
        prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
      );
    }
  };

  const methods: { id: Method; label: string; desc: string }[] = [
    { id: 'statistical', label: '統計ベース', desc: '出現頻度・ギャップ・ペア相関による加重サンプリング' },
    { id: 'lstm', label: 'LSTM', desc: 'ニューラルネットワークによる時系列パターン学習' },
    { id: 'ensemble', label: 'アンサンブル', desc: '統計 + LSTM の複合予測' },
  ];

  return (
    <div className="space-y-4">
      <Disclaimer config={config} />

      {/* 手法選択 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {methods.map(m => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`rounded-xl p-4 border text-left transition-all ${
              method === m.id
                ? 'bg-accent/10 border-accent'
                : 'bg-bg-card border-border hover:border-bg-card-hover'
            }`}
          >
            <div className={`font-semibold text-sm ${method === m.id ? 'text-accent' : 'text-text-primary'}`}>
              {m.label}
            </div>
            <div className="text-xs text-text-secondary mt-1">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* カスタム設定 */}
      <details className="bg-bg-card rounded-xl border border-border">
        <summary className="px-5 py-3 cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary">
          ⚙️ カスタム設定
        </summary>
        <div className="px-5 pb-4 space-y-4">
          <div>
            <p className="text-xs text-text-secondary mb-2">
              番号をクリック: <span className="text-emerald-400">緑=必須</span> / <span className="text-red-400">赤=除外</span> / 右クリックで除外
            </p>
            <div className="grid grid-cols-7 sm:grid-cols-11 gap-1">
              {Array.from({ length: config.maxNumber }, (_, i) => i + 1).map(num => {
                const isIncluded = mustInclude.includes(num);
                const isExcluded = mustExclude.includes(num);
                return (
                  <button
                    key={num}
                    onClick={() => toggleNumber(num, 'include')}
                    onContextMenu={(e) => { e.preventDefault(); toggleNumber(num, 'exclude'); }}
                    className={`aspect-square rounded text-xs font-medium transition-all ${
                      isIncluded ? 'bg-emerald-500 text-white scale-110' :
                      isExcluded ? 'bg-red-500/50 text-red-200 line-through' :
                      'bg-bg-card-hover text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {method === 'statistical' && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(weights).map(([key, val]) => (
                <div key={key}>
                  <label className="text-xs text-text-secondary capitalize">{
                    key === 'frequency' ? '出現頻度' :
                    key === 'gap' ? 'ギャップ' :
                    key === 'trend' ? 'トレンド' : 'ペア相関'
                  }: {val.toFixed(1)}</label>
                  <input
                    type="range"
                    min="0" max="1" step="0.1"
                    value={val}
                    onChange={e => setWeights(w => ({ ...w, [key]: parseFloat(e.target.value) }))}
                    className="w-full accent-amber-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

      {/* 生成ボタン */}
      <div className="space-y-2">
        <button
          onClick={generate}
          disabled={loading || data.length < 10}
          className="w-full py-3 rounded-xl bg-accent hover:bg-accent-light text-bg-primary font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            progress.total > 0
              ? `学習中... ${progress.epoch}/${progress.total} エポック`
              : '予測を生成中...'
          ) : `🎯 ${config.name} 予測を生成`}
        </button>
        {loading && progress.total > 0 && (
          <div className="w-full bg-bg-card-hover rounded-full h-2 overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all duration-300"
              style={{ width: `${(progress.epoch / progress.total) * 100}%` }}
            />
          </div>
        )}
        {loading && method !== 'statistical' && (
          <p className="text-xs text-text-secondary text-center">
            ニューラルネットワークを学習中です。数十秒お待ちください...
          </p>
        )}
      </div>

      {/* 予測結果 */}
      {prediction && (
        <div className="bg-bg-card rounded-xl p-6 border border-accent/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-accent">予測結果</h3>
            <span className="text-xs text-text-secondary">
              {prediction.method === 'statistical' ? '統計ベース' :
               prediction.method === 'lstm' ? 'LSTM' : 'アンサンブル'}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 justify-center mb-4 flex-wrap">
            {prediction.numbers.map((n, i) => (
              <LotoBall key={n} number={n} size="lg" isPrediction delay={i * 100} maxNumber={config.maxNumber} />
            ))}
          </div>
          <p className="text-sm text-text-secondary text-center">{prediction.reasoning}</p>
          <div className="text-center mt-2">
            <span className="text-xs text-text-secondary">
              参考信頼度: {(prediction.confidence * 100).toFixed(1)}%（娯楽目的の指標です）
            </span>
          </div>
        </div>
      )}

      {/* 予測履歴 */}
      {history.length > 0 && (
        <div className="bg-bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-text-primary">予測履歴（{history.length}件）</h3>
            <button
              onClick={() => { setHistory([]); savePredictions(config.id, []); }}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
            >
              すべて削除
            </button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {history.slice(0, 20).map(p => (
              <div key={p.id} className="flex items-center gap-2 sm:gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="text-[10px] sm:text-xs text-text-secondary w-16 sm:w-20 shrink-0">
                  {new Date(p.createdAt).toLocaleDateString('ja-JP')}
                </span>
                <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                  {p.numbers.map(n => <LotoBall key={n} number={n} size="sm" maxNumber={config.maxNumber} />)}
                </div>
                <span className="text-[10px] sm:text-xs text-text-secondary ml-auto shrink-0">
                  {p.method === 'statistical' ? '統計' : p.method === 'lstm' ? 'LSTM' : 'ENS'}
                </span>
                <button
                  onClick={() => {
                    const newHistory = history.filter(h => h.id !== p.id);
                    setHistory(newHistory);
                    savePredictions(config.id, newHistory);
                  }}
                  className="text-text-secondary hover:text-red-400 shrink-0 p-1 transition-colors"
                  title="この予測を削除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
