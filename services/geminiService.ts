import { GoogleGenAI } from "@google/genai";
import { LinkItem } from "../types";

export const analyzeLink = async (url: string): Promise<Partial<LinkItem>> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found");
    return { title: '未命名', description: '缺少 API Key' };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Updated prompt for Chinese context
  const prompt = `
    我有一个网址: ${url}.
    请帮我生成一个简短的中文标题 (Title, 最多10个汉字), 一个精炼的中文描述 (Description, 最多20个汉字), 并推荐一个来自 Lucide React 库的图标名称 (icon, 例如 Github, Mail, Globe, Zap, Code, BookOpen 等).
    请直接返回纯 JSON 格式，包含 keys: "title", "description", "icon".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return { title: '错误', description: 'AI 无响应' };

    const data = JSON.parse(text);
    return {
      title: data.title || '新链接',
      description: data.description || '暂无描述',
      icon: data.icon || 'Globe'
    };

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      title: '新链接',
      description: '无法自动获取信息',
      icon: 'Link'
    };
  }
};