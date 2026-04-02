# ロトアナライザー AI生成画像プロンプト集

全画像共通設定:
- **サイズ**: 1080x1920px（縦長・モバイルファースト）
- **形式**: WebP（200KB以下推奨）
- **スタイル**: 近未来 × 金運の融合

---

## 1. bg-main.webp（メイン背景）

```
A futuristic dark navy background with subtle golden circuit board patterns and floating gold particles. Deep space-like atmosphere with delicate gold and amber light traces forming abstract neural network connections. No text, no characters. Dark gradient from deep navy (#0a0e27) to dark purple (#1a1040). Scattered tiny golden dots like digital stardust. Seamless tileable pattern. 8K quality, digital art style.
```

**用途**: アプリ全体の固定背景
**ポイント**: 暗めで文字が読みやすいこと。金色は控えめに。シームレスだと理想的。

---

## 2. bg-fortune.webp（占いページ背景）

```
A mystical cosmic background blending purple nebula with golden sacred geometry patterns. Numerology symbols and constellation lines subtly overlaid. Deep purple (#1a0030) transitioning to midnight blue with gold accents. Ethereal golden light rays emanating from center. Ancient wisdom meets futuristic technology aesthetic. Crystal ball energy glow. No text, no characters. 8K quality, digital art.
```

**用途**: 占いページの背景
**ポイント**: 神秘的だが近未来感もある。紫〜金のグラデーション。

---

## 3. bg-prediction.webp（予測ページ背景）

```
A futuristic AI prediction interface background. Glowing neural network nodes connected by golden light beams on dark background. Holographic data visualization elements floating in space. Abstract machine learning visualization with gold and cyan accents on deep dark navy. Binary code rain subtle in background. No text, no UI elements, no characters. 8K quality, sci-fi digital art.
```

**用途**: 予測ページの背景
**ポイント**: AIが解析している感。ニューラルネットワーク風の光の線。

---

## 4. hero-ball.webp（ダッシュボード装飾）

```
A single luminous golden lottery ball floating in dark space, emitting warm golden light and sparkles. The ball has a subtle glass-like reflection and golden glow halo around it. Futuristic holographic rings orbiting around the ball. Dark background fading to transparent edges. Cinematic lighting, 3D render quality. No numbers on the ball, just pure golden sphere with light effects.
```

**用途**: ダッシュボードの最新結果セクションの装飾
**ポイント**: 正方形（1080x1080）でもOK。背景透過か暗い背景。

---

## 5. lucky-cat.webp（占いカード装飾）

```
A cyber-futuristic maneki-neko (Japanese lucky cat) with golden metallic body, glowing blue circuit pattern lines on its surface, and a holographic coin floating above its raised paw. Sitting on a sleek dark platform. Neon gold and cyan accents. Futuristic reimagining of traditional Japanese lucky cat statue. Dark background. 3D render, cinematic lighting, high detail.
```

**用途**: 占いカードの装飾画像
**ポイント**: 正方形（512x512〜1080x1080）。近未来的にアレンジされた招き猫。

---

## 画像配置後

生成した画像を以下のファイル名で `public/images/` に配置してください:

```
public/images/
├── bg-main.webp
├── bg-fortune.webp
├── bg-prediction.webp
├── hero-ball.webp
└── lucky-cat.webp
```

画像がなくてもアプリはCSS グラデーションのフォールバックで正常に動作します。
画像を配置すると自動的に背景が切り替わります。
