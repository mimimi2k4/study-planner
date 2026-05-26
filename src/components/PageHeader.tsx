import type { ReactNode } from 'react'

export interface PageHeaderProps {
  emoji: string
  title: string
  subtitle: string
  action?: ReactNode
}

export default function PageHeader({ emoji, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: 'linear-gradient(135deg, #f5f0ff, #ede9fe)', border: '1.5px solid #ddd6fe' }}>
          {emoji}
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 leading-tight">{title}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
