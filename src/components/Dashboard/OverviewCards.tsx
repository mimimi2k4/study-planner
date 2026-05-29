import { ArrowRight, BookOpen, Clock, Calendar, Award } from "lucide-react";

import { Link } from "react-router-dom";
import type { ExamInfo, Milestone, ScheduleSlot } from "../../types";

interface OverviewCardsProps {
  completionRate: number;
  nextExam?: ExamInfo;
  nextCountdown: { daysLeft: number; isOverdue: boolean } | null;
  nearestMilestone?: Milestone;
  todaySlots: ScheduleSlot[];
  /**
   * Whether the user has completed the required data entry steps.
   * If false, the component shows the onboarding three‑step UI.
   */
  hasData: boolean;
  /** Steps used for onboarding – reuse the same array from DashboardPage */
  steps: {
    label: string;
    desc: string;
    to: string;
    emoji: string;
    key: string;
  }[];
}

export default function OverviewCards({
  completionRate,
  nextExam,
  nextCountdown,
  nearestMilestone,
  todaySlots,
  hasData,
  steps,
}: OverviewCardsProps) {
  const today = new Date().toISOString().split("T")[0];

  if (!hasData) {
    // Show onboarding (first three steps)
    const onboarding = steps.slice(0, 3);
    return (
      <div className="card rounded-3xl overflow-hidden">
        <div className="px-6 py-5 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #f5f0ff, #ede9fe)" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.6)" }}>
            <BookOpen size={20} className="text-violet-600" />
          </div>
          <h2 className="font-black text-slate-800 text-xl">Bắt đầu – 3 bước thiết lập</h2>
        </div>
        <div className="p-6" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {onboarding.map((step, i) => (
            <Link
              key={i}
              to={step.to}
              className="flex items-center gap-3.5 rounded-2xl transition-all duration-150 group"
              style={{
                padding: "14px 16px",
                background: "#faf8ff",
                border: "1.5px solid #ede9fe",
                textDecoration: "none",
              }}
            >
              <span className="text-xl shrink-0 leading-none">{step.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base" style={{ color: "#1e293b" }}>
                  {step.label}
                </p>
                <p className="text-slate-500 text-sm mt-1">{step.desc}</p>
              </div>
              <ArrowRight size={15} className="text-violet-300 group-hover:text-violet-500 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Helper to format time range
  const formatRange = (slot: ScheduleSlot) => `${slot.startTime}–${slot.endTime}`;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {/* Countdown card – ưu tiên hiển thị ở trên */}
      {nextExam && nextCountdown && !nextCountdown.isOverdue && (
        <div className="card rounded-3xl p-5" style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}>
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-amber-500" />
            <h3 className="font-black text-slate-800 text-lg">{nextExam.subjectName} – còn lại</h3>
          </div>
          <p className="text-4xl font-black text-amber-800">
            {nextCountdown.daysLeft} ngày
          </p>
        </div>
      )}

      {/* Today schedule */}
      <div className="card rounded-3xl p-5" style={{ background: "linear-gradient(135deg, #a7f3d0, #99f6e4)" }}>
        <div className="flex items-center gap-3 mb-2">
          <Calendar size={20} className="text-emerald-600" />
          <h3 className="font-black text-slate-800 text-lg">Lịch học hôm nay</h3>
        </div>
        {todaySlots.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {todaySlots.map((slot) => (
              <li key={slot.id} className="flex justify-between text-slate-800">
                <span>{slot.subjectName}</span>
                <span className="font-medium">{formatRange(slot)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600">Không có lịch học hôm nay</p>
        )}
      </div>

      {/* Milestone card */}
      {nearestMilestone && (
        <div className="card rounded-3xl p-5" style={{ background: "linear-gradient(135deg, #fff1f2, #fecdd3)" }}>
          <div className="flex items-center gap-3 mb-2">
            <Award size={20} className="text-pink-600" />
            <h3 className="font-black text-slate-800 text-lg">Milestone gần nhất</h3>
          </div>
          <p className="font-medium text-slate-800">{nearestMilestone.name}</p>
          <p className="text-sm text-slate-600">Hạn: {nearestMilestone.deadlineDate}</p>
        </div>
      )}

      {/* Completion rate card */}
      <div className="card rounded-3xl p-5" style={{ background: "linear-gradient(135deg, #fde68a, #fcd34d)" }}>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={20} className="text-amber-600" />
          <h3 className="font-black text-slate-800 text-lg">Tiến độ</h3>
        </div>
        <p className="text-4xl font-black text-amber-800">
          {completionRate}%
        </p>
        <p className="text-slate-600">Nhiệm vụ đã hoàn thành</p>
      </div>
    </div>
  );
}
