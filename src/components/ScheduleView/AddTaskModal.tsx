import { useState, useEffect } from "react";
import type { StudyTask } from "../../types";

export interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: StudyTask[];
    selectedDate: string;
    selectedStartTime: string;
    onSave: (taskId: string, date: string, startTime: string, endTime: string) => void;
}

function parseTime(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function formatTime(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function AddTaskModal({
    isOpen,
    onClose,
    tasks,
    selectedDate,
    selectedStartTime,
    onSave,
}: AddTaskModalProps) {
    const [taskId, setTaskId] = useState("");
    const [duration, setDuration] = useState(60);

    // Reset form when opened
    useEffect(() => {
        if (isOpen) {
            setTaskId("");
            setDuration(60);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!taskId) {
            alert("Vui lòng chọn nhiệm vụ");
            return;
        }
        if (duration <= 0) {
            alert("Thời lượng phải lớn hơn 0");
            return;
        }

        const startMin = parseTime(selectedStartTime);
        const endMin = startMin + duration;
        const endTime = formatTime(endMin);

        onSave(taskId, selectedDate, selectedStartTime, endTime);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
                style={{ border: "1px solid rgba(226,232,240,0.8)" }}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-800">Thêm nhiệm vụ thủ công</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-600 mb-2">
                            Thông tin thời gian
                        </p>
                        <p className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                            Ngày: {selectedDate.split("-").reverse().join("/")} - Bắt đầu:{" "}
                            {selectedStartTime}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Chọn nhiệm vụ cần học
                        </label>
                        <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
                            value={taskId}
                            onChange={(e) => setTaskId(e.target.value)}
                        >
                            <option value="">-- Chọn nhiệm vụ --</option>
                            {tasks.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.subjectName}: {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Thời lượng (phút)
                        </label>
                        <input
                            type="number"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            min="5"
                            step="5"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        Thêm vào lịch
                    </button>
                </div>
            </div>
        </div>
    );
}
