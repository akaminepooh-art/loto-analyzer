import { useState, useEffect, useCallback } from 'react';
import { LotoResult, GameType, GAME_CONFIGS } from '../lib/types';
import { generateSampleData } from '../lib/sampleData';
import { supabase } from '../lib/supabase';

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6時間

interface CacheEntry {
  data: LotoResult[];
  timestamp: number;
}

// Supabase の draw_type マッピング
const DRAW_TYPE_MAP: Record<GameType, string> = {
  loto6: 'loto6',
  loto7: 'loto7',
  miniloto: 'miniloto',
};

export function useLotoData(gameType: GameType) {
  const [data, setData] = useState<LotoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');

  const config = GAME_CONFIGS[gameType];
  const cacheKey = `${gameType}_data`;

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // キャッシュ確認
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          if (Date.now() - entry.timestamp < CACHE_TTL) {
            setData(entry.data);
            setSource('キャッシュ');
            setLoading(false);
            return;
          }
        }
      } catch {
        // キャッシュ読み込みエラーは無視
      }
    }

    // 1. Supabase からデータ取得を試行
    if (supabase) {
      try {
        // Supabaseデフォルト上限1000行を回避するためページネーションで全件取得
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allRows: any[] = [];
        let from = 0;
        const PAGE_SIZE = 1000;
        let hasMore = true;
        let sbError = null;

        while (hasMore) {
          const { data: rows, error } = await supabase
            .from('loto_draws')
            .select('*')
            .eq('draw_type', DRAW_TYPE_MAP[gameType])
            .order('draw_no', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

          if (error) { sbError = error; break; }
          if (rows && rows.length > 0) {
            allRows.push(...rows);
            from += PAGE_SIZE;
            hasMore = rows.length === PAGE_SIZE;
          } else {
            hasMore = false;
          }
        }

        const rows = allRows;

        if (!sbError && rows && rows.length > 0) {
          const mapped: LotoResult[] = rows.map((r) => ({
            round: r.draw_no,
            date: r.draw_date,
            numbers: r.numbers,
            bonus: config.bonusCount === 1 ? r.bonus_numbers[0] : r.bonus_numbers,
            firstPrize: r.prize_1 || 0,
            firstWinners: r.winners_1 || 0,
            carryover: r.carryover || 0,
            totalSales: 0,
          }));
          setData(mapped);
          setSource('Supabase');
          localStorage.setItem(cacheKey, JSON.stringify({
            data: mapped,
            timestamp: Date.now(),
          }));
          setLoading(false);
          return;
        }
      } catch {
        console.log('Supabase not available, trying static data');
      }
    }

    // 2. 自前ホスティングJSONからデータ取得
    try {
      const res = await fetch(`/data/${gameType}.json`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setData(json.data);
          setSource(json.source || 'self-hosted');
          localStorage.setItem(cacheKey, JSON.stringify({
            data: json.data,
            timestamp: Date.now(),
          }));
          setLoading(false);
          return;
        }
      }
    } catch {
      console.log('Static data not available, using sample data');
    }

    // 3. フォールバック: サンプルデータ
    const sample = generateSampleData(config);
    setData(sample);
    setSource('サンプルデータ');
    setLoading(false);
  }, [gameType, cacheKey, config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, source, refresh: () => fetchData(true) };
}
