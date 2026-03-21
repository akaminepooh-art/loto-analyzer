import { LotoResult, Prediction, PredictionConfig, GameConfig } from './types';
import { calcFrequency, calcGaps, calcPairs, calcTrend } from './analysis';

// UIスレッドに制御を返すユーティリティ
function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * 統計ベース予測
 */
export function predictStatistical(
  results: LotoResult[],
  config: PredictionConfig,
  gameConfig: GameConfig
): Prediction {
  const { maxNumber, pickCount } = gameConfig;
  const freq = calcFrequency(results, gameConfig);
  const gaps = calcGaps(results, gameConfig);
  const pairs = calcPairs(results, gameConfig, 100);
  const { weights } = config;

  const scores = new Array(maxNumber + 1).fill(0);

  for (let num = 1; num <= maxNumber; num++) {
    if (config.mustExclude.includes(num)) {
      scores[num] = -Infinity;
      continue;
    }

    const f = freq.find(f => f.number === num)!;
    const g = gaps.find(g => g.number === num)!;

    const freqScore = f.count / Math.max(1, f.expected);
    const gapScore = g.currentGap / Math.max(1, g.averageGap);

    const trend = calcTrend(results, num, Math.min(50, results.length));
    const trendScore = trend.length > 1
      ? (trend[trend.length - 1].rate - trend[Math.max(0, trend.length - 10)].rate) / 10
      : 0;

    const pairCount = pairs.filter(p => p.pair.includes(num)).reduce((s, p) => s + p.count, 0);
    const pairScore = pairCount / Math.max(1, pairs.length);

    scores[num] =
      weights.frequency * freqScore +
      weights.gap * gapScore +
      weights.trend * (trendScore + 1) +
      weights.pair * pairScore;
  }

  const selected = new Set(config.mustInclude);

  while (selected.size < pickCount) {
    const candidates = [];
    let totalScore = 0;
    for (let num = 1; num <= maxNumber; num++) {
      if (selected.has(num) || scores[num] === -Infinity) continue;
      const s = Math.max(0.01, scores[num]);
      candidates.push({ num, score: s });
      totalScore += s;
    }

    let rand = Math.random() * totalScore;
    for (const c of candidates) {
      rand -= c.score;
      if (rand <= 0) {
        selected.add(c.num);
        break;
      }
    }
  }

  const numbers = Array.from(selected).sort((a, b) => a - b);
  return {
    id: crypto.randomUUID(),
    numbers,
    method: 'statistical',
    confidence: 0.15 + Math.random() * 0.1,
    reasoning: '出現頻度・ギャップ・トレンド・ペア相関に基づく加重サンプリング',
    createdAt: new Date().toISOString(),
  };
}

/**
 * LSTM 学習の共通処理（軽量化+UIフリーズ防止）
 */
async function trainLSTMAndPredict(
  results: LotoResult[],
  gameConfig: GameConfig,
  onProgress?: (epoch: number, total: number) => void
): Promise<number[]> {
  const tf = await import('@tensorflow/tfjs');
  const { maxNumber } = gameConfig;

  const recentResults = results.slice(-200);
  const seqLen = Math.min(20, Math.floor(recentResults.length * 0.5));

  // データ前処理: 各回をmaxNumber次元バイナリベクトルに変換
  const vectors = recentResults.map(r => {
    const v = new Array(maxNumber).fill(0);
    for (const n of r.numbers) v[n - 1] = 1;
    return v;
  });

  const xs: number[][][] = [];
  const ys: number[][] = [];
  for (let i = 0; i <= vectors.length - seqLen - 1; i++) {
    xs.push(vectors.slice(i, i + seqLen));
    ys.push(vectors[i + seqLen]);
  }

  const xTensor = tf.tensor3d(xs);
  const yTensor = tf.tensor2d(ys);

  const model = tf.sequential();
  model.add(tf.layers.lstm({
    units: 32,
    inputShape: [seqLen, maxNumber],
    returnSequences: false,
  }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: maxNumber, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(0.002),
    loss: 'binaryCrossentropy',
  });

  const totalEpochs = 10;
  for (let epoch = 0; epoch < totalEpochs; epoch++) {
    await model.fit(xTensor, yTensor, {
      epochs: 1,
      batchSize: 32,
      shuffle: true,
      verbose: 0,
    });
    onProgress?.(epoch + 1, totalEpochs);
    await yieldToMain();
  }

  const lastSeq = vectors.slice(-seqLen);
  const input = tf.tensor3d([lastSeq]);
  const prediction = model.predict(input) as any;
  const probs = Array.from(await prediction.data() as Iterable<number>);

  xTensor.dispose();
  yTensor.dispose();
  input.dispose();
  prediction.dispose();
  model.dispose();

  return probs;
}

