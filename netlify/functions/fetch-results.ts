import type { Handler, HandlerEvent } from '@netlify/functions';

interface LotoResult {
  round: number;
  date: string;
  numbers: number[];
  bonus: number | number[];
  firstPrize: number;
  firstWinners: number;
  carryover: number;
  totalSales: number;
}

interface GameDef {
  url: string;
  pickCount: number;
  bonusCount: number;
  hasCarryover: boolean;
}

const GAME_DEFS: Record<string, GameDef> = {
  loto6: {
    url: 'https://loto6.thekyo.jp/data/loto6.csv',
    pickCount: 6,
    bonusCount: 1,
    hasCarryover: true,
  },
  loto7: {
    url: 'https://loto7.thekyo.jp/data/loto7.csv',
    pickCount: 7,
    bonusCount: 2,
    hasCarryover: true,
  },
  miniloto: {
    url: 'https://miniloto.thekyo.jp/data/miniloto.csv',
    pickCount: 5,
    bonusCount: 1,
    hasCarryover: false,
  },
};

// CSV列マッピング (thekyo.jp共通パターン)
// 回号, 日付, 本数字×N, ボーナス×M, 当選口数×等数, 賞金額×等数, [キャリーオーバー]
function parseCSV(csv: string, def: GameDef): LotoResult[] {
  const lines = csv.trim().split('\n');
  const results: LotoResult[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === 'EOF') continue;

    const cols = line.split(',');
    if (cols.length < 2 + def.pickCount + def.bonusCount + 2) continue;

    try {
      const round = parseInt(cols[0]);
      if (isNaN(round)) continue;

      const date = cols[1]?.trim();

      // 本数字
      const numStart = 2;
      const numEnd = numStart + def.pickCount;
      const numbers: number[] = [];
      for (let j = numStart; j < numEnd; j++) {
        const n = parseInt(cols[j]);
        if (!isNaN(n)) numbers.push(n);
      }
      if (numbers.length !== def.pickCount) continue;
      numbers.sort((a, b) => a - b);

      // ボーナス
      const bonusStart = numEnd;
      let bonus: number | number[];
      if (def.bonusCount === 1) {
        bonus = parseInt(cols[bonusStart]);
        if (isNaN(bonus)) continue;
      } else {
        const bonuses: number[] = [];
        for (let j = bonusStart; j < bonusStart + def.bonusCount; j++) {
          const b = parseInt(cols[j]);
          if (!isNaN(b)) bonuses.push(b);
        }
        if (bonuses.length !== def.bonusCount) continue;
        bonus = bonuses;
      }

      // 当選口数・賞金額
      // ロト6: 5等制 (口数5 + 賞金5 + CO = 11列)
      // ロト7: 6等制 (口数6 + 賞金6 + CO = 13列)
      // ミニロト: 4等制 (口数4 + 賞金4 = 8列)
      const afterBonus = bonusStart + def.bonusCount;
      const firstWinners = parseInt(cols[afterBonus] || '0') || 0;

      // 等級数の判定
      let prizeCount: number;
      if (def.pickCount === 7) prizeCount = 6;
      else if (def.pickCount === 6) prizeCount = 5;
      else prizeCount = 4;

      const firstPrizeIdx = afterBonus + prizeCount;
      const firstPrize = parseInt(cols[firstPrizeIdx]?.replace(/[^0-9]/g, '') || '0') || 0;

      let carryover = 0;
      if (def.hasCarryover) {
        const coIdx = afterBonus + prizeCount * 2;
        carryover = parseInt(cols[coIdx]?.replace(/[^0-9]/g, '') || '0') || 0;
      }

      results.push({
        round,
        date,
        numbers,
        bonus,
        firstPrize,
        firstWinners,
        carryover,
        totalSales: 0,
      });
    } catch {
      continue;
    }
  }

  return results;
}

const handler: Handler = async (event: HandlerEvent) => {
  const params = event.queryStringParameters || {};
  const game = params.game || 'loto6';
  const def = GAME_DEFS[game];

  if (!def) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: `不明なゲーム種別: ${game}` }),
    };
  }

  try {
    const res = await fetch(def.url, {
      headers: { 'User-Agent': 'LotoAnalyzer/2.0' },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${def.url}`);
    }

    const buf = await res.arrayBuffer();
    // thekyo.jp はShift-JIS。TextDecoderでデコード
    const csv = new TextDecoder('shift-jis').decode(buf);
    const data = parseCSV(csv, def);

    if (data.length > 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
        body: JSON.stringify({
          success: true,
          data,
          lastUpdated: new Date().toISOString(),
          source: 'thekyo.jp',
          totalRecords: data.length,
          game,
        }),
      };
    }

    throw new Error('パース結果が空でした');
  } catch (err) {
    console.error(`Failed to fetch ${game}:`, err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: `${game}のデータ取得に失敗しました: ${err instanceof Error ? err.message : String(err)}`,
      }),
    };
  }
};

export { handler };
