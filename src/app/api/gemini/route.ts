import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { word, mode, context, question } = await req.json();
    if (!mode) return new Response("Invalid request", { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[API Error] GEMINI_API_KEY is not set.");
      return new Response("GEMINI_API_KEYが設定されていません。Vercelの環境変数を確認してください。", { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let prompt: string;

    switch (mode) {
      case 'quick_en-ja':
        prompt = `英単語「${word}」について、以下の形式で最も重要かつ自然な日本語の意味を3つまで簡潔に出力してください。余計な前置きや長い解説は不要です。
・意味1
・意味2
・意味3`;
        break;
      case 'deep_dive_en-ja':
        prompt = `あなたは一流の英語教育専門家かつ言語学者です。英単語「${word}」について、学習者が深く記憶に定着できるように以下の形式で分かりやすく解説してください。

### 発音と品詞
- **発音記号 (IPA)**: [発音記号]
- **品詞**: [主要な品詞]
- **難易度目安**: [CEFRレベル (例: B1/B2/C1など)]

---

### 主な意味
(重要度の高い順に2〜3個、日本語訳を提示)

---

### 例文 (ネイティブの自然な文脈)
- [英語の例文1] (日本語訳)
- [英語の例文2] (日本語訳)
- [英語の例文3] (日本語訳)

---

### 核心のイメージと語源
(この単語の核となるコアイメージや語源の解説。なぜその意味になるのかが直感的にイメージできるように)

---

### ニュアンス・類義語との使い分け
(よくある似た単語とのニュアンスの差異や、使用時の注意点)`;
        break;
        
      case 'quick_ja-en':
        prompt = `以下の日本語フレーズを、最も一般的で自然なネイティブ英語にしてください。解説は不要で、最も適切な英訳のみを1行で出力してください。\n\n日本語: ${word}`;
        break;
      case 'deep_dive_ja-en':
        prompt = `あなたは日英バイリンガルの翻訳・英語教育の専門家です。以下の日本語フレーズ「${word}」について、自然な英語表現と使い分けを以下の形式で解説してください。

### 最も自然な英訳
**[メインの英訳表現]**

---

### シチュエーション別の言い換え
- **カジュアル**: [日常会話・友人向け表現]
- **ビジネス・丁寧**: [職場・フォーマルな表現]

---

### 翻訳のポイントと重要単語
(単語のニュアンス、直訳では伝わりにくいニュアンスの解説、一緒に使えるコロケーション)`;
        break;

      case 'explain_further':
        prompt = `あなたは親しみやすく教え上手な家庭教師です。以下の単語/フレーズ「${word}」と解説について、小学生や初学者でもパッとイメージが湧くように、日常的な「例え話」や「具体的なシチュエーション」を交えて、さらに分かりやすく説明してください。\n\n# 単語/フレーズ:\n${word}\n\n# 解説の文脈:\n${context}`;
        break;
      case 'custom_question':
        prompt = `あなたは「${word}」という英語/日本語学習に関する質問に答えるプロフェッショナルです。以下の解説文脈と質問を踏まえ、わかりやすく丁寧に回答してください。\n\n# 単語/フレーズ:\n${word}\n\n# 前提文脈:\n${context}\n\n# 質問:\n${question}\n\n# 回答:`;
        break;
      default:
        return new Response(`Error: Invalid mode "${mode}"`, { status: 400 });
    }

    // ユーザー指定のハイブリッド構成:
    // ⚡ 簡易検索: 日常的に高頻度で使うため 1日500回枠の Gemini 3.5 Flash Lite でサクサク即答
    // 🎓 詳細解説 & AI質問: 最高峰の知能を持つ Gemini 3.8 Flash で濃厚な解説を出力
    const isQuickMode = mode.startsWith('quick');
    const candidateModels = isQuickMode
      ? [
          process.env.GEMINI_QUICK_MODEL || 'gemini-3.5-flash-lite',
          'gemini-3.1-flash-lite',
          'gemini-2.5-flash-lite',
          'gemini-3.8-flash',
          'gemini-2.5-flash',
        ]
      : [
          process.env.GEMINI_DEEP_MODEL || 'gemini-3.8-flash',
          'gemini-3.6-flash',
          'gemini-3.5-flash-lite',
          'gemini-2.5-flash',
          'gemini-3.1-flash-lite',
        ];

    // 重複を削除
    const uniqueCandidates = candidateModels.filter((m, i, arr) => arr.indexOf(m) === i);

    let lastError: any = null;
    let streamResult: any = null;
    let firstChunkText = '';
    let usedModel = uniqueCandidates[0];

    // 503過負荷エラーを完全に撃退する多段リトライ＆フォールバック実行
    for (const modelName of uniqueCandidates) {
      // 503過負荷の際は1回リトライ（一時的混雑解消を待つ）
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Gemini API] Requesting ${modelName} (attempt ${attempt}/${2}) for mode: ${mode}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContentStream(prompt);

          // ★重要：ストリームの初回の chunk を実際に受信して 503 / 404 / 429 などのエラーがないかを先行検証
          const iterator = result.stream[Symbol.asyncIterator]();
          const firstChunk = await iterator.next();

          if (firstChunk.done) {
            throw new Error(`Empty response returned from ${modelName}`);
          }

          firstChunkText = firstChunk.value.text();
          usedModel = modelName;

          // 成功！残りのストリームを配信する ReadableStream を構築
          const stream = new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();
              try {
                // 初回チャンクを送出
                controller.enqueue(encoder.encode(firstChunkText));

                // 2回目以降のチャンクを順次送出
                while (true) {
                  const { done, value } = await iterator.next();
                  if (done) break;
                  controller.enqueue(encoder.encode(value.text()));
                }
              } catch (readErr) {
                console.error("[Stream read error]", readErr);
              } finally {
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'X-Used-Model': usedModel,
            },
          });
        } catch (err: any) {
          lastError = err;
          const status = err?.status || (err?.message?.includes("503") ? 503 : null);
          console.warn(`[Gemini API] ${modelName} attempt ${attempt} failed:`, err?.message || err);

          // 503 Service Unavailable（Googleサーバー過負荷）の場合は1秒待って再試行
          if ((status === 503 || err?.message?.includes("503") || err?.message?.includes("overloaded")) && attempt < 2) {
            console.log(`[Gemini API] Retrying ${modelName} in 1200ms...`);
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }

          // それ以外の失敗や2回目失敗は次の候補モデルへ即座にフェイルオーバー
          break;
        }
      }
    }

    // すべてのモデルが失敗した場合のエラーハンドリング
    console.error("[Gemini API] All candidate models failed. Last error:", lastError);
    const errorStatus = lastError?.status || 500;
    const errorMsg = errorStatus === 503
      ? "Google AIのサーバーが混雑しています（503 Service Unavailable）。1〜2秒後にもう一度検索してください。"
      : "AI解説の生成中にエラーが発生しました。しばらく待ってから再度お試しください。";

    return new Response(errorMsg, { status: errorStatus });
  } catch (error: any) {
    console.error("[API Unhandled Error]", error);
    return new Response("サーバー内部エラーが発生しました。", { status: 500 });
  }
}
