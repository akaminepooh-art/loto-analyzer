# ロト アナライザー — Claude Code 引き継ぎ＆設計仕様書

## プロジェクト概要

日本のロト系宝くじ（ロト6・ロト7・ミニロト）の過去の抽選結果を統計分析・AI予測・数秘術占いで
次回の番号を予測するWebアプリ。クライアントサイド完結（TensorFlow.js）。

**URL**: https://loto-analyzer.netlify.app
**GitHub**: https://github.com/akaminepooh-art/loto-analyzer

## 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite 8 + Tailwind CSS 4
- **ML**: TensorFlow.js（LSTM、ブラウザ内学習・推論）
- **チャート**: Recharts 3
- **データ**: 自前ホスティング（public/data/*.json）+ Supabase
- **キャッシュ**: localStorage（6時間TTL、ゲーム種別ごとに分離）
- **デプロイ**: Netlify（GitHub連携自動デプロイ）

## Supabase 接続情報

- **プロジェクト**: koei-analyzer（公営競技共有）
- **URL**: https://jvikgmqtzprwsxozulvx.supabase.co
- **テーブル**: loto_draws
  - draw_type (loto6/loto7/miniloto)
  - draw_no, draw_date
  - numbers (INTEGER[]), bonus_numbers (INTEGER[])
  - prize_1, winners_1, prize_2, winners_2, prize_3, winners_3
  - carryover
- **フロントのキー**: VITE_SUPABASE_ANON_KEY（.env参照）
- **スクリプトのキー**: SUPABASE_SERVICE_KEY（GitHub Secrets参照）

## データ取得フロー

### フロントエンド（useLotoData.ts）
```
1. localStorage キャッシュ確認（6時間TTL）
2. Supabase loto_draws テーブルから取得
3. 静的JSON（/data/{game}.json）から取得
4. サンプルデータ（フォールバック）
```

### データ更新（scripts/update-data.mjs）
```
GitHub Actions（水・金・土 9:00 JST）
  → thekyo.jp から CSV 取得
  → public/data/*.json に保存
  → Supabase loto_draws に upsert
  → git commit & push
  → Netlify 自動デプロイ
```

## ディレクトリ構成

```
loto-analyzer/
├── index.html              # noscript フォールバック付き
├── netlify.toml            # ビルド設定・ヘッダー・リダイレクト
├── package.json
├── .env                    # Supabase接続（gitignore対象）
├── .env.example            # テンプレート
├── .github/
│   └── workflows/
│       └── update-loto-data.yml  # 週3回自動データ更新
├── scripts/
│   └── update-data.mjs     # データ取得・JSON保存・Supabase同期
├── public/
│   ├── data/               # 静的JSON（loto6/loto7/miniloto）
│   ├── images/             # AI生成背景画像（5枚）
│   ├── ogp.png             # OGP画像
│   ├── ads.txt             # AdSense認証
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── main.tsx
│   ├── App.tsx             # gameType state、スワイプ切り替え、テーマカラー
│   ├── index.css           # ダーク/ライトテーマ、背景画像、グラスモーフィズム
│   ├── lib/
│   │   ├── types.ts        # GameType, GameConfig, GAME_CONFIGS, 占い関連型
│   │   ├── analysis.ts     # 統計分析（8関数、config引数対応）
│   │   ├── prediction.ts   # 3予測手法（統計・AI・運勢）
│   │   ├── sampleData.ts   # フォールバックデータ生成
│   │   ├── supabase.ts     # Supabase クライアント
│   │   ├── fortune.ts      # 数秘術占いロジック
│   │   ├── numerology-data.ts # 数秘術プロフィールデータ
│   │   ├── rokuyo.ts       # 六曜判定
│   │   └── kichijitsu.ts   # 吉日判定（一粒万倍日・天赦日等）
│   ├── hooks/
│   │   └── useLotoData.ts  # データ取得（Supabase→静的JSON→サンプル）
│   ├── components/
│   │   ├── Header.tsx      # ゲームセレクター＋テーマ切替＋TOP
│   │   ├── GameSelector.tsx # タブ型ゲーム選択
│   │   ├── LotoBall.tsx    # 番号ボール（動的カラーリング）
│   │   ├── GlassCard.tsx   # グラスモーフィズムカード
│   │   ├── BirthDateInput.tsx # 年月日セレクトボックス
│   │   ├── FortuneCard.tsx # 占い結果カード
│   │   ├── FortuneCalendar.tsx # 購入おすすめ日カレンダー
│   │   ├── ShareQR.tsx     # QRコード共有
│   │   ├── AdSlot.tsx      # AdSense広告枠（フラグ制御）
│   │   ├── CookieConsent.tsx # Cookie同意バナー
│   │   └── Disclaimer.tsx  # 免責事項
│   └── pages/
│       ├── DashboardPage.tsx   # ホーム（最新結果・頻度・ホット/コールド）
│       ├── AnalysisPage.tsx    # 5タブ分析
│       ├── PredictionPage.tsx  # 統計・AI・運勢の3柱予測
│       ├── FortunePage.tsx     # 占い（数秘術プロフィール・カレンダー）
│       ├── HistoryPage.tsx     # 抽選履歴
│       └── LegalPage.tsx       # プライバシーポリシー・利用規約・免責
```

## ゲームパラメータ

| ゲーム | 番号範囲 | 選択数 | ボーナス | 抽選日 | テーマカラー |
|--------|----------|--------|----------|--------|------------|
| ロト6 | 1〜43 | 6個 | 1個 | 毎週木曜 | #F59E0B (amber) |
| ロト7 | 1〜37 | 7個 | 2個 | 毎週金曜 | #3B82F6 (blue) |
| ミニロト | 1〜31 | 5個 | 1個 | 毎週火曜 | #10B981 (emerald) |

## 予測の3柱

| 手法 | method値 | 内容 |
|------|---------|------|
| 統計予測 | statistical | 頻度・ギャップ・ペア分析ベースの重み付け選出 |
| AI予測 | ai | TensorFlow.js LSTM（ブラウザ内学習・推論） |
| 運勢予測 | fortune | 数秘術（ライフパス数・個人日数）ベースのラッキーナンバー |

## AdSense

- パブリッシャーID: ca-pub-4671107688556806
- 広告コンポーネント: AdSlot.tsx（AD_ENABLED フラグで制御）
- 審査通過後にフラグを true に変更して有効化

## Netlify 設定

- Site ID: e262a235-4b68-4bec-bc22-c92423302811
- GitHub連携: akaminepooh-art/loto-analyzer (main)
- ビルド: npm run build → dist/

## GitHub Secrets（要設定）

GitHub Actions でSupabase同期を有効にするには:
- `SUPABASE_URL`: https://jvikgmqtzprwsxozulvx.supabase.co
- `SUPABASE_SERVICE_KEY`: Service Role Key

## Netlify 環境変数（要設定）

Netlifyビルド時にSupabaseを使う場合:
- `VITE_SUPABASE_URL`: https://jvikgmqtzprwsxozulvx.supabase.co
- `VITE_SUPABASE_ANON_KEY`: Anon Key

## ビルド & 実行

```bash
npm install
npm run dev      # 開発サーバー
npm run build    # 本番ビルド → dist/
node scripts/update-data.mjs  # 手動データ更新
```

## 注意事項

- `tsconfig.app.json` の設定（verbatimModuleSyntax等）は変更しないこと
- TensorFlow.js のUIフリーズ対策（yieldToMain、エポック間yield）は必ず維持すること
- .env は gitignore 対象。Netlify環境変数で設定すること
- デプロイは git push で自動実行される
