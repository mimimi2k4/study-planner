import { useEffect, useRef } from "react";
import type { Milestone } from "../../types";
import { CheckCircle2, Circle, Target } from "lucide-react";

export interface MilestoneTimelineProps {
  milestones: Milestone[];
}

export default function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const firstPendingRef = useRef<HTMLDivElement>(null);

  // 1. Sắp xếp milestone theo ngày tăng dần
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime()
  );

  // 2. Tìm index của milestone "chưa đạt" đầu tiên
  const firstPendingIndex = sortedMilestones.findIndex((m) => m.status === "chưa đạt");

  // 3. Tự động cuộn đến milestone "chưa đạt" gần nhất
  useEffect(() => {
    if (firstPendingRef.current) {
      // Dùng setTimeout để đảm bảo DOM đã render hoàn toàn trước khi cuộn
      const timer = setTimeout(() => {
        firstPendingRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [milestones]);

  // 4. Trạng thái trống (Empty State)
  if (sortedMilestones.length === 0) {
    return (
      <div 
        className="card rounded-3xl p-10 text-center flex flex-col items-center gap-3"
        style={{ background: "#faf8ff", border: "2px dashed #ddd6fe", boxShadow: "none" }}
      >
        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 mb-2">
          <Target size={28} />
        </div>
        <p className="font-bold text-slate-700 text-base">Chưa có mốc tiến độ</p>
        <p className="text-slate-500 text-sm max-w-[250px]">
          Hãy thiết lập ngày thi để hệ thống tự động tính toán các mốc ôn tập cho bạn nhé.
        </p>
      </div>
    );
  }

  // 5. Hiển thị Timeline
  return (
    <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm max-h-[500px] overflow-y-auto relative custom-scrollbar">
      <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
        <Target size={20} className="text-indigo-500" />
        Đường mốc tiến độ
      </h3>
      
      <div className="relative">
        {/* Đường thẳng timeline chạy dọc */}
        <div className="absolute left-[19px] top-3 bottom-5 w-[2px] bg-slate-100 rounded-full" />

        <div className="space-y-6">
          {sortedMilestones.map((milestone, index) => {
            const isAchieved = milestone.status === "đã đạt";
            const isFirstPending = index === firstPendingIndex;

            return (
              <div
                key={milestone.milestoneId}
                ref={isFirstPending ? firstPendingRef : null}
                className="relative flex items-start gap-5 group"
              >
                {/* Cột trái: Icon Timeline */}
                <div className="relative z-10 bg-white py-1">
                  {isAchieved ? (
                    <CheckCircle2 size={40} className="text-emerald-500 bg-white rounded-full transition-transform group-hover:scale-110" />
                  ) : (
                    <Circle
                      size={40}
                      className={`bg-white rounded-full transition-all ${
                        isFirstPending 
                          ? "text-indigo-500 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                          : "text-slate-200 group-hover:text-slate-300"
                      }`}
                      fill={isFirstPending ? "#eef2ff" : "#f8fafc"}
                    />
                  )}
                </div>

                {/* Cột phải: Nội dung Card */}
                <div
                  className={`flex-1 min-w-0 p-4 rounded-2xl border transition-all duration-300 ${
                    isAchieved
                      ? "bg-emerald-50/40 border-emerald-100 opacity-70 group-hover:opacity-100"
                      : isFirstPending
                      ? "bg-indigo-50/50 border-indigo-200 shadow-sm transform -translate-y-0.5"
                      : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <p
                    className={`font-bold text-base mb-2 truncate ${
                      isAchieved ? "text-emerald-700" : isFirstPending ? "text-indigo-700" : "text-slate-700"
                    }`}
                  >
                    {milestone.name}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                        isAchieved
                          ? "bg-emerald-100/50 text-emerald-700 border-emerald-200"
                          : isFirstPending
                          ? "bg-indigo-100/50 text-indigo-700 border-indigo-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {new Date(milestone.deadlineDate).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </span>
                    
                    {/* Badge Trạng thái */}
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-widest ${
                        isAchieved ? "text-emerald-500" : "text-slate-400"
                      }`}
                    >
                      {isAchieved ? "✓ Đã đạt" : "○ Chưa đạt"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}