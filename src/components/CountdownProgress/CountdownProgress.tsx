import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";

type ExamInfo = {
  id: string;
  subjectName: string;
  examDateTime: string; // ISO string
};

type ProgressProps = {
  totalTasks: number;
  completedTasks: number;
};

interface CountdownProgressProps {
  exam?: ExamInfo | null;
  progress?: ProgressProps;
}

/**
 * Component displaying a countdown to the exam date and a progress bar of tasks.
 * - If no exam is provided, shows a button linking to the exam creation page.
 * - If all tasks are completed, shows a ready‑for‑exam message.
 * - Otherwise shows remaining time (days, hours, minutes) and a progress bar.
 */
export default function CountdownProgress({
  exam,
  progress,
}: CountdownProgressProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!exam) {
    return (
      <Link
        to="/exams"
        className="btn btn-primary"
        style={{ textDecoration: "none" }}
      >
        Thêm lịch thi ngay
      </Link>
    );
  }

  const examDate = new Date(exam.examDateTime);
  const diff = Math.max(0, examDate.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  const total = progress?.totalTasks ?? 0;
  const completed = progress?.completedTasks ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (total > 0 && completed >= total) {
    return <p className="text-green-600 font-bold">Bạn đã sẵn sàng cho kỳ thi!</p>;
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-white/10 rounded-lg border border-white/20">
      <Clock size={20} className="text-violet-300" />
      <div className="flex flex-col">
        <span className="text-white font-medium">
          {exam.subjectName} — còn {days} ngày {hours} giờ {minutes} phút
        </span>
        {total > 0 && (
          <div className="mt-2 w-48 bg-gray-300/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-violet-400 h-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
        {total > 0 && (
          <span className="text-xs text-white/70 mt-1">
            {completed}/{total} nhiệm vụ hoàn thành ({percent}%)
          </span>
        )}
      </div>
    </div>
  );
}
