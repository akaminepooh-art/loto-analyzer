import { LotoResult, FrequencyData, GapData, PairData, SumStats, OddEvenStats, GameConfig } from './types';

/**
 * 各番号の出現頻度を計算
 */
export function calcFrequency(results: LotoResult[], config: GameConfig, lastN?: number): FrequencyData[] {
  const data = lastN ? results.slice(-lastN) : results;
  const totalRounds = data.length;
  const expected = (totalRounds * config.pickCount) / config.maxNumber;
  const counts = new Array(config.maxNumber + 1).fill(0);

  for (const r of data) {
    for (const n of r.numbers) {
      counts[n]++;
    }
  }

  return Array.from({ length: config.maxNumber }, (_, i) => {
    const num = i + 1;
    return {
      number: num,
      count: counts[num],
      percentage: totalRounds > 0 ? (counts[num] / totalRounds) * 100 : 0,
      expected,
    };
  });
}

/**
 * 各番号のギャップ（未出現回数）を計算
 */
export function calcGaps(results: LotoResult[], config: GameConfig): GapData[] {
  const gaps: GapData[] = [];

  for (let num = 1; num <= config.maxNumber; num++) {
    const appearances: number[] = [];
    for (let i = 0; i < results.length; i++) {
      if (results[i].numbers.includes(num)) {
        appearances.push(i);
      }
    }

    let currentGap = 0;
    if (appearances.length > 0) {
      currentGap = results.length - 1 - appearances[appearances.length - 1];
    } else {
      currentGap = results.length;
    }

    const intervalGaps: number[] = [];
    for (let i = 1; i < appearances.length; i++) {
      intervalGaps.push(appearances[i] - appearances[i - 1]);
    }
    const averageGap = intervalGaps.length > 0
      ? intervalGaps.reduce((a, b) => a + b, 0) / intervalGaps.length
      : results.length;
    const maxGap = intervalGaps.length > 0 ? Math.max(...intervalGaps) : results.length;

    gaps.push({ number: num, currentGap, averageGap, maxGap });
  }

  return gaps;
}

/**
 * ペアの共出現頻度を計算
 */
export function calcPairs(results: LotoResult[], _config: GameConfig, topN = 30): PairData[] {
  const pairCounts = new Map<string, number>();

  for (const r of results) {
    for (let i = 0; i < r.numbers.length; i++) {
      for (let j = i + 1; j < r.numbers.length; j++) {
        const key = `${r.numbers[i]}-${r.numbers[j]}`;
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  }

  const pairs: PairData[] = [];
  for (const [key, count] of pairCounts.entries()) {
    const [a, b] = key.split('-').map(Number);
    pairs.push({ pair: [a, b], count, label: `${a}-${b}` });
  }

  pairs.sort((a, b) => b.count - a.count);
  return pairs.slice(0, topN);
}

/**
 * 合計値の統計
 */
export function calcSumStats(results: LotoResult[]): SumStats {
  const sums = results.map(r => r.numbers.reduce((a, b) => a + b, 0));
  const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
  const variance = sums.reduce((a, s) => a + (s - mean) ** 2, 0) / sums.length;
  const stddev = Math.sqrt(variance);

  const binSize = 20;
  const minSum = Math.min(...sums);
  const maxSum = Math.max(...sums);
  const bins: { range: string; count: number }[] = [];

  for (let start = Math.floor(minSum / binSize) * binSize; start <= maxSum; start += binSize) {
    const end = start + binSize;
    const count = sums.filter(s => s >= start && s < end).length;
    bins.push({ range: `${start}-${end - 1}`, count });
  }

  return { mean, stddev, min: Math.min(...sums), max: Math.max(...sums), distribution: bins };
}

/**
 * 奇数・偶数比率
 */
export function calcOddEven(results: LotoResult[], config: GameConfig): OddEvenStats[] {
  const patterns = new Map<string, number>();

  for (const r of results) {
    const odds = r.numbers.filter(n => n % 2 === 1).length;
    const evens = config.pickCount - odds;
    const key = `${odds}奇${evens}偶`;
    patterns.set(key, (patterns.get(key) || 0) + 1);
  }

  return Array.from(patterns.entries())
    .map(([pattern, count]) => ({
      pattern,
      count,
      percentage: (count / results.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 連番出現率
 */
export function calcConsecutive(results: LotoResult[]): { hasConsecutive: number; noConsecutive: number; percentage: number } {
  let hasConsecutive = 0;
  for (const r of results) {
    const sorted = [...r.numbers].sort((a, b) => a - b);
    let found = false;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) {
        found = true;
        break;
      }
    }
    if (found) hasConsecutive++;
  }
  return {
    hasConsecutive,
    noConsecutive: results.length - hasConsecutive,
    percentage: (hasConsecutive / results.length) * 100,
  };
}

/**
 * トレンド分析 — 各番号の移動平均出現率
 */
export function calcTrend(results: LotoResult[], num: number, windowSize = 50): { round: number; rate: number }[] {
  const trend: { round: number; rate: number }[] = [];
  for (let i = windowSize; i <= results.length; i++) {
    const window = results.slice(i - windowSize, i);
    const count = window.filter(r => r.numbers.includes(num)).length;
    trend.push({ round: results[i - 1].round, rate: (count / windowSize) * 100 });
  }
  return trend;
}

/**
 * ホット/コールド番号
 */
export function getHotCold(freq: FrequencyData[], topN = 10): { hot: FrequencyData[]; cold: FrequencyData[] } {
  const sorted = [...freq].sort((a, b) => b.count - a.count);
  return {
    hot: sorted.slice(0, topN),
    cold: sorted.slice(-topN).reverse(),
  };
}
