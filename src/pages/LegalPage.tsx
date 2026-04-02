import { useState } from 'react';
import GlassCard from '../components/GlassCard';

type Tab = 'privacy' | 'terms' | 'disclaimer';

const tabs: { id: Tab; label: string }[] = [
  { id: 'privacy', label: 'プライバシーポリシー' },
  { id: 'terms', label: '利用規約' },
  { id: 'disclaimer', label: '免責事項' },
];

export default function LegalPage() {
  const [tab, setTab] = useState<Tab>('privacy');

  return (
    <div className="space-y-4">
      <GlassCard className="p-1.5">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-3 rounded-md text-sm font-bold transition-colors text-center min-h-[44px] ${
                tab === t.id
                  ? 'bg-accent text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        {tab === 'privacy' && <PrivacyPolicy />}
        {tab === 'terms' && <TermsOfService />}
        {tab === 'disclaimer' && <DisclaimerDetail />}
      </GlassCard>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-text-primary mt-6 mb-2">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-base text-text-secondary leading-relaxed mb-3">{children}</p>;
}

function PrivacyPolicy() {
  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-4">プライバシーポリシー</h2>
      <P>ロトアナライザー運営（以下「当運営」）は、本サービス「ロトアナライザー」におけるユーザーのプライバシーを尊重し、個人情報の保護に努めます。</P>
      <P>最終更新日: 2026年3月22日</P>

      <SectionTitle>1. 収集する情報</SectionTitle>
      <P>本サービスは、以下の情報を取り扱います。</P>
      <P><strong>生年月日情報:</strong> 占い機能で入力された生年月日は、お使いのブラウザのlocalStorage（端末内）にのみ保存されます。当運営のサーバーには一切送信されません。</P>
      <P><strong>予測履歴:</strong> 予測結果の履歴もlocalStorageにのみ保存され、サーバーには送信されません。</P>
      <P><strong>テーマ設定:</strong> ダーク/ライトモードの設定はlocalStorageに保存されます。</P>

      <SectionTitle>2. Cookie（クッキー）について</SectionTitle>
      <P>本サービスでは、広告配信のためにCookieを使用しています。</P>
      <P><strong>Google AdSense:</strong> 本サービスは、Google AdSenseを利用して広告を配信しています。Googleは、ユーザーの興味に基づいた広告を表示するためにCookieを使用することがあります。Googleによるデータの取扱いについては、<a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Googleの広告ポリシー</a>をご確認ください。</P>
      <P>ユーザーは、<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Googleの広告設定ページ</a>で、パーソナライズ広告を無効にすることができます。</P>

      <SectionTitle>3. アクセス解析ツール</SectionTitle>
      <P>本サービスでは、サービス改善のためにアクセス解析ツールを導入する場合があります。これらのツールはCookieを使用してトラフィックデータを収集しますが、個人を特定する情報は含まれません。</P>

      <SectionTitle>4. データの保存場所</SectionTitle>
      <P>本サービスで入力・生成されるデータは、すべてユーザーのブラウザ内（localStorage）に保存されます。当運営はユーザーの個人データを保有するサーバーを持っていません。</P>
      <P>ロトの抽選結果データは、外部サイト（thekyo.jp）から取得しており、当運営が独自に保有するものではありません。</P>

      <SectionTitle>5. 第三者提供</SectionTitle>
      <P>当運営は、法令に基づく場合を除き、ユーザーの個人情報を第三者に提供することはありません。</P>

      <SectionTitle>6. お問い合わせ</SectionTitle>
      <P>プライバシーポリシーに関するお問い合わせは、以下までご連絡ください。</P>
      <P>メール: <a href="mailto:loto.analyzer@gmail.com" className="text-accent hover:underline">loto.analyzer@gmail.com</a></P>

      <SectionTitle>7. 改定</SectionTitle>
      <P>当運営は、必要に応じて本ポリシーを改定することがあります。改定後のポリシーは、本ページに掲載した時点で効力を生じるものとします。</P>
    </div>
  );
}

function TermsOfService() {
  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-4">利用規約</h2>
      <P>本規約は、ロトアナライザー運営（以下「当運営」）が提供するWebアプリ「ロトアナライザー」（以下「本サービス」）の利用条件を定めるものです。</P>

      <SectionTitle>1. サービスの性質</SectionTitle>
      <P>本サービスは、ロト6・ロト7・ミニロトの過去の抽選結果を統計分析し、予測番号を生成するエンターテインメントツールです。</P>
      <P>本サービスは宝くじの当選を保証するものではなく、いかなる投資助言も行いません。</P>

      <SectionTitle>2. 利用料金</SectionTitle>
      <P>本サービスは無料でご利用いただけます。ただし、広告が表示される場合があります。</P>

      <SectionTitle>3. 免責</SectionTitle>
      <P>当運営は、本サービスの利用により生じたいかなる損害（宝くじの購入に関する損失を含む）についても、一切の責任を負いません。</P>
      <P>本サービスで提供される予測・分析・占いの結果に基づく宝くじの購入は、すべてユーザーご自身の判断と責任において行ってください。</P>

      <SectionTitle>4. 禁止事項</SectionTitle>
      <P>本サービスの利用にあたり、以下の行為を禁止します。</P>
      <ul className="list-disc list-inside text-text-secondary space-y-1 mb-3">
        <li>本サービスの内容を無断で複製・転載する行為</li>
        <li>本サービスの運営を妨害する行為</li>
        <li>本サービスを商用目的で利用する行為（個人の宝くじ購入の参考は除く）</li>
        <li>その他、当運営が不適切と判断する行為</li>
      </ul>

      <SectionTitle>5. サービスの変更・終了</SectionTitle>
      <P>当運営は、事前の通知なく本サービスの内容を変更、または提供を終了する場合があります。これによりユーザーに生じた損害について、当運営は一切の責任を負いません。</P>

      <SectionTitle>6. 準拠法・管轄</SectionTitle>
      <P>本規約の解釈にあたっては、日本法を準拠法とします。</P>

      <SectionTitle>7. 改定</SectionTitle>
      <P>当運営は、必要に応じて本規約を改定することがあります。改定後の規約は、本ページに掲載した時点で効力を生じるものとします。</P>
    </div>
  );
}

