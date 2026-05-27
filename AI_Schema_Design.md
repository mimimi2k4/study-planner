# Thiết kế Schema Dữ liệu AI cho Study Planner

Tài liệu này mô tả cấu trúc dữ liệu đầu vào (Input) và đầu ra (Output) khi giao tiếp với model AI, kèm theo phân tích logic về cách AI nên thiết lập mối liên hệ giữa các thuộc tính để sinh ra kế hoạch học tập tối ưu.

## 1. Schema Dữ liệu Đầu vào (AI Input)

Đầu vào cung cấp cho AI bối cảnh về môn học, độ khó, và áp lực thời gian của kỳ thi.

### TypeScript Schema

```typescript
// Định dạng hình thức thi
type ExamFormat = "MULTIPLE_CHOICE" | "ESSAY" | "PRACTICAL" | "ORAL";

// Thông tin kỳ thi (Exam Information)
interface ExamInfo {
  examDate: string;        // Định dạng ISO 8601 (VD: "2026-06-15T00:00:00Z")
  subjectCount: number;    // Số lượng môn học người dùng đang ôn tập cùng lúc (Int, > 0)
  format: ExamFormat;      // Hình thức thi
}

// Đề cương môn học (Course Outline)
interface Chapter {
  chapterId: string;       // Định danh độc nhất cho chương
  chapterName: string;     // Tên chương / chủ đề
  difficulty: 1 | 2 | 3;   // Mức độ khó: 1 (Dễ), 2 (Vừa), 3 (Khó)
  importance: 1 | 2 | 3;   // Mức độ quan trọng (tỉ trọng điểm): 1 (Thấp), 2 (Trung bình), 3 (Cao)
}

// Payload gửi tới AI
interface AIStudyPlanInput {
  examInfo: ExamInfo;
  courseOutlines: Chapter[];
}


## 2. Schema Dữ liệu Đầu ra (AI Output)
// Mức độ ưu tiên
type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// Nhiệm vụ học tập (Study Task)
interface StudyTask {
  topicName: string;            // Tên chủ đề học tập (được AI chia nhỏ từ chapterName)
  difficulty: 1 | 2 | 3;        // Kế thừa hoặc đánh giá lại từ độ khó của chương
  estimatedTimeMinutes: number; // Thời gian học ước tính (phút)
  priority: PriorityLevel;      // Mức độ ưu tiên của chủ đề này
  recommendedAction?: string;   // Gợi ý phương pháp học (VD: "Làm flashcard", "Giải đề năm cũ")
}

// Response từ AI
interface AIStudyPlanOutput {
  tasks: StudyTask[];
}


## 3. Phân tích Mối liên hệ giữa các thuộc tính (Logic/Heuristics cho AI)
A. Xác định Mức độ ưu tiên (priority)
//Mức độ ưu tiên được quyết định chủ yếu bởi ma trận giữa Mức độ quan trọng (importance) và Độ khó (difficulty):
    CRITICAL (Rất cao): importance = 3 VÀ difficulty = 3 (Chương cốt lõi, dễ mất điểm nhất -> Cần học trước và ôn nhiều lần).
    HIGH (Cao): importance = 3 VÀ difficulty = 1 hoặc 2 (Chương dễ lấy điểm nhiều -> Cần đảm bảo không sai sót).
    MEDIUM (Trung bình): importance = 2, bất kể difficulty (Kiến thức nền tảng bổ trợ).
    LOW (Thấp): importance = 1 (Phần phụ, đọc thêm, chỉ học khi đã hoàn thành các phần trên).
Hệ số điều chỉnh từ ExamInfo: Nếu khoảng cách từ hiện tại đến examDate quá ngắn, AI cần lọc bỏ (hoặc giảm ưu tiên) các task LOW để tập trung vào CRITICAL và HIGH.

B. Ước tính Thời gian Học (estimatedTimeMinutes)
Tính toán dựa trên một mốc thời gian cơ sở (Base Time) và nhân với các trọng số (Weights):
1.Hệ số Độ khó (difficulty):
    Khó (3): Base Time * 1.5
    Vừa (2): Base Time * 1.0
    Dễ (1): Base Time * 0.7
2.Hệ số Hình thức thi (format):
    ESSAY (Tự luận): Yêu cầu ghi nhớ sâu và viết -> Tăng +20% thời gian.
    MULTIPLE_CHOICE (Trắc nghiệm): Yêu cầu đọc hiểu rộng -> Thời gian chuẩn.
    PRACTICAL (Thực hành): Cần thời gian gõ code/thao tác -> Tăng +30% thời gian.
3.Hệ số Số lượng môn (subjectCount):
    Nếu subjectCount lớn (VD: thi 5 môn cùng kỳ), AI cần giới hạn tổng thời gian estimatedTimeMinutes của môn học này lại (chia nhỏ task hơn, mỗi task tối đa 25-45 phút để áp dụng Pomodoro) nhằm tránh quá tải.

C. Xử lý Tên chủ đề (topicName)
    AI không nên chỉ copy paste chapterName. Nếu một chương có difficulty = 3 và importance = 3, AI nên tự động chia nhỏ (break down) chapterName đó thành nhiều topicName nhỏ hơn.
    Ví dụ: Thay vì 1 task "Ôn tập React Hooks" (120 phút), AI trả về 3 tasks: "Lý thuyết useState/useEffect" (40m), "Thực hành Custom Hooks" (40m), "Tối ưu hiệu năng với useMemo" (40m).