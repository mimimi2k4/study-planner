import { Pencil, Trash2, Calendar, Target, Flag, Info, Plus } from "lucide-react";
import type { ExamInfo, Milestone, ExamCountdownResult } from "../../types";

interface ExamListProps {
    exams: ExamInfo[];
    countdowns: Record<string, ExamCountdownResult>;
    milestones: Milestone[];
    editingId: string | null;
    handleEdit: (exam: ExamInfo) => void;
    onDelete: (id: string) => void;
    handleGenerateMilestones: (exam: ExamInfo) => void;
    milestoneMessage: { examId: string; type: "error" | "success"; text: string } | null;
}

export default function ExamList({
    exams,
    countdowns,
    milestones,
    editingId,
    handleEdit,
    onDelete,
    handleGenerateMilestones,
    milestoneMessage,
}: ExamListProps) {
    if (exams.length === 0) {
        return (
            <div className="card rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
                <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-100 mb-5">
                        <Info size={32} className="text-slate-400" />
                    </div>
                    <p className="text-slate-800 font-bold text-lg mb-2">Chưa có môn thi nào</p>
                    <p className="text-slate-500 text-sm font-medium">
                        Bắt đầu bằng cách thêm môn thi đầu tiên ở form bên cạnh.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {exams.map((exam) => {
                const isEditing = editingId === exam.id;
                const examMilestones = milestones.filter((m) => m.subjectId === exam.id);
                return (
                    <div
                        key={exam.id}
                        className="card rounded-2xl overflow-hidden bg-white shadow-sm border transition-all"
                        style={{
                            borderColor: isEditing ? "#059669" : "#e2e8f0",
                            boxShadow: isEditing ? "0 0 0 1px #059669" : undefined,
                        }}
                    >
                        {/* Header */}
                        <div className="px-6 py-5 flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                                    style={{
                                        background: `${exam.color}15`,
                                        borderColor: `${exam.color}30`,
                                        color: exam.color,
                                    }}
                                >
                                    <Calendar size={20} />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <h3 className="font-bold text-slate-800 text-lg truncate leading-tight mb-1">
                                        {exam.subjectName}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                                            <Target size={15} />
                                            Mục tiêu:{" "}
                                            <span className="font-bold text-slate-700">
                                                {exam.targetScore}/10
                                            </span>
                                        </div>
                                        {countdowns[exam.id] && (
                                            <div
                                                className={`px-2 py-0.5 rounded border text-xs font-bold ${countdowns[exam.id].daysLeft < 7 ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}
                                            >
                                                {countdowns[exam.id].isOverdue
                                                    ? "Đã qua hạn"
                                                    : `Còn ${countdowns[exam.id].daysLeft} ngày`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleEdit(exam)}
                                    className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100"
                                    title="Sửa"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => onDelete(exam.id)}
                                    className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"
                                    title="Xoá"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Info details */}
                        <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-slate-100 bg-white">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Hình thức
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                    {exam.examFormat === "multiple_choice"
                                        ? "Trắc nghiệm"
                                        : exam.examFormat === "essay"
                                          ? "Tự luận"
                                          : "Trắc nghiệm + Tự luận"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Thời gian
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                    {new Date(exam.examDateTime).toLocaleString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Milestones */}
                        <div className="px-6 py-5 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Flag size={16} className="text-emerald-500" /> Cột mốc ôn tập
                                </h4>
                                <button
                                    onClick={() => handleGenerateMilestones(exam)}
                                    disabled={editingId !== null}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all disabled:opacity-50"
                                >
                                    <Plus size={16} /> Tạo mốc
                                </button>
                            </div>

                            {/* Inline Message */}
                            {milestoneMessage &&
                                milestoneMessage.examId === exam.id &&
                                editingId === null && (
                                    <div
                                        className={`text-sm font-semibold mb-4 px-4 py-3 rounded-xl ${milestoneMessage.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}
                                    >
                                        {milestoneMessage.text}
                                    </div>
                                )}

                            {examMilestones.length === 0 ? (
                                <p className="text-sm text-slate-500 font-medium">
                                    Chưa có cột mốc nào.
                                </p>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                                    {examMilestones.map((m) => (
                                        <div
                                            key={m.milestoneId}
                                            className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors"
                                        >
                                            <span
                                                className="shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-lg text-white shadow-sm"
                                                style={{ background: exam.color }}
                                            >
                                                {new Date(m.deadlineDate).toLocaleDateString(
                                                    "vi-VN",
                                                    { day: "2-digit", month: "2-digit" }
                                                )}
                                            </span>
                                            <span className="font-semibold text-sm text-slate-800 truncate">
                                                {m.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
