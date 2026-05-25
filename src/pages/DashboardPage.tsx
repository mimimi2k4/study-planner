import { BookOpen, Calendar, Clock, CheckSquare, ArrowRight, TrendingUp, Award, Zap, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ExamInfo, StudyTask, StudyPlan, Syllabus } from '../types'
import StatsCard from '../components/Dashboard/StatsCard'
import ExamCard from '../components/Dashboard/ExamCard'
import { useAllExamsCountdown } from '../hooks/useExamCountdown'

export interface DashboardPageProps { exams: ExamInfo[]; syllabuses: Syllabus[]; tasks: StudyTask[]; plan: StudyPlan | null; freeHoursPerWeek: number }

const STEPS = [
  { label: 'Thêm môn thi',  desc: 'Ngày thi & điểm mục tiêu', to: '/exams',     emoji: '📚', key: 'exams' },
  { label: 'Nhập đề cương', desc: 'Chương học & độ khó',       to: '/syllabus',  emoji: '📝', key: 'syllabus' },
  { label: 'Chọn giờ học',  desc: 'Khung giờ rảnh mỗi tuần',   to: '/timeslots', emoji: '⏰', key: 'timeslots' },
  { label: 'Tạo lịch học',  desc: 'AI tự động phân bổ',        to: '/schedule',  emoji: '🤖', key: 'schedule' },
]

const GREETINGS = [
  'Hôm nay mình học gì nào?',
  'Cố lên, sắp đến ngày thi rồi!',
  'Mỗi bước nhỏ hôm nay tạo kết quả lớn mai sau.',
  'Học chăm hôm nay, thi tốt ngày mai.',
]

