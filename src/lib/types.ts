export type GameType = 'loto6' | 'loto7' | 'miniloto';

export interface GameConfig {
  id: GameType;
  name: string;
  maxNumber: number;
  pickCount: number;
  bonusCount: number;
  drawDay: string;
  drawDayOfWeek: number;
  color: string;
  colorLight: string;
  emoji: string;
}

export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  loto6: {
    id: 'loto6',
    name: 'ロト6',
    maxNumber: 43,
    pickCount: 6,
    bonusCount: 1,
    drawDay: '木曜',
    drawDayOfWeek: 4,
    color: '#F59E0B',
    colorLight: '#FBBF24',

    emoji: '🎱',
  },
  loto7: {
    id: 'loto7',
    name: 'ロト7',
    maxNumber: 37,
    pickCount: 7,
    bonusCount: 2,
    drawDay: '金曜',
    drawDayOfWeek: 5,
    color: '#3B82F6',
    colorLight: '#60A5FA',

    emoji: '🍀',
  },
  miniloto: {
    id: 'miniloto',
    name: 'ミニロト',
    maxNumber: 31,
    pickCount: 5,
    bonusCount: 1,
    drawDay: '火曜',
    drawDayOfWeek: 2,
    color: '#10B981',
    colorLight: '#34D399',

    emoji: '✨',
  },
};

export interface LotoResult {
  round: number;
  date: string;
  numbers: number[];
  bonus: number | number[];
  firstPrize: number;
  firstWinners: number;
  carryover: number;
  totalSales: number;
}

export interface FrequencyData {
  number: number;
  count: number;
  percentage: number;
  expected: number;
}

export interface GapData {
  number: number;
  currentGap: number;
  averageGap: number;
  maxGap: number;
}

export interface PairData {
  pair: [number, number];
  count: number;
  label: string;
}

export interface SumStats {
  mean: number;
  stddev: number;
  min: number;
  max: number;
  distribution: { range: string; count: number }[];
}

export interface OddEvenStats {
  pattern: string;
  count: number;
  percentage: number;
}

export interface Prediction {
  id: string;
  numbers: number[];
  method: 'statistical' | 'ai' | 'fortune';
  confidence: number;
  reasoning: string;
  createdAt: string;
  matchResult?: { round: number; matched: number; matchedNumbers: number[] };
}

export interface PredictionConfig {
  method: 'statistical' | 'ai' | 'fortune';
  mustInclude: number[];
  mustExclude: number[];
  weights: {
    frequency: number;
    gap: number;
    trend: number;
    pair: number;
  };
}

export type PageId = 'dashboard' | 'analysis' | 'prediction' | 'history' | 'fortune' | 'legal';

// 占い関連型
export interface BirthDate {
  year: number;
  month: number;
  day: number;
}

export interface NumerologyProfile {
  lifePath: number;
  birthNumber: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  systemName: string;
  systemTitle: string;
  element: string;
  description: string;
  color: string;
  emoji: string;
  coreNumbers: number[];
}

export interface DailyFortune {
  date: string;
  score: number;
  rokuyo: string;
  label: string;
  message: string;
  luckyNumbers: number[];
  gameType?: GameType;
}

export interface LuckyNumberResult {
  numbers: number[];
  reasoning: string[];
  profile: NumerologyProfile;
}
