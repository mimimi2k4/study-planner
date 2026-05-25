import type { ExamInfo, ExamCountdownResult } from '../../types'
import { Clock, Target, Flame, CheckCircle2 } from 'lucide-react'

const FORMAT_LABELS: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm', essay: 'Tự luận', combined: 'Kết hợp',
}

export interface ExamCardProps { exam: ExamInfo; countdown: ExamCountdownResult | null }

export default function ExamCard({ exam, countdown }: ExamCardProps) {
  const urgent  = countdown && !countdown.isOverdue && countdown.daysLeft <= 7
  const overdue = countdown?.isOverdue

  return (
    <div className="rounded-2xl overflow-hidden flex transition-all duration-150"
      style={{
        border: '1.5px solid rgba(139,92,246,0.10)',
        boxShadow: '0 2px 8px rgba(109,40,217,0.05)',
        background: '#fff',
      }}>
      <div className="w-1.5 shrink-0" style={{ background: exam.color }} />

      <div className="flex-1 px-5 py-5">
        {/* Name + format badge */}
        <div className="flex items-start justify-between gap-3">
          <p className="font-black text-slate-900 leading-snug" style={{ fontSize: 17 }}>
            {exam.subjectName}
          </p>
          <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg font-bold"
            style={{ fontSize: 11, background: exam.color + '18', color: exam.color }}>
            {FORMAT_LABELS[exam.examFormat]}
          </span>
        </div>

        {/* Info chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1"
            style={{ fontSize: 14, fontWeight: 600, background: '#f1f5f9', color: '#334155' }}>
            <Clock size={13} />
            {new Date(exam.examDateTime).toLocaleString('vi-VN', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1"
            style={{ fontSize: 14, fontWeight: 700, background: exam.color + '20', color: exam.color }}>
            <Target size={12} /> {exam.targetScore}/10
          </span>
        </div>

        {/* Countdown block */}
        {countdown ? (
          <div className="mt-4 rounded-xl px-4 py-3"
            style={{ background: overdue ? '#fff1f2' : urgent ? '#fff7ed' : exam.color + '0e' }}>
            {overdue ? (
              <p className="text-sm font-semibold" style={{ color: '#be123c' }}>⚠️ Cảnh báo: Ngày thi đã qua!</p>
            ) : urgent ? (
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-orange-500 shrink-0" />
                <span className="font-bold text-orange-600" style={{ fontSize: 14 }}>
                  Gấp! Còn {countdown.daysLeft} ngày {countdown.hoursLeft > 0 ? `${countdown.hoursLeft} giờ` : ''}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold" style={{ fontSize: 15, color: exam.color }}>
                    Còn {countdown.daysLeft} ngày
                  </span>
                  {countdown.totalTasks > 0 && (
                    <span className="flex items-center gap-1 font-bold" style={{ fontSize: 13, color: exam.color }}>
                      {countdown.completionRate === 100 && <CheckCircle2 size={11} />}
                      {countdown.completionRate}% xong
                    </span>
                  )}
                </div>
                {countdown.totalTasks > 0 && (
                  <div className="h-2 rounded-full" style={{ background: exam.color + '22' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${countdown.completionRate}%`, background: exam.color }} />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl px-4 py-3" style={{ background: '#fffbeb' }}>
            <p className="text-sm font-semibold text-amber-700">🔔 Nhắc nhở: Chưa có ngày thi hợp lệ</p>
          </div>
        )}
      </div>
    </div>
  )
}
