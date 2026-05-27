import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import type { Chapter } from '../types'
import { nanoid } from './nanoid'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_AI_API_KEY || "");

// Cấu hình Schema bắt buộc có thuộc tính LEVEL phục vụ căn lề giao diện
const fileChaptersSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    chapters: {
      type: SchemaType.ARRAY,
      description: "Danh sách mục lục phân cấp trích xuất từ tài liệu",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { 
            type: SchemaType.STRING, 
            description: "Tên chương kèm tiền tố phân cấp rõ ràng, ví dụ: 'Chương 2: Cấu trúc dữ liệu', '2.1. Khái niệm Cây', '2.1.1. Cây nhị phân tìm kiếm'" 
          },
          difficulty: { type: SchemaType.STRING, format: "enum", enum: ["low", "medium", "high"] },
          importance: { type: SchemaType.STRING, format: "enum", enum: ["low", "medium", "high"] },
          level: { 
            type: SchemaType.INTEGER, 
            description: "Cấp độ lồng nhau: 0 cho chương lớn gốc (2.), 1 cho chương con (2.1), 2 cho mục nhỏ hơn (2.1.1)" 
          }
        },
        required: ["name", "difficulty", "importance", "level"]
      }
    }
  },
  required: ["chapters"]
};

async function parseTextToChaptersWithAI(rawText: string): Promise<Chapter[]> {
  if (!rawText || rawText.trim().length < 10) return [];

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: fileChaptersSchema,
      },
    });

    const prompt = `
      Bạn là chuyên gia bóc tách cấu trúc giáo trình đại học. 
      Hãy phân tích văn bản mục lục thô từ tài liệu ôn thi dưới đây và chuyển hóa thành danh sách chương học phân cấp:

      TÀI LIỆU THÔ:
      \"\"\"
      ${rawText.slice(0, 50000)}
      \"\"\"

      QUY TẮC PHÂN CẤP QUAN TRỌNG:
      1. GIỮ NGUYÊN HOẶC TỰ SINH TIỀN TỐ SỐ ĐỂ THỂ HIỆN PHÂN CẤP (Ví dụ: 'Chương 2: ...', '2.1. ...', '2.1.1. ...') trong chuỗi 'name'.
      2. Xác định chính xác 'level': 
         - Nếu là tiêu đề lớn/Chương gốc $\rightarrow$ level = 0
         - Nếu là mục con thuộc chương lớn (dạng 2.1, 2.2) $\rightarrow$ level = 1
         - Nếu là mục cháu nhỏ hơn (dạng 2.1.1, 2.1.2) $\rightarrow$ level = 2
      3. Thẩm định độ khó (difficulty) và độ quan trọng (importance) thích hợp theo từ khóa kỹ thuật của từng mục.
    `;

    const result = await model.generateContent(prompt);
    const parsedJson = JSON.parse(result.response.text());

    if (parsedJson && Array.isArray(parsedJson.chapters)) {
      return parsedJson.chapters.map((c: any) => ({
        id: nanoid(),
        name: c.name.trim(),
        difficulty: c.difficulty,
        importance: c.importance,
        level: c.level ?? 0 // Kế thừa thuộc tính phân cấp tầng
      }));
    }
    return [];
  } catch (error) {
    console.error("Lỗi AI phân tích, chuyển về chế độ dự phòng:", error);
    return linesToChapters(rawText.split(/\n|\r/));
  }
}

function linesToChapters(lines: string[]): Chapter[] {
  return lines
    .filter((l) => l.trim().length > 1)
    .map((l) => ({ id: nanoid(), name: l.trim(), difficulty: 'medium', importance: 'medium', level: 0 }));
}

// === GIỮ NGUYÊN TẦNG TRÍCH XUẤT CHỮ THÔ BÊN DƯỚI ===
async function parsePDF(buffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    fullText += content.items.filter((item) => 'str' in item).map((item) => (item as { str: string }).str).join(' ') + '\n'
  }
  return fullText;
}

async function parseDOCX(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value;
}

export async function parseFileToChapters(file: File): Promise<Chapter[]> {
  const name = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()
  let extractedRawText = '';

  if (name.endsWith('.pdf')) {
    extractedRawText = await parsePDF(buffer);
  } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
    extractedRawText = await parseDOCX(buffer);
  } else if (name.endsWith('.json')) {
    const text = new TextDecoder('utf-8').decode(buffer);
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) return [];
      return data.map((item) => typeof item === 'string' 
        ? { id: nanoid(), name: item, difficulty: 'medium', importance: 'medium', level: 0 }
        : { id: nanoid(), name: item.name ?? String(item), difficulty: item.difficulty ?? 'medium', importance: item.importance ?? 'medium', level: item.level ?? 0 }
      );
    } catch { return []; }
  } else {
    extractedRawText = new TextDecoder('utf-8').decode(buffer);
  }
  return parseTextToChaptersWithAI(extractedRawText);
}