/**
 * LSTM予測
 */
export async function predictLSTM(
  results: LotoResult[],
  config: PredictionConfig,
  gameConfig: GameConfig,
  onProgress?: (epoch: number, total: number) => void
): Promise<Prediction> {
  const { maxNumber, pickCount } = gameConfig;
  const recentResults = results.slice(-200);
  const seqLen = Math.min(20, Math.floor(recentResults.length * 0.5));
  if (recentResults.length < seqLen + 10) {
    return predictStatistical(results, { ...config, method: 'lstm' }, gameConfig);
  }

  const probs = await trainLSTMAndPredict(recentResults, gameConfig, onProgress);

  const scored = probs.map((p: number, i: number) => ({ num: i + 1, prob: p }));
  const filtered = scored.filter(s => !config.mustExclude.includes(s.num));
  const selected = new Set(config.mustInclude);

  filtered.sort((a, b) => b.prob - a.prob);
  for (const s of filtered) {
    if (selected.size >= pickCount) break;
    if (!selected.has(s.num)) selected.add(s.num);
  }

  const numbers = Array.from(selected).sort((a, b) => a - b);
  return {
    id: crypto.randomUUID(),
    numbers,
    method: 'lstm',
    confidence: 0.1 + Math.random() * 0.15,
    reasoning: `LSTM ニューラルネットワーク（直近${seqLen}回の時系列パターンを学習・10エポック）`,
    createdAt: new Date().toISOString(),
  };
}

/**
 * アンサンブル予測
 */
export async function predictEnsemble(
  results: LotoResult[],
  config: PredictionConfig,
  gameConfig: GameConfig,
  onProgress?: (epoch: number, total: number) => void
): Promise<Prediction> {
  const { maxNumber, pickCount } = gameConfig;

  const freq = calcFrequency(results, gameConfig);
  const gaps = calcGaps(results, gameConfig);
  const statScores = new Array(maxNumber).fill(0);
  for (let i = 0; i < maxNumber; i++) {
    const num = i + 1;
    const f = freq.find(f => f.number === num)!;
    const g = gaps.find(g => g.number === num)!;
    statScores[i] = (f.count / Math.max(1, f.expected)) * 0.5 +
      (g.currentGap / Math.max(1, g.averageGap)) * 0.5;
  }

  const maxStat = Math.max(...statScores);
  const normStat = statScores.map(s => s / maxStat);

  const recentResults = results.slice(-200);
  const seqLen = Math.min(20, Math.floor(recentResults.length * 0.5));
  let lstmProbs: number[];

  if (recentResults.length >= seqLen + 10) {
    lstmProbs = await trainLSTMAndPredict(recentResults, gameConfig, onProgress);
  } else {
    lstmProbs = new Array(maxNumber).fill(1 / maxNumber);
  }

  const maxLstm = Math.max(...lstmProbs);
  const normLstm = lstmProbs.map(p => p / maxLstm);

  const ensemble = normStat.map((s, i) => ({
    num: i + 1,
    score: 0.5 * s + 0.5 * normLstm[i],
  }));

  const filtered = ensemble.filter(e => !config.mustExclude.includes(e.num));
  const selected = new Set(config.mustInclude);
  filtered.sort((a, b) => b.score - a.score);
  for (const e of filtered) {
    if (selected.size >= pickCount) break;
    if (!selected.has(e.num)) selected.add(e.num);
  }

  const numbers = Array.from(selected).sort((a, b) => a - b);
  return {
    id: crypto.randomUUID(),
    numbers,
    method: 'ensemble',
    confidence: 0.12 + Math.random() * 0.13,
    reasoning: '統計分析スコアと LSTM 出力の加重平均によるアンサンブル予測',
    createdAt: new Date().toISOString(),
  };
}
