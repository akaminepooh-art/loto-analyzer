import { LotoResult, GameConfig } from './types';

// サンプルデータ: Netlify Function が利用できない場合のフォールバック用
export function generateSampleData(config: GameConfig): LotoResult[] {
  const data: LotoResult[] = [];
  const startDate = new Date('2000-10-05');
  const numRounds = 500;

  for (let i = 1; i <= numRounds; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor(i * 3.5));

    const numbers = generateRandomNumbers(config.pickCount, 1, config.maxNumber);

    let bonus: number | number[];
    if (config.bonusCount === 1) {
      do {
        bonus = Math.floor(Math.random() * config.maxNumber) + 1;
      } while (numbers.includes(bonus as number));
    } else {
      const bonuses: number[] = [];
      while (bonuses.length < config.bonusCount) {
        const b = Math.floor(Math.random() * config.maxNumber) + 1;
        if (!numbers.includes(b) && !bonuses.includes(b)) {
          bonuses.push(b);
        }
      }
      bonus = bonuses;
    }

    data.push({
      round: i,
      date: date.toISOString().split('T')[0],
      numbers: numbers.sort((a, b) => a - b),
      bonus,
      firstPrize: Math.floor(Math.random() * 300000000) + 50000000,
      firstWinners: Math.floor(Math.random() * 5) + 1,
      carryover: Math.random() > 0.7 ? Math.floor(Math.random() * 600000000) : 0,
      totalSales: Math.floor(Math.random() * 2000000000) + 1000000000,
    });
  }

  return data;
}

function generateRandomNumbers(count: number, min: number, max: number): number[] {
  const nums = new Set<number>();
  while (nums.size < count) {
    nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(nums);
}
