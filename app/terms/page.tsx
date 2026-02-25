export const metadata = {
    title: "利用規約 | TakaraWalk",
    description: "TakaraWalkの利用規約",
};

export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-bold neon-text-blue mb-2 text-center">
                利用規約
            </h1>
            <p className="text-text-muted text-center text-sm mb-10">施行日：2026年2月24日</p>

            <div className="cyber-card p-8 space-y-8 text-text-secondary leading-relaxed">
                <p>
                    この利用規約（以下、「本規約」といいます）は、「TakaraWalk」（以下、「本サービス」といいます）の利用条件を定めるものです。本サービスを利用するすべてのユーザー（問題作成者および回答者を含み、以下、「ユーザー」といいます）には、本規約に従って本サービスをご利用いただきます。
                </p>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第1条（適用）
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>本規約は、ユーザーと本サービス運営者（以下、「運営者」といいます）との間の、本サービスの利用に関わる一切の関係に適用されるものとします。</li>
                        <li>ユーザーは、本サービスを利用することにより、本規約に同意したものとみなされます。</li>
                    </ol>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第2条（ユーザー登録とアカウント管理）
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>問題作成にあたりユーザー登録（SNSログイン等）を行ったユーザーは、自己の責任においてアカウント情報を適切に管理するものとします。</li>
                        <li>運営者は、アカウントを利用して行われた一切の行為を、当該アカウントを保有するユーザー本人の行為とみなします。</li>
                    </ol>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第3条（禁止事項）
                    </h2>
                    <p className="text-sm mb-3">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>法令または公序良俗に違反する行為</li>
                        <li>犯罪行為に関連する行為</li>
                        <li>運営者、他のユーザー、または第三者の著作権、商標権、プライバシー、肖像権その他の権利を侵害する行為（無断での画像アップロード等）</li>
                        <li>わいせつ、暴力的な画像やテキストを投稿・送信する行為</li>
                        <li>本サービスのネットワークまたはシステム等に過度な負荷をかける行為</li>
                        <li>プログラム、スクリプト、ボット等を用いて、自動的に問題を回答する、またはシステムを不正に操作・攻撃する行為</li>
                        <li>本サービスの運営を妨害するおそれのある行為</li>
                        <li>その他、運営者が不適切と判断する行為</li>
                    </ol>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第4条（コンテンツの取り扱い）
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>ユーザーが本サービスにアップロードした画像やテキスト（以下、「コンテンツ」といいます）の著作権は、当該ユーザーまたは正当な権利者に留保されます。</li>
                        <li>ユーザーは、運営者に対し、本サービスの提供、維持、改善およびプロモーションに必要な範囲において、コンテンツを利用（複製、公開、送信等）する権利を無償で許諾するものとします。</li>
                        <li>運営者は、本規約に違反するコンテンツ、または不適切と判断したコンテンツを、事前の通知なく削除することができます。</li>
                    </ol>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第5条（サービスの提供の停止等）
                    </h2>
                    <p className="text-sm mb-3">運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                        <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                        <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                        <li>その他、運営者が本サービスの提供が困難と判断した場合</li>
                    </ol>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第6条（免責事項）
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>運営者は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを明示的にも黙示的にも保証しておりません。</li>
                        <li>運営者は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。</li>
                        <li>本サービスを利用してユーザー同士または第三者との間で生じたトラブル（画像の無断使用等）について、運営者は一切責任を負わず、当事者間で解決するものとします。</li>
                    </ol>
                </section>

                <section>
                    <h2 className="font-bold text-text-primary text-lg mb-3 border-b border-cyber-border pb-2">
                        第7条（利用規約の変更）
                    </h2>
                    <p className="text-sm">
                        運営者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
                    </p>
                </section>
            </div>
        </div>
    );
}
