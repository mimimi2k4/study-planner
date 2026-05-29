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
            <div className="rounded-xl p-12 text-center bg-slate-50 border border-slate-200 border-dashed">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white border border-slate-200 shadow-sm">
                    <Calendar size={28} className="text-slate-400" />
                </div>
                <p className="text-slate-800 font-bold mb-2">Chưa có lịch học</p>
                <p className="text-slate-500 font-medium text-sm mb-6">Vui lòng thiết lập cấu hình và tạo lịch học tự động.</p>
                <button onClick={onRegenerate} className="btn btn-primary inline-flex items-center gap-2">
                    <RefreshCw size={16} /> Tạo lịch học
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Warnings */}
            {warnings.map((w, i) => (
                <div
                    key={i}
                    className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
                        w.type === "insufficient_time"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <div className="w-full">
                        <p className="font-bold">{w.message}</p>
                        {w.suggestion && (
                            <p className="mt-1 text-xs opacity-90 font-medium">{w.suggestion}</p>
                        )}
                        {w.type === "insufficient_time" && overflow && overflow.length > 0 && (
                            <div className="mt-3 space-y-1.5 border-t border-amber-200/60 pt-3 w-full">
                                <p className="text-xs font-bold uppercase tracking-wider opacity-90">Nhiệm vụ bị thiếu thời gian:</p>
                                <ul className="list-disc pl-4 space-y-1 text-xs opacity-80 font-medium">
                                    {overflow.map((task) => (
                                        <li key={task.id}>
                                            <span className="font-bold">{task.name}</span> ({task.subjectName}) — còn thiếu <span className="font-bold">{task.estimatedMinutes} phút</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Controls */}
            <div className="p-4 flex items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={prevWeek}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 text-slate-500 hover:text-slate-700"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={today}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                        Hôm nay
                    </button>
                    <button
                        onClick={nextWeek}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 text-slate-500 hover:text-slate-700"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
                <span className="text-sm font-bold text-slate-700 tracking-wide">
                    {weekLabel}
                </span>
                <button
                    onClick={onRegenerate}
                    className="btn btn-primary"
                    style={{ padding: "8px 16px", fontSize: 13 }}
                >
                    <RefreshCw size={14} /> Tạo lại lịch
                </button>
            </div>

            {/* Calendar grid */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                {/* Header */}
                <div
                    className="grid border-b border-slate-200 bg-slate-50"
                    style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
                >
                    <div className="border-r border-slate-200" />
                    {weekDates.map((date, i) => {
                        const isToday = date === todayStr;
                        const dayNum = date.slice(8);
                        return (
                            <div
                                key={date}
                                className={`py-3 text-center border-r last:border-r-0 border-slate-200 ${isToday ? "bg-emerald-50/50" : ""}`}
                            >
                                <p className={`text-xs font-bold ${isToday ? "text-emerald-600" : "text-slate-500"}`}>{DAYS[i]}</p>
                                <p
                                    className={`text-sm font-bold mt-1 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                                        isToday ? "bg-emerald-600 text-white" : "text-slate-700"
                                    }`}
                                >
                                    {dayNum.replace(/^0/, "")}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Body */}
                <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
                    <div className="relative bg-white">
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
                                            className="py-2 text-right pr-2 flex items-center justify-end border-r border-slate-200"
                                            style={{
                                                borderBottom: "1px solid #e2e8f0",
                                                height: 48,
                                                background: isEven ? "#f8fafc" : "#ffffff",
                                            }}
                                        >
                                            <span className="text-xs font-bold text-slate-400 tabular-nums">
                                                {String(h).padStart(2, "0")}:00
                                            </span>
                                        </div>
                                        {weekDates.map((date) => (
                                            <div
                                                key={date}
                                                className="border-r last:border-r-0 border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                                                style={{
                                                    borderBottom: "1px solid #e2e8f0",
                                                    height: 48,
                                                    background: isEven ? "#f8fafc" : "#ffffff",
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
                                        className="relative"
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
                                                    className="absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden pointer-events-auto cursor-pointer group transition-all duration-150 border hover:opacity-90 shadow-sm"
                                                    style={{
                                                        top: `${top}%`,
                                                        height: `${Math.max(height, 2)}%`,
                                                        background: hexToRgba(slot.color, 0.08),
                                                        borderColor: hexToRgba(slot.color, 0.3),
                                                        borderLeft: `4px solid ${slot.color}`,
                                                    }}
                                                    title={`${slot.taskName} (${slot.startTime}–${slot.endTime})`}
                                                >
                                                    <p
                                                        className="text-xs font-bold truncate leading-tight"
                                                        style={{ color: slot.color }}
                                                    >
                                                        {slot.taskName}
                                                    </p>
                                                    <p className="text-xs font-medium opacity-80 truncate" style={{ color: slot.color }}>
                                                        {slot.startTime}–{slot.endTime}
                                                    </p>
                                                    <button
                                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs leading-none bg-white rounded-md w-5 h-5 flex items-center justify-center border border-slate-200"
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
                <div className="p-4 flex flex-wrap gap-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    {exams.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <div
                                className="w-3 h-3 rounded-md"
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