export default function DashboardPage({ exams, syllabuses, tasks, plan, freeHoursPerWeek }: DashboardPageProps) {
  const countdowns = useAllExamsCountdown(exams, tasks)
  const sortedExams = [...exams].sort((a, b) => new Date(a.examDateTime).getTime() - new Date(b.examDateTime).getTime())
  const nextExam = sortedExams.find((e) => new Date(e.examDateTime) > new Date())
  const nextCountdown = nextExam ? countdowns[nextExam.id] : null
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const totalScheduled = plan?.slots.length ?? 0
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const greeting = GREETINGS[new Date().getDay() % GREETINGS.length]

  const stepDone: Record<string, boolean> = {
    exams: exams.length > 0, syllabus: syllabuses.length > 0,
    timeslots: freeHoursPerWeek > 0, schedule: totalScheduled > 0,
  }
  const doneCount = Object.values(stepDone).filter(Boolean).length
  const circumference = 2 * Math.PI * 20

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── Hero ── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{
          minHeight: 175,
          background: 'linear-gradient(135deg, #3b0d8f 0%, #5b21b6 40%, #7c3aed 75%, #a855f7 100%)',
          boxShadow: '0 12px 40px rgba(109,40,217,0.30)',
        }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full animate-glow"
            style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.25) 0%, transparent 65%)' }} />
          <div className="absolute -bottom-10 right-10 w-48 h-48 rounded-full animate-glow"
            style={{ background: 'radial-gradient(circle, rgba(233,213,255,0.18) 0%, transparent 65%)', animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 px-10 py-7 flex items-center justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className="text-violet-300" />
              <span className="text-violet-300 text-[11px] font-bold uppercase tracking-widest">Dashboard</span>
            </div>
            <h1 className="text-white font-black text-4xl leading-tight">Xin chào, Hạ!</h1>
            <p className="text-purple-200 text-base mt-1.5">{greeting}</p>

            {nextExam && nextCountdown && !nextCountdown.isOverdue && (
              <div className="mt-4 inline-flex items-center gap-2.5 px-4 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <Clock size={14} className="text-violet-300 shrink-0" />
                <span className="text-white text-sm">
                  <span className="font-bold">{nextExam.subjectName}</span>
                  {' '}— còn <span className="font-black text-yellow-200">{nextCountdown.daysLeft} ngày</span>
                </span>
              </div>
            )}
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <div className="relative w-[76px] h-[76px]">
                <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke="url(#rpg)" strokeWidth="4"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={circumference * (1 - doneCount / 4)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }} />
                  <defs>
                    <linearGradient id="rpg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white font-black text-xl leading-none">{Math.round(doneCount / 4 * 100)}%</span>
                  <span className="text-white/40 text-[9px] font-semibold uppercase tracking-wide mt-0.5">setup</span>
                </div>
              </div>
              <p className="text-purple-300 text-[11px] font-medium mt-1">{doneCount}/4 bước</p>
            </div>

            {completionRate > 0 && (
              <div className="text-center px-5 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <p className="text-4xl font-black text-white leading-none">
                  {completionRate}<span className="text-xl text-white/40">%</span>
                </p>
                <p className="text-purple-300 text-[11px] font-medium mt-1">nhiệm vụ xong</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid-responsive"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 20 }}>
        <StatsCard dark accentColor="#5b21b6"
          icon={<BookOpen size={20} />} iconLarge={<BookOpen size={90} />}
          label="Môn thi" value={exams.length}
          sub={exams.length === 0 ? 'Chưa có môn nào' : `${exams.length} môn đã thêm`}
          gradient="linear-gradient(135deg, #ddd6fe 0%, #f5d0fe 100%)"
          shadow="0 6px 20px rgba(139,92,246,0.22)" />
        <StatsCard dark accentColor="#1d4ed8"
          icon={<Calendar size={20} />} iconLarge={<Calendar size={90} />}
          label="Ngày còn lại"
          value={nextCountdown ? (nextCountdown.isOverdue ? '0' : nextCountdown.daysLeft) : '—'}
          sub={nextExam ? nextExam.subjectName : 'Chưa có môn thi'}
          gradient="linear-gradient(135deg, #bfdbfe 0%, #c7d2fe 100%)"
          shadow="0 6px 20px rgba(59,130,246,0.22)" />
        <StatsCard dark accentColor="#047857"
          icon={<Clock size={20} />} iconLarge={<Clock size={90} />}
          label="Giờ / tuần"
          value={freeHoursPerWeek.toFixed(1)} sub="thời gian rảnh"
          gradient="linear-gradient(135deg, #a7f3d0 0%, #99f6e4 100%)"
          shadow="0 6px 20px rgba(16,185,129,0.22)" />
        <StatsCard dark accentColor="#b45309"
          icon={<CheckSquare size={20} />} iconLarge={<CheckSquare size={90} />}
          label="Hoàn thành"
          value={tasks.length === 0 ? '—' : `${completedTasks}/${tasks.length}`}
          sub={tasks.length === 0 ? 'Chưa có task' : `${completionRate}% done`}
          gradient="linear-gradient(135deg, #fde68a 0%, #fed7aa 100%)"
          shadow="0 6px 20px rgba(245,158,11,0.22)" />
      </div>

      {/* ── Body ── */}
      <div className="body-grid-responsive"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Setup checklist panel ── */}
        <div className="card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, #f5f0ff, #ede9fe)', borderBottom: '1.5px solid #e9d5ff' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px solid #ddd6fe' }}>
              <TrendingUp size={20} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-xl leading-none">Các bước thiết lập</h2>
              <p className="text-slate-600 text-sm mt-1">Hoàn thành để AI tạo lịch học</p>
            </div>
          </div>

          <div className="p-6" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STEPS.map((step, i) => {
              const done = stepDone[step.key]
              return (
                <Link key={i} to={step.to}
                  className="flex items-center gap-3.5 rounded-2xl transition-all duration-150 group"
                  style={{
                    padding: '14px 16px',
                    background: done ? '#f0fdf4' : '#faf8ff',
                    border: `1.5px solid ${done ? '#bbf7d0' : '#ede9fe'}`,
                    textDecoration: 'none',
                  }}>
                  <span className="text-xl shrink-0 leading-none">{step.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base leading-none" style={{ color: done ? '#15803d' : '#1e293b' }}>
                      {step.label}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">{step.desc}</p>
                  </div>
                  {done
                    ? <span className="font-black text-base shrink-0" style={{ color: '#22c55e' }}>✓</span>
                    : <ArrowRight size={15} className="text-violet-300 group-hover:text-violet-500 shrink-0 transition-colors" />
                  }
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── Upcoming exams panel ── */}
        <div className="card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderBottom: '1.5px solid #fde68a' }}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px solid #fde68a' }}>
                <Award size={20} className="text-amber-500" />
              </div>
              <div>
                <h2 className="font-black text-slate-800 text-xl leading-none">Môn thi sắp tới</h2>
                <p className="text-slate-600 text-sm mt-1">Theo dõi thời gian còn lại</p>
              </div>
            </div>
            {sortedExams.length > 0 && (
              <Link to="/exams"
                className="inline-flex items-center gap-1.5 font-bold transition-colors shrink-0"
                style={{ fontSize: 13, color: '#d97706', textDecoration: 'none' }}>
                Xem tất cả <ArrowRight size={13} />
              </Link>
            )}
          </div>

          <div className="p-6">
            {sortedExams.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {sortedExams.slice(0, 4).map((exam) => (
                  <ExamCard key={exam.id} exam={exam} countdown={countdowns[exam.id] ?? null} />
                ))}

                {exams.length > 0 && (
                  <div className="rounded-2xl px-5 py-4 flex items-start gap-3 mt-1"
                    style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
                    <Star size={15} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-amber-800 text-sm">
                      <span className="font-semibold">Mẹo:</span>{' '}
                      Ôn bài theo chu kỳ lặp lại (spaced repetition) giúp ghi nhớ tốt hơn 70%.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-14 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: '#f0ebff' }}>
                  <BookOpen size={24} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 text-base mb-1">Chưa có môn thi nào</h3>
                  <p className="text-slate-400 text-sm">Thêm môn thi đầu tiên để bắt đầu lên kế hoạch.</p>
                </div>
                <Link to="/exams" className="btn btn-primary" style={{ textDecoration: 'none', borderRadius: 10, padding: '10px 22px' }}>
                  <BookOpen size={14} /> Thêm môn thi
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
