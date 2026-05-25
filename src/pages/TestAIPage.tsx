import { useState } from "react";
import { generateStudyTasks } from "../services/studyPlannerAI";

export default function TestAIPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTestAI = async () => {
    setLoading(true);
    setResult(null);

    // Tạo dữ liệu giả lập (Mock Data) đúng với Input Schema
    const mockInput = {
      daysUntilExam: 5,
      dailyFreeTimeMinutes: 120, // Tổng quỹ thời gian: 600 phút
      chapters: [
        { chapterName: "Giải tích 1 - Đạo hàm", difficulty: 3, importance: 3 },
        { chapterName: "Giải tích 1 - Tích phân", difficulty: 3, importance: 3 },
        { chapterName: "Lịch sử Toán học", difficulty: 1, importance: 1 },
      ],
    };

    // Gọi hàm xử lý AI
    const response = await generateStudyTasks(mockInput);
    
    setResult(response);
    setLoading(false);
  };

  const checkAvailableModels = async () => {
    try {
      const apiKey = import.meta.env.VITE_AI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      
      console.log("CÁC MODEL BẠN ĐƯỢC PHÉP DÙNG:");
      data.models.forEach((m: any) => console.log(m.name));
      alert("Hãy mở Console (F12) để xem danh sách Model nhé!");
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", textAlign: "left" }}>
      <h1>Test AI Study Planner</h1>
      
      {/* Cụm nút bấm */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button 
          onClick={handleTestAI} 
          disabled={loading}
          style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
        >
          {loading ? "AI Đang tính toán..." : "Tạo Kế Hoạch Học Tập"}
        </button>

        <button 
          onClick={checkAvailableModels} 
          style={{ 
            padding: "10px 20px", 
            fontSize: "16px", 
            cursor: "pointer", 
            backgroundColor: "#4CAF50", 
            color: "white", 
            border: "none", 
            borderRadius: "4px" 
          }}
        >
          Xem Model Khả Dụng
        </button>
      </div>

      {/* Hiển thị kết quả trả về */}
      {result && (
        <div style={{ marginTop: "20px", padding: "15px", border: "1px solid #ccc", borderRadius: "8px" }}>
          {result.status === "error" ? (
            <div style={{ color: "red" }}>
              <h3>❌ Lỗi: {result.message}</h3>
              <pre>{JSON.stringify(result.details, null, 2)}</pre>
            </div>
          ) : (
            <div>
              <h3 style={{ color: "green" }}>✅ Thành công!</h3>
              <p>Tổng thời gian cho phép: <strong>{result.totalAllowedTime} phút</strong></p>
              <p>Thời gian AI đã xếp: <strong>{result.totalPlannedTime} phút</strong></p>
              
              <ul style={{ listStyleType: "none", padding: 0 }}>
                {result.tasks.map((task: any, index: number) => (
                  <li key={index} style={{ background: "#f4f3ec", margin: "10px 0", padding: "10px", borderRadius: "5px", color: "#000" }}>
                    <strong>{task.taskName}</strong> (Từ chương: {task.chapterName}) <br/>
                    ⏱ {task.estimatedTimeMinutes} phút | 🔥 Mức độ: {task.priority}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