function DisclaimerDetail() {
  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-4">免責事項</h2>

      <SectionTitle>1. 抽選結果の性質について</SectionTitle>
      <P>ロト6・ロト7・ミニロトの抽選は、完全にランダムな方法で行われます。過去の抽選結果は将来の結果に一切影響を与えません。これは数学的・統計学的に証明された事実です。</P>

      <SectionTitle>2. 統計分析について</SectionTitle>
      <P>本サービスの統計分析（出現頻度、ギャップ分析、ペア相関など）は、過去のデータの傾向を可視化するものであり、将来の当選番号を予測する能力を持つものではありません。</P>

      <SectionTitle>3. AI予測について</SectionTitle>
      <P>本サービスのAI予測は、LSTM（Long Short-Term Memory）ニューラルネットワークを使用していますが、ランダムな抽選結果に対して機械学習が有効であることを示す科学的根拠はありません。AI予測はエンターテインメント機能としてご利用ください。</P>

      <SectionTitle>4. 占い機能について</SectionTitle>
      <P>本サービスの占い機能は、数秘術（ヌメロロジー）および六曜に基づくものです。これらは科学的に証明された方法ではなく、エンターテインメントとしてお楽しみいただくものです。</P>

      <SectionTitle>5. データの正確性</SectionTitle>
      <P>本サービスで使用する抽選結果データは、外部サイト（thekyo.jp）から取得しています。データの正確性・完全性・最新性について、当運営は保証しません。最新の公式結果は、みずほ銀行の宝くじ公式サイトでご確認ください。</P>

      <SectionTitle>6. 損害の免責</SectionTitle>
      <P>本サービスの利用（予測番号に基づく宝くじの購入を含む）により生じた、直接的・間接的を問わないいかなる損害についても、当運営は一切の責任を負いません。宝くじの購入は、余裕のある資金の範囲内で、ご自身の判断と責任のもとに行ってください。</P>

      <SectionTitle>7. 推奨される利用方法</SectionTitle>
      <P>本サービスは、宝くじ購入の楽しみを広げるためのエンターテインメントツールとしてご利用ください。宝くじは「夢を買う」ものであり、投資手段ではありません。計画的な購入をお勧めします。</P>
    </div>
  );
}
