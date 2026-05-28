import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Calendar, AlertTriangle } from "lucide-react";
import { hexToRgba } from "../../utils/colors";
import {
    getWeekStart,
    formatDate,
    addDays,
    timeToFraction,
    slotHeightPercent,
} from "../../utils/schedule";
import type { ScheduleViewProps } from "./types";
import type { ScheduleSlot } from "../../types";
import AddTaskModal from "./AddTaskModal";

const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00–23:00

export default function ScheduleView({
    slots,
    exams,
    warnings,
    overflow = [],
    tasks,
    onRegenerate,
    onSlotsChange,
    onDispatch,
}: ScheduleViewProps) {
    const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));

    const weekDates = Array.from({ length: 7 }, (_, i) => formatDate(addDays(weekStart, i)));

    const prevWeek = () => setWeekStart((d) => addDays(d, -7));
    const nextWeek = () => setWeekStart((d) => addDays(d, 7));
    const today = () => setWeekStart(getWeekStart(new Date()));

    const todayStr = formatDate(new Date());

    function handleDeleteSlot(slotId: string) {
        // Ưu tiên dùng dispatch để đi qua executePlanAction (pure, có validate)
        if (onDispatch) {
            onDispatch({ action: "delete_task", payload: { slotId } });
        } else {
            onSlotsChange(slots.filter((s) => s.id !== slotId));
        }
    }

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{date: string, time: string}>({date: "", time: "00:00"});

    function parseTime(t: string): number {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    }

    function handleCellClick(date: string, hour: number) {
        setSelectedCell({ date, time: `${String(hour).padStart(2, "0")}:00` });
        setModalOpen(true);
    }

    function handleDragStart(e: React.DragEvent, slot: ScheduleSlot) {
        e.dataTransfer.setData("text/plain", slot.id);
        const durationMinutes = parseTime(slot.endTime) - parseTime(slot.startTime);
        e.dataTransfer.setData("application/json", JSON.stringify({ durationMinutes }));
    }

    function handleDrop(e: React.DragEvent, targetDate: string, targetHour: number) {
        e.preventDefault();
        const slotId = e.dataTransfer.getData("text/plain");
        if (!slotId) return;

        const dataStr = e.dataTransfer.getData("application/json");
        const data = dataStr ? JSON.parse(dataStr) : null;
        const durationMinutes = data?.durationMinutes ?? 60;

        const newStartTime = `${String(targetHour).padStart(2, "0")}:00`;
        const endMin = targetHour * 60 + durationMinutes;
        const newEndTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

        if (onDispatch) {
            onDispatch({
                action: "move_task",
                payload: { slotId, newDate: targetDate, newStartTime, newEndTime }
            });
        }
    }

    const weekLabel = `${weekDates[0].slice(8)}.${weekDates[0].slice(5, 7)} – ${weekDates[6].slice(8)}.${weekDates[6].slice(5, 7)}.${weekDates[6].slice(0, 4)}`;

  if (slots.length === 0 && warnings.length === 0) {
    return (
      <div
        className="rounded-xl p-12 text-center"
        style={{
          background: "linear-gradient(135deg, #f8f6ff, #f0edff)",
          border: "1.5px dashed #d5ccff",
        }}
      >
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
          }}
        >
          <Calendar size={28} className="text-white" />
        </div>
        <p className="text-slate-600 font-semibold mb-2">Chưa có lịch học</p>
        <p className="text-slate-400 text-sm mb-6">Vui lòng nhập thông tin cần thiết và tạo lịch</p>
        <button
          onClick={onRegenerate}
          className="btn btn-primary"
        >
          <RefreshCw size={14} /> Tạo lịch học
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
            {/* Warnings */}
            {warnings.map((w, i) => (
                <div
                    key={i}
                    className={`flex items-start gap-3 p-4 rounded-lg text-sm ${
                        w.type === "insufficient_time"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <div className="w-full">
                        <p className="font-semibold">{w.message}</p>
                        {w.suggestion && (
                            <p className="mt-0.5 text-xs opacity-80">{w.suggestion}</p>
                        )}
                        {w.type === "insufficient_time" && overflow && overflow.length > 0 && (
                            <div className="mt-3 space-y-1.5 border-t border-amber-200/50 pt-2.5 w-full">
                                <p className="text-xs font-bold uppercase tracking-wide opacity-90">Nhiệm vụ bị thiếu thời gian:</p>
                                <ul className="list-disc pl-4 space-y-1 text-xs opacity-80">
                                    {overflow.map((task) => (
                                        <li key={task.id}>
                                            <span className="font-semibold">{task.name}</span> ({task.subjectName}) — còn thiếu <span className="font-bold">{task.estimatedMinutes} phút</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Controls */}
            <div
              className="p-4 flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
                borderRadius: 14,
                border: "1px solid rgba(226,232,240,0.8)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
                <div className="flex items-center gap-1">
                  <button
                      onClick={prevWeek}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                      <ChevronLeft size={18} className="text-slate-500" />
                  </button>
                  <button
                      onClick={today}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      style={{ border: "1px solid #e0e7ff" }}
                  >
                      Hôm nay
                  </button>
                  <button
                      onClick={nextWeek}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                      <ChevronRight size={18} className="text-slate-500" />
                  </button>
                </div>
                <span className="flex-1 text-center text-sm font-bold text-slate-600 tracking-wide">
                    {weekLabel}
                </span>
                <button
                    onClick={onRegenerate}
                    className="btn btn-primary"
                    style={{ padding: "9px 18px", fontSize: 12 }}
                >
                    <RefreshCw size={13} /> Tạo lại lịch
                </button>
            </div>

            {/* Calendar grid */}
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(226,232,240,0.8)",
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
                {/* Header */}
                <div
                    className="grid border-b border-slate-100"
                    style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
                >
                    <div />
                    {weekDates.map((date, i) => {
                        const isToday = date === todayStr;
                        const dayNum = date.slice(8);
                        return (
                            <div
                                key={date}
                                className={`py-3 text-center border-l border-slate-100 ${isToday ? "bg-indigo-50/60" : ""}`}
                            >
                                <p className="text-xs text-slate-400 font-semibold">{DAYS[i]}</p>
                                <p
                                    className={`text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                                        isToday ? "bg-indigo-600 text-white shadow-sm" : "text-slate-700"
                                    }`}
                                >
                                    {dayNum.replace(/^0/, "")}
                                </p>
                                {isToday && (
                                  <div className="h-0.5 w-6 mx-auto mt-1 rounded-full bg-indigo-600" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Body */}
                <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
                    <div className="relative">
                        {/* Time labels + grid lines */}
                        <div
                            className="grid"
                            style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
                        >
                            {HOURS.map((h) => {
                              const isEven = h % 2 === 0;
                              return (
                                <div key={h} className="contents">
                                    <div
                                      className="py-2 text-right pr-2 flex items-center justify-end"
                                      style={{
                                        borderBottom: "1px solid rgba(226,232,240,0.8)",
                                        height: 40,
                                        background: isEven ? "rgba(248,250,252,0.5)" : undefined,
                                      }}
                                    >
                                        <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                                            {String(h).padStart(2, "0")}:00
                                        </span>
                                    </div>
                                    {weekDates.map((date) => (
                                        <div
                                            key={date}
                                            className="border-l hover:bg-indigo-50/30 cursor-pointer transition-colors"
                                            style={{
                                              borderBottom: "1px solid rgba(226,232,240,0.8)",
                                              height: 40,
                                              background: isEven ? "rgba(248,250,252,0.5)" : undefined,
                                            }}
                                            onClick={() => handleCellClick(date, h)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, date, h)}
                                        />
                                    ))}
                                </div>
                              );
                            })}
                        </div>

                        {/* Events overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ gridTemplateColumns: "56px repeat(7, 1fr)", display: "grid" }}
                        >
                            <div />
                            {weekDates.map((date, _colIdx) => {
                                const daySlots = slots.filter((s) => s.date === date);
                                return (
                                    <div
                                        key={date}
                                        className="relative border-l border-transparent"
                                    >
                                        {daySlots.map((slot) => {
                                            const top = timeToFraction(slot.startTime) * 100;
                                            const height = slotHeightPercent(
                                                slot.startTime,
                                                slot.endTime
                                            );
                                            return (
                                                <div
                                                    key={slot.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, slot)}
                                                    className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 overflow-hidden pointer-events-auto cursor-pointer group transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
                                                    style={{
                                                        top: `${top}%`,
                                                        height: `${Math.max(height, 2)}%`,
                                                        background: hexToRgba(slot.color, 0.12),
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
                                                    <p className="text-[9px] text-slate-400 truncate">
                                                        {slot.startTime}–{slot.endTime}
                                                    </p>
                                                    <button
                                                        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity text-[10px] leading-none bg-white/80 rounded-full w-4 h-4 flex items-center justify-center"
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            {exams.length > 0 && (
                <div
                  className="p-4 flex flex-wrap gap-3"
                  style={{
                    borderRadius: 14,
                    border: "1px solid rgba(226,232,240,0.8)",
                    background: "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  }}
                >
                    {exams.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <div
                              className="w-3 h-3 rounded-full shadow-sm"
                              style={{ background: e.color }}
                            />
                            {e.subjectName}
                        </div>
                    ))}
                </div>
            )}
            {/* Modal */}
            <AddTaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                tasks={tasks}
                selectedDate={selectedCell.date}
                selectedStartTime={selectedCell.time}
                onSave={(taskId, date, startTime, endTime) => {
                    if (onDispatch) {
                        onDispatch({ action: "add_task", payload: { taskId, date, startTime, endTime } });
                    }
                }}
            />
        </div>
    );
}
