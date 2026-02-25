export const metadata = {
    title: "プライバシーポリシー | TakaraWalk",
    description: "TakaraWalkのプライバシーポリシー",
};

export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-bold neon-text-pink mb-2 text-center">
                プライバシーポリシー
            </h1>
            <p className="text-text-muted text-center text-sm mb-10">施行日：2026年2月24日</p>

            <div className="cyber-card p-8 space-y-8 text-text-secondary leading-relaxed">
                <p>
                    「TakaraWalk」運営者（以下、「運営者」といいます）は、本サービスにおけるユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます）を定めます。
                </p>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第1条（収集する情報）
                    </h2>
                    <p className="text-sm mb-3">運営者は、本サービスの提供にあたり、以下の情報を収集する場合があります。</p>
                    <ol className="list-decimal list-inside space-y-3 text-sm">
                        <li>
                            <span className="font-bold text-text-primary">問題作成者（ログインユーザー）に関する情報：</span>
                            <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-text-muted">
                                <li>認証プロバイダ（Google等）から提供される識別情報（UID）、メールアドレス、表示名、アイコン画像等</li>
                                <li>本サービス上で作成・アップロードした問題データ（画像、タイトル、回答等）</li>
                            </ul>
                        </li>
                        <li>
                            <span className="font-bold text-text-primary">すべてのユーザー（回答者を含む）に関する情報：</span>
                            <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-text-muted">
                                <li>端末情報、ブラウザ情報、IPアドレス、アクセスログ</li>
                                <li>謎解きの回答状況やクリアタイム等の利用履歴</li>
                            </ul>
                        </li>
                    </ol>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第2条（利用目的）
                    </h2>
                    <p className="text-sm mb-3">収集した情報の利用目的は、以下のとおりです。</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>本サービスの提供・運営（問題の公開、先着1名の判定等のため）</li>
                        <li>ユーザーからのお問い合わせに回答するため</li>
                        <li>不正利用（ボットによる自動回答や、利用規約に違反する行為）の検知・防止、および対策を行うため</li>
                        <li>本サービスの利用状況を分析し、システムの改善や新機能の開発に役立てるため</li>
                        <li>上記の利用目的に付随する目的</li>
                    </ol>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第3条（第三者提供）
                    </h2>
                    <p className="text-sm mb-3">運営者は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                        <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                        <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
                        <li>データ保存やシステム運用のため、外部のクラウドサービス（Google Firebase, Vercel等）を利用する場合（※これらのサービスは独自のプライバシーポリシーに基づいて適切にデータを管理しています）</li>
                    </ol>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第4条（Cookieおよびローカルストレージの利用）
                    </h2>
                    <p className="text-sm">
                        本サービスでは、ログイン状態の維持やボット対策（不正アクセス防止）などのために、Cookieまたはブラウザのローカルストレージを利用する場合があります。ユーザーはブラウザの設定によりこれらを無効にすることができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。
                    </p>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第5条（個人情報の開示・訂正・削除）
                    </h2>
                    <p className="text-sm">
                        ユーザーは、自身の個人情報（問題データやアカウント情報）について、本サービスの機能を通じて確認、変更、削除を行うことができます。また、アカウントの完全な削除を希望する場合は、運営者への申し出またはアプリ内の退会機能により対応します。
                    </p>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第6条（プライバシーポリシーの変更）
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。</li>
                        <li>運営者が別途定める場合を除いて、変更後のプライバシーポリシーは、本サービス上に掲載したときから効力を生じるものとします。</li>
                    </ol>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第7条（お問い合わせ窓口）
                    </h2>
                    <p className="text-sm">
                        本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。
                    </p>
                    <p className="text-sm mt-2">
                        連絡先：<a href="https://x.com/TakaraWalk" target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline">@TakaraWalk</a>
                    </p>
                </section>
            </div>
        </div>
    );
}
