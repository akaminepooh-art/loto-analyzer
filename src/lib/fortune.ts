import { BirthDate, NumerologyProfile, LuckyNumberResult, DailyFortune, GameConfig, GameType, GAME_CONFIGS } from './types';
import { getNumerologyProfile } from './numerology-data';
import { getRokuyo } from './rokuyo';

// デジタルルート（マスターナンバー対応）
export function digitalRoot(n: number): number {
  if (n === 11 || n === 22 || n === 33) return n;
  while (n >= 10) {
    n = String(n).split('').reduce((sum, d) => sum + parseInt(d), 0);
    if (n === 11 || n === 22 || n === 33) return n;
  }
  return n;
}

// ライフパス数
export function calcLifePath(year: number, month: number, day: number): number {
  const y = digitalRoot(year);
  const m = digitalRoot(month);
  const d = digitalRoot(day);
  return digitalRoot(y + m + d);
}

// 誕生数
export function calcBirthNumber(day: number): number {
  return digitalRoot(day);
}

// 個人年数
export function calcPersonalYear(birthMonth: number, birthDay: number, currentYear: number): number {
  const m = digitalRoot(birthMonth);
  const d = digitalRoot(birthDay);
  const y = digitalRoot(currentYear);
  return digitalRoot(m + d + y);
}

// 個人月数
export function calcPersonalMonth(personalYear: number, currentMonth: number): number {
  return digitalRoot(personalYear + currentMonth);
}

// 個人日数
export function calcPersonalDay(personalMonth: number, currentDay: number): number {
  return digitalRoot(personalMonth + currentDay);
}

// 全数秘術プロフィールの算出
export function calcNumerologyProfile(birthDate: BirthDate, today: Date): NumerologyProfile {
  const lifePath = calcLifePath(birthDate.year, birthDate.month, birthDate.day);
  const birthNumber = calcBirthNumber(birthDate.day);
  const personalYear = calcPersonalYear(birthDate.month, birthDate.day, today.getFullYear());
  const personalMonth = calcPersonalMonth(personalYear, today.getMonth() + 1);
  const personalDay = calcPersonalDay(personalMonth, today.getDate());

  const base = getNumerologyProfile(lifePath);

  return {
    lifePath,
    birthNumber,
    personalYear,
    personalMonth,
    personalDay,
    ...base,
  };
}

// ラッキーナンバー生成
export function generateLuckyNumbers(
  birthDate: BirthDate,
  today: Date,
  config: GameConfig
): LuckyNumberResult {
  const profile = calcNumerologyProfile(birthDate, today);
  const { lifePath, birthNumber, personalDay } = profile;

  // コア番号1: ライフパス数ベース（固定）
  const core1 = ((lifePath * 7) % config.maxNumber) + 1;

  // コア番号2: 誕生数 × 個人日数（日替わり）
  const core2 = ((birthNumber * personalDay * 3) % config.maxNumber) + 1;

  // コア番号3: 個人日数ベース（日替わり）
  const core3 = ((personalDay * 13 + birthDate.day * 7 + today.getDate()) % config.maxNumber) + 1;

  // 重複排除
  const numbers = [...new Set([core1, core2, core3])];

  // 各番号の理由（ゲーム文脈を含む）
  const reasoning: string[] = [];
  const profileData = getNumerologyProfile(lifePath);

  reasoning.push(
    `ライフパス数${lifePath}（${profileData.systemName}）を${config.name}の番号域1〜${config.maxNumber}に投影した、あなたの核となる番号です`
  );

  if (numbers.length >= 2) {
    reasoning.push(
      `誕生数${birthNumber}と今日の個人日数${personalDay}の共鳴を${config.name}の${config.pickCount}個選択の流れに乗せて浮かび上がった番号です`
    );
  }

  if (numbers.length >= 3) {
    reasoning.push(
      `${profileData.systemName}タイプの波動が${config.name}（1〜${config.maxNumber}）の中で今日特に引き寄せている番号です`
    );
  }

  return { numbers, reasoning, profile };
}

