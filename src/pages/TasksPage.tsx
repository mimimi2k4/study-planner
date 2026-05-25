import type { StudyTask, ExamInfo } from '../types'
import { CheckSquare, Circle, Clock, Sparkles } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const P_LABEL: Record<string, string> = { high: 'Cao', medium: 'TB', low: 'Thấp' }
const P_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  high:   { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
  medium: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  low:    { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
}

export interface TasksPageProps { tasks: StudyTask[]; exams: ExamInfo[]; onTasksChange: (t: StudyTask[]) => void }

export default function TasksPage({ tasks, exams, onTasksChange }: TasksPageProps) {
  function toggle(taskId: string) {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: t.status === 'completed' ? ('pending' as const) : ('completed' as const) } : t
    )
    onTasksChange(updated)
  }

  const grouped = exams.reduce<Record<string, { exam: ExamInfo; tasks: StudyTask[] }>>((acc, exam) => {
    acc[exam.id] = { exam, tasks: tasks.filter((t) => t.subjectId === exam.id) }
    return acc
  }, {})

  const done = tasks.filter((t) => t.status === 'completed').length
  const rate = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0

  if (tasks.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader emoji="✅" title="Nhiệm vụ học tập" subtitle="Theo dõi tiến độ hoàn thành từng nhiệm vụ" />
        <div className="card rounded-3xl p-16 text-center flex flex-col items-center gap-4"
          style={{ background: '#faf8ff', border: '2px dashed #ddd6fe', boxShadow: 'none' }}>
          <div className="text-5xl animate-float">🎯</div>
          <div>
            <p className="font-bold text-slate-700 text-lg">Chưa có nhiệm vụ nào</p>
            <p className="text-slate-400 text-sm mt-1">
              Vào <span className="text-violet-600 font-semibold">Lịch học</span> để AI tạo nhiệm vụ cho bạn nhé!
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-violet-600"
            style={{ background: '#f5f0ff', border: '1.5px solid #ddd6fe' }}>
            <Sparkles size={14} /> Tạo lịch → nhiệm vụ tự sinh!
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader emoji="✅" title="Nhiệm vụ học tập" subtitle="Theo dõi tiến độ hoàn thành từng nhiệm vụ" />

      {/* Progress banner */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #3b0d8f 0%, #5b21b6 40%, #7c3aed 100%)',
          boxShadow: '0 10px 32px rgba(109,40,217,0.30)',
        }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full animate-glow"
            style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.30) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-6 right-10 w-36 h-36 rounded-full animate-glow"
            style={{ background: 'radial-gradient(circle, rgba(233,213,255,0.25) 0%, transparent 70%)', animationDelay: '2s' }} />
        </div>
        <div className="relative z-10 px-8 py-6 flex items-center gap-8 flex-wrap">
          <div className="shrink-0">
            <p className="text-purple-300 text-xs font-bold uppercase tracking-widest mb-2">Tổng tiến độ</p>
            <div className="flex items-baseline gap-1">
              <span className="font-black leading-none" style={{ fontSize: 52, color: '#fde68a' }}>{rate}</span>
              <span className="text-2xl font-bold text-white/40">%</span>
            </div>
            <p className="text-purple-300 text-sm mt-1">{done}/{tasks.length} nhiệm vụ hoàn thành 🎉</p>
          </div>
          <div className="flex-1 min-w-[140px]">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${rate}%`,
                  background: 'linear-gradient(90deg, #fde68a, #f9a8d4, #c084fc)',
                  boxShadow: '0 0 12px rgba(253,230,138,0.5)',
                }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-purple-400">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          {rate === 100 && (
            <div className="text-3xl animate-float shrink-0">🏆</div>
          )}
        </div>
      </div>

      {/* Task groups */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {Object.values(grouped).map(({ exam, tasks: sub }) => {
          if (sub.length === 0) return null
          const subDone = sub.filter((t) => t.status === 'completed').length
          const subRate = Math.round((subDone / sub.length) * 100)
          return (
            <div key={exam.id} className="card rounded-3xl overflow-hidden">
              {/* Color header */}
              <div className="px-5 py-4 flex items-center gap-3"
                style={{ background: exam.color + '12', borderBottom: `1.5px solid ${exam.color}20` }}>
                <div className="w-4 h-4 rounded-full shrink-0" style={{ background: exam.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{exam.subjectName}</p>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: exam.color + '20' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${subRate}%`, background: exam.color }} />
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: exam.color }}>{subDone}/{sub.length}</span>
                  </div>
                </div>
                {subRate === 100 && <span className="text-xl shrink-0">🌟</span>}
              </div>
              {/* Rows */}
              <div>
                {sub.map((task) => {
                  const ps = P_STYLE[task.priority]
                  return (
                    <div key={task.id}
                      className={`flex items-center gap-3 px-5 py-3 border-b last:border-b-0 transition-colors ${
                        task.status === 'completed' ? 'bg-slate-50/60' : 'hover:bg-purple-50/30'
                      }`}
                      style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                      <button onClick={() => toggle(task.id)}
                        className="shrink-0 transition-all hover:scale-110"
                        style={{ color: task.status === 'completed' ? exam.color : '#d8b4fe' }}>
                        {task.status === 'completed' ? <CheckSquare size={20} /> : <Circle size={20} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {task.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{task.chapter}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <Clock size={10} />{task.estimatedMinutes}ph
                        </span>
                        <span className="badge text-[10px]"
                          style={{ background: ps.bg, color: ps.text, border: `1px solid ${ps.border}` }}>
                          {P_LABEL[task.priority]}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
