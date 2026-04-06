#!/usr/bin/env node
/**
 * ロトデータ更新スクリプト
 * thekyo.jp から最新の抽選結果を取得し:
 *   1. public/data/*.json を更新（静的ホスティング用）
 *   2. Supabase loto_draws テーブルに書き込み（リアルタイムDB用）
 *
 * GitHub Actions から週3回（火水金の翌朝）自動実行される。
 * 使い方: node scripts/update-data.mjs
 *
 * 環境変数（Supabase書き込み用、オプション）:
 *   SUPABASE_URL         — Supabase プロジェクトURL
 *   SUPABASE_SERVICE_KEY  — Service Role Key（書き込み権限）
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');

// Supabase クライアント（環境変数がある場合のみ有効）
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

const GAMES = [
  {
    id: 'loto6',
    url: 'https://loto6.thekyo.jp/data/loto6.csv',
    pickCount: 6,
    bonusCount: 1,
    hasCarryover: true,
  },
  {
    id: 'loto7',
    url: 'https://loto7.thekyo.jp/data/loto7.csv',
    pickCount: 7,
    bonusCount: 2,
    hasCarryover: true,
  },
  {
    id: 'miniloto',
    url: 'https://miniloto.thekyo.jp/data/miniloto.csv',
    pickCount: 5,
    bonusCount: 1,
    hasCarryover: false,
  },
];

function parseCSV(csv, { pickCount, bonusCount, hasCarryover }) {
  const lines = csv.trim().split('\n');
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === 'EOF') continue;
    const cols = line.split(',');
    if (cols.length < 2 + pickCount + bonusCount + 2) continue;

    try {
      const round = parseInt(cols[0]);
      if (isNaN(round)) continue;
      const date = cols[1]?.trim();

      const numbers = [];
      for (let j = 2; j < 2 + pickCount; j++) {
        const n = parseInt(cols[j]);
        if (!isNaN(n)) numbers.push(n);
      }
      if (numbers.length !== pickCount) continue;
      numbers.sort((a, b) => a - b);

      const bonusStart = 2 + pickCount;
      let bonus;
      let bonusArray;
      if (bonusCount === 1) {
        bonus = parseInt(cols[bonusStart]);
        if (isNaN(bonus)) continue;
        bonusArray = [bonus];
      } else {
        const bonuses = [];
        for (let j = bonusStart; j < bonusStart + bonusCount; j++) {
          const b = parseInt(cols[j]);
          if (!isNaN(b)) bonuses.push(b);
        }
        if (bonuses.length !== bonusCount) continue;
        bonus = bonuses;
        bonusArray = bonuses;
      }

      const afterBonus = bonusStart + bonusCount;
      const firstWinners = parseInt(cols[afterBonus] || '0') || 0;
      const prizeCount = pickCount === 7 ? 6 : pickCount === 6 ? 5 : 4;
      const firstPrizeIdx = afterBonus + prizeCount;
      const firstPrize =
        parseInt(cols[firstPrizeIdx]?.replace(/[^0-9]/g, '') || '0') || 0;

      let carryover = 0;
      if (hasCarryover) {
        const coIdx = afterBonus + prizeCount * 2;
        carryover =
          parseInt(cols[coIdx]?.replace(/[^0-9]/g, '') || '0') || 0;
      }

      results.push({
        round,
        date,
        numbers,
        bonus,
        bonusArray,
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

/**
 * Supabase loto_draws テーブルへ upsert
 */
async function syncToSupabase(gameId, data) {
  if (!supabase) return;

  try {
    // loto_draws テーブルのスキーマに合わせて変換
    const rows = data.map((r) => ({
      draw_type: gameId,
      draw_no: r.round,
      draw_date: r.date,
      numbers: r.numbers,
      bonus_numbers: r.bonusArray,
      prize_1: r.firstPrize,
      winners_1: r.firstWinners,
      carryover: r.carryover,
    }));

    // 100件ずつバッチ upsert（draw_type + draw_no でユニーク）
    const BATCH = 100;
    let upserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error } = await supabase
        .from('loto_draws')
        .upsert(batch, { onConflict: 'draw_type,draw_no' });
      if (error) throw error;
      upserted += batch.length;
    }
    console.log(`   📡 Supabase: ${upserted} rows upserted`);
  } catch (err) {
    console.error(`   ⚠️  Supabase sync failed: ${err.message}`);
  }
}

async function fetchGame(game) {
  const outPath = join(DATA_DIR, `${game.id}.json`);

  // 既存データを読み込み（フォールバック用）
  let existing = null;
  if (existsSync(outPath)) {
    try {
      existing = JSON.parse(readFileSync(outPath, 'utf-8'));
    } catch {
      // 読み込み失敗は無視
    }
  }

  try {
    const res = await fetch(game.url, {
      headers: { 'User-Agent': 'LotoAnalyzer/2.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buf = await res.arrayBuffer();
    const csv = new TextDecoder('shift-jis').decode(new Uint8Array(buf));
    const data = parseCSV(csv, game);

    if (data.length === 0) throw new Error('パース結果が空');

    // 静的JSONに保存（bonusArrayは除外）
    const jsonData = data.map(({ bonusArray, ...rest }) => rest);
    const output = {
      success: true,
      data: jsonData,
      lastUpdated: new Date().toISOString(),
      source: 'self-hosted',
      totalRecords: data.length,
      game: game.id,
    };

    writeFileSync(outPath, JSON.stringify(output));
    console.log(`✅ ${game.id}: ${data.length} records updated`);

    // Supabase に同期
    await syncToSupabase(game.id, data);

    return true;
  } catch (err) {
    console.error(`❌ ${game.id}: ${err.message}`);
    if (existing) {
      console.log(`   → 既存データを維持 (${existing.totalRecords} records)`);
    }
    return false;
  }
}

async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  console.log(`🎱 ロトデータ更新開始: ${new Date().toISOString()}`);
  if (supabase) {
    console.log('📡 Supabase 同期: 有効');
  } else {
    console.log('📡 Supabase 同期: 無効（環境変数未設定）');
  }

  const results = await Promise.all(GAMES.map(fetchGame));
  const allOk = results.every(Boolean);

  if (!allOk) {
    console.log('\n⚠️  一部のデータ更新に失敗しましたが、既存データで継続します。');
  } else {
    console.log('\n🎉 全データ更新完了');
  }
}

main();