// 属性マッピング
const ELEMENT_GROUPS: Record<string, number[]> = {
  '火': [1, 9],
  '水': [2, 6],
  '風': [3, 5],
  '地': [4, 8, 22],
  '光': [7, 11, 33],
};

function isSameElement(personalDay: number, lifePath: number): boolean {
  for (const nums of Object.values(ELEMENT_GROUPS)) {
    const pdMatch = nums.includes(personalDay) || nums.includes(personalDay > 9 ? digitalRoot(personalDay) : personalDay);
    const lpMatch = nums.includes(lifePath) || nums.includes(lifePath > 9 ? digitalRoot(lifePath) : lifePath);
    if (pdMatch && lpMatch) return true;
  }
  return false;
}

// 日運スコア算出
export function calcDailyScore(
  birthDate: BirthDate,
  targetDate: Date,
): { score: number; label: string; message: string; personalDay: number; rokuyo: string } {
  const profile = calcNumerologyProfile(birthDate, targetDate);
  const { lifePath, birthNumber, personalDay } = profile;
  const rokuyo = getRokuyo(targetDate);

  // 個人日数スコア（0〜3点）
  let personalScore = 0;
  if (personalDay === lifePath) {
    personalScore = 3; // 完全共鳴
  } else if (personalDay === birthNumber) {
    personalScore = 2; // 強い共鳴
  } else if (isSameElement(personalDay, lifePath)) {
    personalScore = 1; // 属性一致
  }

  // 六曜スコア（0〜2点）
  let rokuyoScore = 0;
  if (rokuyo === '大安') rokuyoScore = 2;
  else if (rokuyo === '友引' || rokuyo === '先勝' || rokuyo === '先負') rokuyoScore = 1;

  const total = personalScore + rokuyoScore;

  // 5段階マッピング
  let score: number;
  let label: string;
  let message: string;

  if (total >= 5) {
    score = 5;
    label = '最高の購入日';
    message = '数字の神様があなたを呼んでいます';
  } else if (total === 4) {
    score = 4;
    label = '強くおすすめ';
    message = '今日の流れに乗りましょう';
  } else if (total === 3) {
    score = 3;
    label = '良い日';
    message = '直感を信じて';
  } else if (total === 2) {
    score = 2;
    label = '控えめに';
    message = '少額で楽しむ日';
  } else {
    score = 1;
    label = '見送り推奨';
    message = '次の好機を待ちましょう';
  }

  return { score, label, message, personalDay, rokuyo };
}

// 4週間分の購入おすすめカレンダー生成
export function generateFortuneCalendar(
  birthDate: BirthDate,
  startDate: Date,
): DailyFortune[] {
  const fortunes: DailyFortune[] = [];
  const gameTypes: GameType[] = ['loto6', 'loto7', 'miniloto'];

  for (let i = 0; i < 28; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();

    // この日に抽選があるゲームを探す
    for (const gt of gameTypes) {
      const gc = GAME_CONFIGS[gt];
      if (gc.drawDayOfWeek === dayOfWeek) {
        const { score, label, message, rokuyo } = calcDailyScore(birthDate, date);
        const lucky = generateLuckyNumbers(birthDate, date, gc);

        fortunes.push({
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
          score,
          rokuyo,
          label,
          message,
          luckyNumbers: lucky.numbers,
          gameType: gt,
        });
      }
    }
  }

  return fortunes;
}

// localStorage から生年月日を取得
export function loadBirthDate(): BirthDate | null {
  try {
    const stored = localStorage.getItem('fortune_birthdate');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

// localStorage に生年月日を保存
export function saveBirthDate(birthDate: BirthDate): void {
  localStorage.setItem('fortune_birthdate', JSON.stringify(birthDate));
}
