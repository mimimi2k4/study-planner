import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, FileText, Clock, Calendar, CheckSquare, Sparkles } from 'lucide-react'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Tổng quan',  emoji: '🏠' },
  { to: '/exams',     icon: BookOpen,        label: 'Môn thi',    emoji: '📚' },
  { to: '/syllabus',  icon: FileText,        label: 'Đề cương',   emoji: '📝' },
  { to: '/timeslots', icon: Clock,           label: 'Giờ học',    emoji: '⏰' },
  { to: '/schedule',  icon: Calendar,        label: 'Lịch học',   emoji: '📅' },
  { to: '/tasks',     icon: CheckSquare,     label: 'Nhiệm vụ',   emoji: '✅' },
]

export interface SidebarProps { width: number }

export default function Sidebar({ width }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-50"
      style={{
        width,
        background: 'linear-gradient(180deg, #1e0a4e 0%, #2d1270 35%, #3b1f8c 65%, #4c2aad 100%)',
        boxShadow: '4px 0 24px rgba(109,40,217,0.25)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-12 -left-12 w-56 h-56 rounded-full animate-glow"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 right-0 w-40 h-40 rounded-full animate-glow"
          style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.15) 0%, transparent 70%)', animationDelay: '2s' }} />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2.5 px-5 pt-6 pb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.2)' }}>
          🎓
        </div>
        <div className="min-w-0">
          <p className="text-white font-black text-[17px] leading-none truncate">StudyPlanner</p>
          <p className="text-[11px] font-medium mt-0.5 truncate" style={{ color: '#c4b5fd' }}>✨ Ôn thi thông minh</p>
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-10 mx-4 h-px mb-2"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(196,181,253,0.35), transparent)' }} />

      {/* Nav */}
      <nav className="relative z-10 flex-1 px-2.5 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, emoji }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-[14px] transition-all duration-150 ${
                isActive ? 'text-white' : 'text-purple-200 hover:text-white hover:bg-white/[0.07]'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'rgba(255,255,255,0.16)',
              border: '1.5px solid rgba(255,255,255,0.22)',
            } : {}}
          >
            {({ isActive }) => (
              <>
                <span className="text-base leading-none shrink-0 w-5 text-center">{emoji}</span>
                <span className={`truncate ${isActive ? 'font-bold' : ''}`}>{label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-300 shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Motivational card */}
      <div className="relative z-10 mx-2.5 mb-2">
        <div className="rounded-2xl px-3.5 py-3"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.10)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} className="text-yellow-300" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-300">Động lực hôm nay</p>
          </div>
          <p className="text-white/75 text-[12px] leading-relaxed">
            "Mỗi phút ôn bài là một bước gần hơn đến thành công! 💪"
          </p>
        </div>
      </div>

      {/* User */}
      <div className="relative z-10 px-3.5 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
            Hạ
          </div>
          <div className="min-w-0">
            <p className="text-purple-200 text-[12px] mt-0.5 truncate font-semibold">🌟 Học siêng lên nào!</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
