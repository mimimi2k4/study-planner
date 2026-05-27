// src/utils/aiAnalyzer.ts
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import type { Syllabus, StudyTask, DifficultyLevel } from '../types';
import { nanoid } from '../utils/nanoid';

// Khởi tạo Gemini Client kết nối bằng API Key từ môi trường Vite của bạn
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_AI_API_KEY || "");

const geminiResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    tasks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          chapterName: { type: SchemaType.STRING },
          subjectId: { type: SchemaType.STRING },
          estimatedMinutes: { type: SchemaType.INTEGER },
          priority: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["low", "medium", "high"],
          },
        },
        required: ["name", "chapterName", "subjectId", "estimatedMinutes", "priority"],
      },
    },
  },
  required: ["tasks"],
};

/**
 * ⚡ CHỨC NĂNG MỚI: Gọi Gemini AI chia nhỏ chương dựa thuần túy vào độ khó và độ quan trọng
 */
export async function analyzeAndGenerateTasksWithAI(
  syllabuses: Syllabus[],
  examSubjectMap: Record<string, string>
): Promise<StudyTask[]> {
  try {
    if (!syllabuses || syllabuses.length === 0) return [];

    // Tinh giản dữ liệu truyền đi để tiết kiệm Token và tăng độ chính xác phản hồi
    const cleanInput = syllabuses.map(s => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      chapters: s.chapters.map(c => ({
        name: c.name,
        difficulty: c.difficulty, // 'low' | 'medium' | 'high'
        importance: c.importance  // 'low' | 'medium' | 'high'
      }))
    }));

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: geminiResponseSchema,
      },
    });

    const prompt = `
      Bạn là một trợ lý AI thông minh phụ trách thiết lập lộ trình ôn thi.
      Nhiệm vụ của bạn là đọc danh sách đề cương môn học và thực hiện BẺ NHỎ (breakdown) các chương lớn thành các nhiệm vụ ôn tập cụ thể (atomic tasks) hợp lý hơn.

      DANH SÁCH ĐỀ CƯƠNG ĐẦU VÀO:
      ${JSON.stringify(cleanInput, null, 2)}

      QUY TẮC PHÂN TÁCH:
      1. Với mỗi chương học, dựa vào ý nghĩa tên chương, độ khó (difficulty) và mức độ quan trọng (importance), hãy bẻ nhỏ nó thành từ 1 đến 3 nhiệm vụ ôn tập nhỏ, có tiêu đề hành động rõ ràng (Ví dụ chương "Cấu trúc dữ liệu Cây" -> Tách nhỏ thành: "Học lý thuyết Cây nhị phân", "Thực hành thuật toán Duyệt cây").
      2. Xác định mức độ ưu tiên 'priority' ('low' | 'medium' | 'high') cho từng nhiệm vụ con dựa vào sự kết hợp giữa độ khó và độ quan trọng của chương gốc.
      3. Hãy giữ nguyên chính xác chuỗi 'chapterName' và mã 'subjectId' của chương gốc để hệ thống đối chiếu dữ liệu.
    `;

    const result = await model.generateContent(prompt);
    const parsedJson = JSON.parse(result.response.text());
    const finalTasks: StudyTask[] = [];

    if (parsedJson && Array.isArray(parsedJson.tasks)) {
      for (const aiTask of parsedJson.tasks) {
        const color = examSubjectMap[aiTask.subjectId] ?? "#4f46e5";
        const subjectName = syllabuses.find(s => s.subjectId === aiTask.subjectId)?.subjectName || "";

        finalTasks.push({
          id: nanoid(), // Sinh ID ngẫu nhiên không trùng lặp cho React render
          name: aiTask.name,
          chapter: aiTask.chapterName,
          subjectId: aiTask.subjectId,
          subjectName: subjectName,
          estimatedMinutes: aiTask.estimatedMinutes || 60,
          priority: aiTask.priority as DifficultyLevel,
          status: 'pending', // Mặc định ban đầu là chưa hoàn thành
          color: color,
        });
      }
    }

    // Sắp xếp thứ tự: Ưu tiên cao (high) học trước, thấp (low) học sau
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return finalTasks.sort((a, b) => order[a.priority] - order[b.priority]);

  } catch (error) {
    console.error("Lỗi khi gọi Gemini AI phân tách chương:", error);
    // Phương án dự phòng (Fallback): Nếu API lỗi hoặc mất mạng, tự động dùng thuật toán ma trận cũ để app không bị sập
    return analyzeAndGenerateTasks(syllabuses, examSubjectMap);
  }
}


const MINUTES_BY_DIFFICULTY: Record<DifficultyLevel, number> = { low: 40, medium: 70, high: 110 };
const PRIORITY_MATRIX: Record<string, DifficultyLevel> = {
  'high-high': 'high', 'high-medium': 'high', 'high-low': 'medium',
  'medium-high': 'high', 'medium-medium': 'medium', 'medium-low': 'low',
  'low-high': 'medium', 'low-medium': 'low', 'low-low': 'low',
};

export function analyzeAndGenerateTasks(syllabuses: Syllabus[], examSubjectMap: Record<string, string>): StudyTask[] {
  const tasks: StudyTask[] = []
  for (const syllabus of syllabuses) {
    for (const chapter of syllabus.chapters) {
      const key = `${chapter.difficulty}-${chapter.importance}`
      const priority: DifficultyLevel = PRIORITY_MATRIX[key] ?? 'medium'
      const estimatedMinutes = MINUTES_BY_DIFFICULTY[chapter.difficulty]
      const color = examSubjectMap[syllabus.subjectId] ?? '#4f46e5'

            tasks.push({
                id: nanoid(),
                name: `Ôn tập: ${chapter.name}`,
                chapter: chapter.name,
                subjectId: syllabus.subjectId,
                subjectName: syllabus.subjectName,
                estimatedMinutes,
                priority,
                status: "pending",
                color,
            });
        }
    }
  }
  const order: Record<DifficultyLevel, number> = { high: 0, medium: 1, low: 2 }
  return tasks.sort((a, b) => order[a.priority] - order[b.priority])
}
