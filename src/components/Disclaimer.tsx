import { GameConfig } from '../lib/types';

interface Props {
  config: GameConfig;
}

export default function Disclaimer({ config }: Props) {
  return (
    <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg px-4 py-2 text-xs text-amber-300/80">
      <span className="font-semibold">⚠ 免責事項:</span>{' '}
      {config.name}の抽選は完全にランダムです。本アプリの分析・予測は娯楽目的であり、当選を保証するものではありません。
    </div>
  );
}
