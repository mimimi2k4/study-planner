import { useState } from 'react'
import type { ExamInfo, Syllabus, FreeSlot, StudyTask, StudyPlan, ScheduleSlot } from '../types'
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import ScheduleView from '../components/ScheduleView/ScheduleView'
import { generateSchedule } from '../utils/scheduler'
import type { ScheduleWarning } from '../types'
import PageHeader from '../components/PageHeader'
import { analyzeAndGenerateTasksWithAI } from '../utils/aiAnalyzer' // Sử dụng hàm AI mới

export interface SchedulePageProps {
  exams: ExamInfo[]; syllabuses: Syllabus[]; freeSlots: FreeSlot[]
  tasks: StudyTask[]; plan: StudyPlan | null
  onTasksChange: (t: StudyTask[]) => void; onPlanChange: (p: StudyPlan | null) => void
}

export default function SchedulePage({ exams, syllabuses, freeSlots, plan, onTasksChange, onPlanChange }: SchedulePageProps) {
  const [warnings, setWarnings] = useState<ScheduleWarning[]>([])
  const [generating, setGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  
  const canGenerate = exams.length > 0 && syllabuses.length > 0 && freeSlots.length > 0

  // Chuyển đổi hàm lập lịch sang bất đồng bộ (async) để kết nối API Gemini
  async function doGenerate() {
    setGenerating(true)
    setAiError(null)

    try {
      // 1. Tạo bản đồ mã màu theo mã môn học
      const colorMap: Record<string, string> = {}
      exams.forEach((e) => { colorMap[e.id] = e.color })

      // 2. Gọi AI bẻ nhỏ đề cương (Dựa thuần túy vào tên chương, độ khó & độ quan trọng)
      const intelligentTasks = await analyzeAndGenerateTasksWithAI(syllabuses, colorMap)
      
      if (intelligentTasks.length === 0) {
        setAiError("AI không thể phân rã chương học hoặc danh sách phản hồi trống.")
        setGenerating(false)
        return
      }

      // Lưu lại danh sách các việc cần học đã bẻ nhỏ vào State tổng
      onTasksChange(intelligentTasks)

      // 3. Đưa danh sách việc nhỏ của AI vào bộ thuật toán xếp slot thời gian rảnh cố định
      const { plan: p, warnings: w } = generateSchedule(intelligentTasks, freeSlots, exams)
      
      onPlanChange(p)
      setWarnings(w)

    } catch (error: any) {
      console.error("Lỗi trong quá trình lập lịch biểu thông minh:", error)
      setAiError("Có lỗi hệ thống xảy ra khi xử lý phân tách lịch trình bằng AI.")
    } finally {
      setGenerating(false)
    }
  }

  const readyItems = [
    { label: 'Môn thi',        done: exams.length > 0,       emoji: '📚' },
    { label: 'Đề cương',       done: syllabuses.length > 0,  emoji: '📝' },
    { label: 'Thời gian rảnh', done: freeSlots.length > 0,   emoji: '⏰' },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        emoji="📅"
        title="Lịch học"
        subtitle="Xem và quản lý thời khóa biểu học tập của bạn"
        action={canGenerate && !plan ? (
          <button onClick={doGenerate} disabled={generating}
            className="btn btn-primary" style={{ borderRadius: 12 }}>
            <Sparkles size={15} className={generating ? 'animate-spin-s' : ''} />
            {generating ? 'AI đang phân rã đề cương...' : '✨ Tạo lịch học bằng AI'}
          </button>
        ) : undefined}
      />

      {/* Hiển thị lỗi từ API nếu xảy ra sự cố */}
      {aiError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-start gap-2">
          <span>❌</span>
          <p className="font-medium">{aiError}</p>
        </div>
      )}

      {!canGenerate && (
        <div className="card p-5 flex items-start gap-4 rounded-2xl"
          style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
            style={{ background: '#fef3c7' }}>
            💡
          </div>
          <div>
            <p className="font-bold text-amber-800 mb-2.5">Cần hoàn thành những bước này trước nhé!</p>
            <div className="flex flex-wrap gap-2">
              {readyItems.map((item) => (
                <span key={item.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                  style={{
                    background: item.done ? '#f0fdf4' : '#fff7ed',
                    color: item.done ? '#15803d' : '#92400e',
                    border: `1.5px solid ${item.done ? '#bbf7d0' : '#fed7aa'}`,
                  }}>
                  {item.emoji} {item.done ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {item.label}{!item.done && ' — chưa có'}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <ScheduleView slots={plan?.slots ?? []} exams={exams} warnings={warnings}
        onRegenerate={doGenerate}
        onSlotsChange={(slots: ScheduleSlot[]) => {
          if (!plan) return
          onPlanChange({ ...plan, slots, manualEdited: true })
        }} />
    </div>
  )
}