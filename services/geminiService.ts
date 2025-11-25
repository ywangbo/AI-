import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

const SYSTEM_INSTRUCTION = `
你是一个名为 "幻境终端" (Phantom Terminal) 的1988年复古文字冒险游戏引擎。
你的目标是为用户运行一个沉浸式的、交互式的小说游戏。

规则：
1. 语言：必须全程使用**中文**。
2. 基调：氛围感强，描述生动但简洁（类似 Zork 或早期的 MUD 游戏）。
3. 格式：纯文本。不要使用 Markdown 格式（如 **加粗** 或 # 标题）。如果需要强调，可以使用【】或大写。
4. 机制：你需要隐式地追踪玩家的【生命值】（初始 100%）、【物品栏】和【位置】。
5. 交互：在每段描述的最后，提示用户 "你会怎么做？" 或给出具体的选项。
6. 首次互动：在游戏开始时，请让用户选择游戏题材："奇幻"、"科幻"、"赛博朋克" 或 "悬疑"。
7. 状态查询：如果用户询问 "物品" 或 "状态"，请以复古的列表格式显示他们的状态。

示例输出：
你站在一条潮湿、昏暗的走廊里。水珠从头顶生锈的管道中滴落。
北面是一扇沉重的钢门。南面是一片漆黑。
你会怎么做？
`;

export const initializeGemini = (): void => {
  try {
    // Safely check for process.env to avoid ReferenceError in browser environments
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
    
    if (apiKey) {
      genAI = new GoogleGenAI({ apiKey });
    } else {
      console.error("API_KEY is missing. Check your environment configuration.");
    }
  } catch (e) {
    console.error("Failed to initialize Gemini client:", e);
  }
};

export const startNewGame = async (): Promise<string> => {
  if (!genAI) initializeGemini();
  if (!genAI) return "错误：系统未连接 (API Key missing)。";

  chatSession = genAI.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7, // Creative but somewhat deterministic
      maxOutputTokens: 500,
    },
  });

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: "初始化系统。启动序列完成。请用中文开始游戏介绍，欢迎玩家来到【幻境终端】，并询问玩家想要游玩哪种题材（奇幻、科幻等）。"
    });
    return response.text || "系统错误：无数据返回";
  } catch (error) {
    console.error("Error starting game:", error);
    return "严重错误：主机连接失败。";
  }
};

export const sendPlayerAction = async function* (action: string): AsyncGenerator<string, void, unknown> {
  if (!chatSession) {
    yield "系统错误：无活动会话。";
    return;
  }

  try {
    const streamResult = await chatSession.sendMessageStream({ message: action });
    
    for await (const chunk of streamResult) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Stream error:", error);
    yield "\n[连接中断]";
  }
};

// Generates a pixel art representation of the current context
export const generatePixelArtScene = async (contextText: string): Promise<string | null> => {
  if (!genAI) initializeGemini();
  if (!genAI) return null;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image', // Using flash-image for efficient generation
      contents: {
        parts: [{
          text: `Create a retro 8-bit pixel art scene based on this description (Note: description is in Chinese): "${contextText}". 
          Style: 1990s adventure game, limited color palette, dithering, low resolution aesthetic. 
          Do not include text in the image. Return only the image.`
        }]
      },
      config: {
         // flash-image doesn't support aspect ratio configs in generateContent often, 
         // but we ask for pixel art style via prompt.
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Failed to generate scene image:", e);
    return null;
  }
};