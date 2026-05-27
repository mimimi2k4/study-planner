import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";



// Schema cho Input
const ChapterInputSchema = z.object({
  chapterName: z.string().min(1, "Tên chương không được để trống"),
  difficulty: z.number().min(1).max(3),
  importance: z.number().min(1).max(3),
});

const PlannerInputSchema = z.object({
  daysUntilExam: z.number().min(1, "Số ngày còn lại phải lớn hơn 0"),
  dailyFreeTimeMinutes: z.number().min(10, "Thời gian rảnh mỗi ngày quá ít"),
  chapters: z.array(ChapterInputSchema).min(1, "Phải có ít nhất 1 chương học"),
});

// Schema cho Output từ AI
const TaskOutputSchema = z.object({
  taskName: z.string(),
  chapterName: z.string(),
  estimatedTimeMinutes: z.number(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
});

const AIOutputSchema = z.object({
  tasks: z.array(TaskOutputSchema),
});

// Định nghĩa kiểu dữ liệu TS từ Zod
export type PlannerInput = z.infer<typeof PlannerInputSchema>;
export type StudyTask = z.infer<typeof TaskOutputSchema>;



//  cấu hình biến môi trường GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_AI_API_KEY);
// Cấu hình Schema  cho Gemini
const geminiResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    tasks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          taskName: { type: SchemaType.STRING },
          chapterName: { type: SchemaType.STRING },
          estimatedTimeMinutes: { type: SchemaType.INTEGER },
          priority: {
            type: SchemaType.STRING,
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
          },
        },
        required: ["taskName", "chapterName", "estimatedTimeMinutes", "priority"],
      },
    },
  },
  required: ["tasks"],
};



export async function generateStudyTasks(inputData: any) {
  try {
    // 3.1. Validate Input
    const validatedInput = PlannerInputSchema.safeParse(inputData);
    if (!validatedInput.success) {
      return {
        status: "error",
        message: "Dữ liệu đầu vào không hợp lệ",
        details: validatedInput.error.format(),
      };
    }

    const { daysUntilExam, dailyFreeTimeMinutes, chapters } = validatedInput.data;
    
    // Tính toán tổng quỹ thời gian rảnh
    const totalFreeTimeMinutes = daysUntilExam * dailyFreeTimeMinutes;

    // 3.2. Gọi Gemini AI
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: geminiResponseSchema,
      },
    });

    const prompt = `
      Bạn là một AI lên kế hoạch học tập. Hãy phân tích danh sách các chương học sau đây và bẻ nhỏ chúng thành các task học tập cụ thể.
      
      THÔNG TIN:
      - Quỹ thời gian tối đa hiện có: ${totalFreeTimeMinutes} phút (QUAN TRỌNG: Tổng thời gian của tất cả các task bạn tạo ra KHÔNG ĐƯỢC VƯỢT QUÁ con số này).
      - Danh sách chương học: ${JSON.stringify(chapters)}

      QUY TẮC BẺ NHỎ:
      1. Mỗi task tạo ra không nên vượt quá 60-90 phút. Nếu một chương khó và quan trọng, hãy tách nó thành nhiều task nhỏ.
      2. Mức ưu tiên (priority):
         - CRITICAL: Quan trọng=3, Độ khó=3
         - HIGH: Quan trọng=3, Độ khó=1 hoặc 2
         - MEDIUM: Quan trọng=2
         - LOW: Quan trọng=1 (Có thể bỏ qua nếu tổng thời gian bị vượt quá giới hạn).
      3. Gắn đúng 'chapterName' gốc cho từng task nhỏ để dễ quản lý.
    `;

    const result = await model.generateContent(prompt);
    const aiResponseText = result.response.text();
    const parsedData = JSON.parse(aiResponseText);

    // 3.3. Validate Output từ AI
    const validatedOutput = AIOutputSchema.safeParse(parsedData);
    if (!validatedOutput.success) {
      return {
        status: "error",
        message: "AI trả về cấu trúc dữ liệu lỗi",
        details: validatedOutput.error.format(),
      };
    }

    // 3.4. Kiểm tra logic tổng thời gian
    const generatedTasks = validatedOutput.data.tasks;
    const totalEstimatedTime = generatedTasks.reduce((sum, task) => sum + task.estimatedTimeMinutes, 0);

    if (totalEstimatedTime > totalFreeTimeMinutes) {
      return {
        status: "error",
        message: "AI tạo ra kế hoạch vượt quá thời gian cho phép",
        details: {
          totalAllowed: totalFreeTimeMinutes,
          totalGenerated: totalEstimatedTime,
        },
      };
    }

    return {
      status: "success",
      totalAllowedTime: totalFreeTimeMinutes,
      totalPlannedTime: totalEstimatedTime,
      tasks: generatedTasks,
    };

  } catch (error: any) {
    return {
      status: "error",
      message: "Lỗi hệ thống trong quá trình xử lý",
      details: error.message,
    };
  }
}