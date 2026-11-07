import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { word, mode, context, question } = await req.json();
    if (!mode) return new Response("Invalid request", { status: 400 });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    // ユーザー指定の Gemini 3.8 Flash（環境変数 GEMINI_MODEL での上書きも対応）
    const defaultModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    let modelName: string = defaultModel;
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

    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of result.stream) {
          controller.enqueue(encoder.encode(chunk.text()));
        }
        controller.close();
      },
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' }});
  } catch (error) {
    console.error("[API Error]", error);
    return new Response("An internal server error occurred.", { status: 500 });
  }
}
