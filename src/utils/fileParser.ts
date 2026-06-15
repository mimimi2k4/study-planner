import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import type { Chapter } from "../types";
import { nanoid } from "./nanoid";

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
                        description:
                            "Tên chương kèm tiền tố phân cấp rõ ràng, ví dụ: 'Chương 2: Cấu trúc dữ liệu', '2.1. Khái niệm Cây', '2.1.1. Cây nhị phân tìm kiếm'",
                    },
                    difficulty: {
                        type: SchemaType.STRING,
                        format: "enum",
                        enum: ["low", "medium", "high"],
                    },
                    importance: {
                        type: SchemaType.STRING,
                        format: "enum",
                        enum: ["low", "medium", "high"],
                    },
                    level: {
                        type: SchemaType.INTEGER,
                        description:
                            "Cấp độ lồng nhau: 0 cho chương lớn gốc (2.), 1 cho chương con (2.1), 2 cho mục nhỏ hơn (2.1.1)",
                    },
                    difficultyReason: {
                        type: SchemaType.STRING,
                        description: "Giải thích ngắn gọn (dưới 15 chữ) lý do tại sao đánh giá mức độ khó và quan trọng như vậy.",
                    },
                },
                required: ["name", "difficulty", "importance", "level", "difficultyReason"],
            },
        },
    },
    required: ["chapters"],
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
      Nhiệm vụ: Trích xuất DANH SÁCH MỤC LỤC các chương và mục học từ tài liệu đề cương môn học.

      TÀI LIỆU THÔ:
      """
      ${rawText.slice(0, 50000)}
      """

      QUY TẮC BẮT BUỘC:
      1. CHỈ trích xuất các MỤC LỤC/CHƯƠNG/MỤC học thực sự có cấu trúc số thứ tự hoặc tên học thuật rõ ràng.
         Ví dụ hợp lệ: "Chương 1: Giới thiệu", "1. Cơ sở dữ liệu quan hệ", "2.1 Cấu trúc dữ liệu", "Phần III: Thuật toán"
      2. TUYỆT ĐỐI BỎ QUA các thông tin sau (không được đưa vào kết quả):
         - Tên môn học, mã môn học (VD: IT4549, CS101...)
         - Tên trường, khoa, bộ môn
         - Tên giảng viên, tác giả
         - Ngày tháng, phiên bản tài liệu (VD: "Phiên bản: 2025.06.03")
         - Số tín chỉ, học kỳ, năm học
         - Thông tin bản quyền, lời mở đầu, lời cảm ơn
         - Header/Footer của tài liệu
         - Bất kỳ dòng nào không phải tiêu đề chương/mục học thuật
      3. GIỮ NGUYÊN TIỀN TỐ SỐ để thể hiện phân cấp trong chuỗi 'name'.
         Ví dụ: "Chương 2: CSDL quan hệ", "2.1. Mô hình quan hệ", "2.1.1. Khái niệm"
      4. Xác định 'level' theo cấp độ lồng nhau:
         - Chương lớn / Phần gốc → level = 0
         - Mục con (dạng 2.1, 2.2) → level = 1
         - Mục nhỏ hơn (dạng 2.1.1) → level = 2
      5. Gán 'difficulty' và 'importance' dựa trên từ khóa kỹ thuật của từng mục. Giải thích ngắn gọn (dưới 15 chữ) vào trường 'difficultyReason'.
      6. Nếu tài liệu KHÔNG CÓ mục lục/chương rõ ràng, trả về mảng chapters rỗng [].
    `;

        const result = await model.generateContent(prompt);
        const parsedJson = JSON.parse(result.response.text());

        if (parsedJson && Array.isArray(parsedJson.chapters)) {
            return parsedJson.chapters.map((c: any) => ({
                id: nanoid(),
                name: c.name.trim(),
                difficulty: c.difficulty,
                importance: c.importance,
                level: c.level ?? 0, // Kế thừa thuộc tính phân cấp tầng
                difficultyReason: c.difficultyReason,
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
        .map((l) => ({
            id: nanoid(),
            name: l.trim(),
            difficulty: "medium",
            importance: "medium",
            level: 0,
        }));
}

// === GIỮ NGUYÊN TẦNG TRÍCH XUẤT CHỮ THÔ BÊN DƯỚI ===
async function parsePDF(buffer: ArrayBuffer): Promise<string> {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
    ).href;
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText +=
            content.items
                .filter((item) => "str" in item)
                .map((item) => (item as { str: string }).str)
                .join(" ") + "\n";
    }
    return fullText;
}

async function parseDOCX(buffer: ArrayBuffer): Promise<string> {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
}

export async function parseFileToChapters(file: File): Promise<Chapter[]> {
    const name = file.name.toLowerCase();
    const buffer = await file.arrayBuffer();
    let extractedRawText = "";

    if (name.endsWith(".pdf")) {
        extractedRawText = await parsePDF(buffer);
    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
        extractedRawText = await parseDOCX(buffer);
    } else if (name.endsWith(".json")) {
        const text = new TextDecoder("utf-8").decode(buffer);
        try {
            const data = JSON.parse(text);
            if (!Array.isArray(data)) return [];
            return data.map((item) =>
                typeof item === "string"
                    ? {
                          id: nanoid(),
                          name: item,
                          difficulty: "medium",
                          importance: "medium",
                          level: 0,
                      }
                    : {
                          id: nanoid(),
                          name: item.name ?? String(item),
                          difficulty: item.difficulty ?? "medium",
                          importance: item.importance ?? "medium",
                          level: item.level ?? 0,
                      }
            );
        } catch {
            return [];
        }
    } else {
        extractedRawText = new TextDecoder("utf-8").decode(buffer);
    }
    return parseTextToChaptersWithAI(extractedRawText);
}
