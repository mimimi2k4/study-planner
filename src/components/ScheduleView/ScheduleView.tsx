import { useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Calendar, AlertTriangle } from 'lucide-react'
import { hexToRgba } from '../../utils/colors'
import { getWeekStart, formatDate, addDays, timeToFraction, slotHeightPercent } from '../../utils/schedule'
import type { ScheduleViewProps } from './types'

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6:00–23:00

export default function ScheduleView({ slots, exams, warnings, onRegenerate, onSlotsChange }: ScheduleViewProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))

  const weekDates = Array.from({ length: 7 }, (_, i) => formatDate(addDays(weekStart, i)))

  const prevWeek = () => setWeekStart((d) => addDays(d, -7))
  const nextWeek = () => setWeekStart((d) => addDays(d, 7))
  const today = () => setWeekStart(getWeekStart(new Date()))

  const todayStr = formatDate(new Date())

  function handleDeleteSlot(slotId: string) {
    onSlotsChange(slots.filter((s) => s.id !== slotId))
  }

  const weekLabel = `${weekDates[0].slice(8)}.${weekDates[0].slice(5, 7)} – ${weekDates[6].slice(8)}.${weekDates[6].slice(5, 7)}.${weekDates[6].slice(0, 4)}`

  if (slots.length === 0 && warnings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
        <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">Chưa có lịch học. Vui lòng nhập thông tin cần thiết và nhấn <strong>Tạo lịch</strong>.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Warnings */}
      {warnings.map((w, i) => (
        <div key={i} className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
          w.type === 'insufficient_time' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-700'
        }`}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{w.message}</p>
            {w.suggestion && <p className="mt-0.5 text-xs opacity-80">{w.suggestion}</p>}
          </div>
        </div>
      ))}

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
        <button onClick={prevWeek} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <button onClick={today} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Hôm nay
        </button>
        <span className="flex-1 text-center text-sm font-semibold text-slate-700">{weekLabel}</span>
        <button onClick={nextWeek} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronRight size={18} className="text-slate-600" />
        </button>
        <button
          onClick={onRegenerate}
          className="ml-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw size={13} /> Tạo lại lịch
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          <div />
          {weekDates.map((date, i) => {
            const isToday = date === todayStr
            const dayNum = date.slice(8)
            return (
              <div key={date} className={`py-3 text-center border-l border-slate-100 ${isToday ? 'bg-indigo-50' : ''}`}>
                <p className="text-xs text-slate-500">{DAYS[i]}</p>
                <p className={`text-sm font-semibold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                  isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'
                }`}>
                  {dayNum.replace(/^0/, '')}
                </p>
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
          <div className="relative" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
            {/* Time labels + grid lines */}
            <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
              {HOURS.map((h) => (
                <div key={h} className="contents">
                  <div className="py-2 text-right pr-2 border-b border-slate-100">
                    <span className="text-[10px] font-medium text-slate-400">{String(h).padStart(2, '0')}:00</span>
                  </div>
                  {weekDates.map((date) => (
                    <div key={date} className="border-l border-b border-slate-100 h-10" />
                  ))}
                </div>
              ))}
            </div>

            {/* Events overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ gridTemplateColumns: '56px repeat(7, 1fr)', display: 'grid' }}
            >
              <div />
              {weekDates.map((date, _colIdx) => {
                const daySlots = slots.filter((s) => s.date === date)
                return (
                  <div key={date} className="relative border-l border-transparent">
                    {daySlots.map((slot) => {
                      const top = timeToFraction(slot.startTime) * 100
                      const height = slotHeightPercent(slot.startTime, slot.endTime)
                      return (
                        <div
                          key={slot.id}
                          className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 overflow-hidden pointer-events-auto cursor-pointer group"
                          style={{
                            top: `${top}%`,
                            height: `${Math.max(height, 2)}%`,
                            background: hexToRgba(slot.color, 0.15),
                            borderLeft: `3px solid ${slot.color}`,
                          }}
                          title={`${slot.taskName} (${slot.startTime}–${slot.endTime})`}
                        >
                          <p
                            className="text-[10px] font-semibold truncate leading-tight"
                            style={{ color: slot.color }}
                          >
                            {slot.taskName}
                          </p>
                          <p className="text-[9px] text-slate-500 truncate">
                            {slot.startTime}–{slot.endTime}
                          </p>
                          <button
                            className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity text-[10px] leading-none"
                            onClick={() => handleDeleteSlot(slot.id)}
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {exams.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-3">
          {exams.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-3 h-3 rounded-full" style={{ background: e.color }} />
              {e.subjectName}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
