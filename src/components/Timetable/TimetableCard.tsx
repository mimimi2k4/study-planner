import type { TimetableSlot } from '../../types'
import { Clock, BookOpen } from 'lucide-react'
import { hexToRgba } from '../../utils/colors'

interface Props {
  slot: TimetableSlot
}

function calcMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatDuration(start: string, end: string): string {
  const diff = calcMinutes(end) - calcMinutes(start)
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h === 0) return `${m} phút`
  if (m === 0) return `${h} giờ`
  return `${h}g${m}p`
}

export default function TimetableCard({ slot }: Props) {
  return (
    <div
      className="rounded-xl p-4 transition-shadow hover:shadow-md"
      style={{
        background: hexToRgba(slot.color, 0.06),
        borderLeft: `4px solid ${slot.color}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-slate-800 truncate">
            {slot.taskName}
          </h4>
          <span
            className="inline-flex items-center gap-1 text-xs font-medium mt-1"
            style={{ color: slot.color }}
          >
            <BookOpen size={12} />
            {slot.subjectName}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0 whitespace-nowrap">
          <Clock size={12} />
          {slot.startTime}–{slot.endTime}
          <span className="text-slate-300">({formatDuration(slot.startTime, slot.endTime)})</span>
        </span>
      </div>
    </div>
  )
}
