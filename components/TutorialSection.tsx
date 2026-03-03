"use client";

import { useState } from "react";
import { FiPlay, FiKey, FiEdit3, FiImage, FiSettings, FiShare2, FiTarget, FiSmartphone } from "react-icons/fi";

export default function TutorialSection() {
    // true = solver (解く人), false = creator (作る人)
    const [isSolver, setIsSolver] = useState(true);

    return (
        <section className="px-6 py-20 max-w-5xl mx-auto w-full">
            <h2 className="font-[family-name:var(--font-orbitron)] text-2xl sm:text-3xl font-bold text-center neon-text-blue mb-8">
                TUTORIAL
            </h2>

            {/* Toggle Switch */}
            <div className="flex justify-center mb-12">
                <div className="bg-cyber-surface border border-cyber-border rounded-full p-1 flex relative w-64">
                    {/* Active Background */}
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full transition-transform duration-300 ease-in-out ${isSolver ? "translate-x-0 bg-neon-blue/20 border border-neon-blue/50" : "translate-x-full bg-neon-pink/20 border border-neon-pink/50 left-1"
                            }`}
                    />

                    <button
                        onClick={() => setIsSolver(true)}
                        className={`relative z-10 w-1/2 py-2 text-sm font-bold text-center transition-colors duration-300 ${isSolver ? "text-neon-blue" : "text-text-muted hover:text-text-secondary"
                            }`}
                    >
                        解く人（プレイヤー）
                    </button>
                    <button
                        onClick={() => setIsSolver(false)}
                        className={`relative z-10 w-1/2 py-2 text-sm font-bold text-center transition-colors duration-300 ${!isSolver ? "text-neon-pink" : "text-text-muted hover:text-text-secondary"
                            }`}
                    >
                        作る人（クリエイター）
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className={`transition-all duration-500 w-full`}>
                {isSolver ? <SolverTutorial /> : <CreatorTutorial />}
            </div>
        </section>
    );
}

function SolverTutorial() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TutorialStep
                num="1"
                icon={<FiPlay size={24} className="text-neon-blue" />}
                title="ワンタップで挑戦開始"
                description="アカウント登録やインストールは不要。リンクを開いてプレイヤー名を入力するだけで、すぐに謎解きをスタートできます。"
                color="blue"
            />
            <TutorialStep
                num="2"
                icon={<FiTarget size={24} className="text-neon-blue" />}
                title="勝利の栄光は「先着1名」のみ"
                description="最も早く正解した1名だけが勝者として名前を刻めます。他の人が先にクリアすると試合終了です。"
                color="blue"
            />
            <TutorialStep
                num="3"
                icon={<FiSmartphone size={24} className="text-neon-blue" />}
                title="2つの回答方式"
                description="キーワード方式：答えを直接テキストボックスに入力してください。QRコード方式：答えの示す場所にあるQRコードをスキャンしてください。"
                color="blue"
            />
            <TutorialStep
                num="4"
                icon={<FiShare2 size={24} className="text-neon-blue" />}
                title="勝者の特権（SNSシェア）"
                description="一番にクリアすると、特別な演出が表示され、1タップで勝利の証をX（旧Twitter）へシェアできます。"
                color="blue"
            />
        </div>
    );
}

function CreatorTutorial() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TutorialStep
                num="1"
                icon={<FiImage size={24} className="text-neon-pink" />}
                title="スマホ画像1枚でスピード作成"
                description="お手元の画像を1枚投稿するだけで、自動でサイズ最適化され、謎解きのベースがスピーディーに完成します。"
                color="pink"
            />
            <TutorialStep
                num="2"
                icon={<FiSettings size={24} className="text-neon-pink" />}
                title="充実のカスタマイズ"
                description="謎のタイトル、ヒントとなる概要テキスト、大まかな出題場所（例：〇〇駅前）を自由に設定して世界観を作り込めます。"
                color="pink"
            />
            <TutorialStep
                num="3"
                icon={<FiKey size={24} className="text-neon-pink" />}
                title="キーワード方式で作成"
                description="テキスト入力で回答させる方式です。ひらがなや漢字など、正解の表記揺れを最大10個まで柔軟に登録できます。"
                color="pink"
            />
            <TutorialStep
                num="3"
                icon={<FiTarget size={24} className="text-neon-pink" />}
                title="QRコード方式で作成"
                description="カメラでスキャンして回答させる方式です。謎作成後に専用のQRコード画像をダウンロードし、現実世界の「答えが示す場所」に設置することで、本格的な宝探しイベントが開催可能です！"
                color="pink"
            />
            <TutorialStep
                num="4"
                icon={<FiShare2 size={24} className="text-neon-pink" />}
                title="作成直後のシームレスなシェア"
                description="謎の完成と同時に専用URLと画像が発行され、すぐにXなどのSNSへ挑戦状を叩きつけることができます。"
                color="pink"
            />
        </div>
    );
}

function TutorialStep({
    num,
    icon,
    title,
    description,
    color
}: {
    num: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    color: "blue" | "pink";
}) {
    const colorStyles = color === "blue"
        ? "border-neon-blue/20 hover:border-neon-blue hover:shadow-[0_0_15px_rgba(0,240,255,0.15)] text-neon-blue"
        : "border-neon-pink/20 hover:border-neon-pink hover:shadow-[0_0_15px_rgba(255,0,229,0.15)] text-neon-pink";

    const bgGlow = color === "blue"
        ? "bg-neon-blue/10"
        : "bg-neon-pink/10";

    return (
        <div className={`cyber-card flex gap-4 p-6 transition-all duration-300 border ${colorStyles.split(' ')[0]} hover:${colorStyles.split(' ')[1]} hover:${colorStyles.split(' ')[2]}`}>
            <div className={`flex flex-col items-center justify-start flex-shrink-0 pt-1`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border ${colorStyles.split(' ').pop()} ${bgGlow} shadow-[0_0_10px_currentColor]`}>
                    {num}
                </div>
                <div className="mt-4 flex-1 w-px bg-cyber-border opacity-50" />
            </div>
            <div>
                <div className="flex items-center gap-2 mb-2">
                    {icon}
                    <h3 className="font-[family-name:var(--font-orbitron)] font-bold text-lg text-text-primary">{title}</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}
