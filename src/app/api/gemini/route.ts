import { GoogleGenerativeAI } from '@google/generative-ai';

// VercelのEdge Runtimeで動作するように設定
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { word, mode, context, question } = await req.json();

    if (!mode) {
      return new Response("Invalid request: 'mode' is required.", { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    
    let modelName: string = 'gemini-2.5-flash';
    let prompt: string;

    switch (mode) {
      case 'quick':
        modelName = 'gemini-2.5-flash-lite';
        prompt = `英単語「${word}」の最も重要な日本語の意味を、3つまで箇条書き（「・」で始める）で出力してください。解説は不要です。`;
        break;
      case 'deep_dive':
        prompt = `あなたはプロの言語学者です。英単語「${word}」について、以下の形式で厳密に解説してください。\n\n### 主な意味\n(重要な意味を箇条書きで3つまで)\n\n---\n\n### 例文\n(異なる文脈の例文を3つ、箇条書き「- 」で提示し、各例文の後に()で日本語訳を併記)\n\n---\n\n### AIによる解説\n(単語の核心イメージ、ニュアンス、類義語との違いを分かりやすく解説)`;
        break;
      case 'explain_further':
        prompt = `あなたは教えるのが上手い家庭教師です。以下の単語と解説を、より初心者がイメージしやすいように、具体的な例え話や違う角度からの説明を加えて、さらに分かりやすく説明しなおしてください。\n\n# 英単語:\n${word}\n\n# 解説の文脈:\n${context}`;
        break;
      case 'custom_question':
        modelName = 'gemini-2.5-pro';
        prompt = `あなたは英単語「${word}」についての質問に答える専門家です。以下の解説文脈と質問を踏まえ、学習者に分かりやすく回答してください。\n\n# 解説の文脈:\n${context}\n\n# 質問:\n${question}\n\n# 回答:`;
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