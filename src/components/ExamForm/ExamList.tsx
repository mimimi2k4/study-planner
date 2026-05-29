import React from 'react';
import { Pencil, Trash2, Clock, Target, Flag } from 'lucide-react';
import type { ExamInfo, Milestone, ExamCountdownResult } from '../../types';

interface ExamListProps {
  exams: ExamInfo[];
  countdowns: Record<string, ExamCountdownResult>;
  editingId: string | null;
  milestones: Milestone[];
  milestoneMessage: { examId: string; type: 'error' | 'success', text: string } | null;
  handleEdit: (exam: ExamInfo) => void;
  onDelete: (id: string) => void;
  handleGenerateMilestones: (exam: ExamInfo) => void;
}

export default function ExamList({
  exams, countdowns, editingId, milestones, milestoneMessage, handleEdit, onDelete, handleGenerateMilestones
}: ExamListProps) {
  return (
    <div className="card rounded-3xl overflow-hidden min-h-[120px] bg-white shadow-sm border border-slate-100">
      {/* Panel header */}
      <div className="px-7 py-5 flex items-center justify-between bg-gradient-to-br from-violet-50 to-violet-100 border-b-2 border-violet-200">
        <div>
          <h2 className="font-black text-slate-800 text-xl leading-none">Danh sách môn thi</h2>
          <p className="text-slate-500 text-sm mt-1">
            {exams.length === 0 ? 'Chưa có môn nào được thêm' : `${exams.length} môn đã thêm`}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-600/30">
          {exams.length}
        </div>
      </div>

      <div className="p-5">
        {exams.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <div className="text-4xl animate-float">📚</div>
            <p className="text-slate-500 text-base font-semibold">Chưa có môn thi nào</p>
            <p className="text-slate-400 text-sm">Điền form bên trái để thêm nào!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {exams.map((exam) => {
              const cd = countdowns[exam.id];
              const isEditing = editingId === exam.id;
              
              // We use inline styles sparingly here for dynamic colors (exam.color) 
              // which Tailwind can't compute natively without arbitrary values.
              return (
                <div key={exam.id}
                  className="rounded-2xl overflow-hidden flex group transition-all duration-150 bg-white"
                  style={{
                    border: isEditing
                      ? `2px solid ${exam.color}`
                      : '1.5px solid rgba(139,92,246,0.10)',
                    boxShadow: isEditing
                      ? `0 0 0 3px ${exam.color}22, 0 4px 16px rgba(0,0,0,0.06)`
                      : '0 2px 8px rgba(109,40,217,0.05)',
                  }}>
                  <div className="w-1.5 shrink-0" style={{ background: exam.color }} />

                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-black text-slate-800 leading-snug text-[16px]">
                        {exam.subjectName}
                      </p>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(exam)}
                          className="p-2 rounded-xl transition-all text-violet-400 hover:bg-violet-50 hover:text-violet-600"
                          title="Chỉnh sửa">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => onDelete(exam.id)}
                          className="p-2 rounded-xl transition-all text-slate-300 hover:bg-red-50 hover:text-red-500"
                          title="Xoá">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-medium bg-slate-50 text-slate-600">
                        <Clock size={12} />
                        {new Date(exam.examDateTime).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-bold"
                        style={{ background: exam.color + '15', color: exam.color }}>
                        <Target size={12} />
                        {exam.targetScore}/10
                      </span>
                    </div>

                    {cd && (
                      <div className="mt-3 rounded-xl px-4 py-3"
                        style={{ background: cd.isOverdue ? '#fff1f2' : exam.color + '0e' }}>
                        {cd.isOverdue ? (
                          <p className="text-sm font-semibold text-rose-700">⚠️ Đã qua ngày thi</p>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-[14px]" style={{ color: exam.color }}>
                                Còn {cd.daysLeft} ngày {cd.hoursLeft > 0 ? `${cd.hoursLeft} giờ` : ''}
                              </span>
                              {cd.totalTasks > 0 && (
                                <span className="text-[12px] font-bold" style={{ color: exam.color }}>
                                  {cd.completionRate}% xong
                                </span>
                              )}
                            </div>
                            {cd.totalTasks > 0 && (
                              <div className="h-2 rounded-full" style={{ background: exam.color + '22' }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${cd.completionRate}%`, background: exam.color }} />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Milestones section */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cột mốc ôn tập</p>
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleGenerateMilestones(exam)}
                            className="text-xs font-bold px-2 py-1 rounded-md transition-colors flex items-center gap-1 hover:opacity-80"
                            style={{ color: exam.color, background: exam.color + '1a' }}
                          >
                            <Flag size={12} /> Tạo mốc
                          </button>
                        </div>
                      </div>
                      
                      {/* Inline Message */}
                      {milestoneMessage && milestoneMessage.examId === exam.id && editingId === null && (
                        <div className={`text-[12px] font-medium mb-2 text-right ${milestoneMessage.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {milestoneMessage.text}
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1.5">
                        {milestones.filter(m => m.subjectId === exam.id).length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Chưa có cột mốc nào.</p>
                        ) : (
                          milestones.filter(m => m.subjectId === exam.id).map(m => (
                            <div key={m.milestoneId} className="flex items-center gap-2 text-sm p-1.5 rounded-md bg-slate-50">
                              <span className="shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded text-white" style={{ background: exam.color }}>
                                {new Date(m.deadlineDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                              </span>
                              <span className="font-medium text-slate-700 truncate">{m.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
