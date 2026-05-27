import type { TimetableSlot } from '../../types'
import TimetableCard from './TimetableCard'

const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

function formatVietnameseDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const dayName = DAY_NAMES[d.getDay()]
  const [y, m, day] = dateStr.split('-')
  return `${dayName}, ${day}/${m}/${y}`
}

interface Props {
  date: string
  slots: TimetableSlot[]
}

export default function TimetableDay({ date, slots }: Props) {
  const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div
        className="px-6 py-4 border-b border-slate-100"
        style={{ background: '#faf8ff' }}
      >
        <h3 className="font-bold text-slate-800 text-base">
          {formatVietnameseDate(date)}
        </h3>
      </div>

      <div className="relative px-6 py-5">
        <div className="absolute left-[103px] top-0 bottom-0 w-0.5 bg-slate-200" />

        <div className="space-y-5">
          {sorted.map((slot, idx) => {
            const key = `${slot.date}-${slot.startTime}-${slot.endTime}-${slot.taskName}-${idx}`
            return (
              <div key={key} className="relative flex items-start">
                <div className="w-20 shrink-0 text-right pt-1.5">
                  <span className="text-xs font-bold text-slate-500">
                    {slot.startTime}
                  </span>
                </div>

                <div
                  className="absolute left-[97px] w-3.5 h-3.5 rounded-full border-2 border-white z-10"
                  style={{ background: slot.color, marginTop: '5px' }}
                />

                <div className="ml-9 flex-1">
                  <TimetableCard slot={slot} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
