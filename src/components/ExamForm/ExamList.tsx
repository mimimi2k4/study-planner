import React from 'react';
import { Pencil, Trash2, Clock, Target, Flag, BookOpen } from 'lucide-react';
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
    <div className="card rounded-3xl overflow-hidden min-h-[120px] bg-white shadow-sm border border-slate-200">
      {/* Panel header */}
      <div className="px-7 py-5 flex items-center justify-between bg-slate-50 border-b border-slate-100">
        <div>
          <h2 className="font-bold text-slate-900 text-lg leading-tight">Danh sách môn thi</h2>
          <p className="text-slate-500 font-medium text-sm mt-0.5">
            {exams.length === 0 ? 'Chưa có môn nào được thêm' : `${exams.length} môn đã thêm`}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 bg-white border border-slate-200 text-slate-700 shadow-sm">
          {exams.length}
        </div>
      </div>

      <div className="p-6">
        {exams.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400">
                <BookOpen size={24} />
            </div>
            <p className="text-slate-900 text-base font-bold">Chưa có môn thi nào</p>
            <p className="text-slate-500 text-sm font-medium">Điền form bên trái để thêm nào!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {exams.map((exam) => {
              const cd = countdowns[exam.id];
              const isEditing = editingId === exam.id;
              
              return (
                <div key={exam.id}
                  className="rounded-2xl overflow-hidden flex group transition-all duration-150 bg-white"
                  style={{
                    border: isEditing
                      ? `2px solid ${exam.color}`
                      : '1px solid #e2e8f0',
                    boxShadow: isEditing
                      ? `0 0 0 3px ${exam.color}22, 0 4px 16px rgba(0,0,0,0.06)`
                      : '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                  <div className="w-1.5 shrink-0" style={{ background: exam.color }} />

                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold text-slate-900 leading-snug text-[16px]">
                        {exam.subjectName}
                      </p>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(exam)}
                          className="p-1.5 rounded-lg transition-all text-slate-400 hover:bg-slate-100 hover:text-emerald-600 border border-transparent hover:border-slate-200"
                          title="Chỉnh sửa">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => onDelete(exam.id)}
                          className="p-1.5 rounded-lg transition-all text-slate-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100"
                          title="Xoá">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-semibold bg-slate-100 text-slate-700">
                        <Clock size={13} />
                        {new Date(exam.examDateTime).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-bold"
                        style={{ background: exam.color + '15', color: exam.color }}>
                        <Target size={13} />
                        {exam.targetScore}/10
                      </span>
                    </div>

                    {cd && (
                      <div className="mt-4 rounded-xl px-4 py-3 border"
                        style={{ 
                            background: cd.isOverdue ? '#fff1f2' : exam.color + '0a',
                            borderColor: cd.isOverdue ? '#ffe4e6' : exam.color + '20' 
                        }}>
                        {cd.isOverdue ? (
                          <p className="text-sm font-semibold text-rose-600 flex items-center gap-2">⚠️ Đã qua ngày thi</p>
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
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: exam.color + '20' }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${cd.completionRate}%`, background: exam.color }} />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Milestones section */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cột mốc ôn tập</p>
                        <button
                            type="button"
                            onClick={() => handleGenerateMilestones(exam)}
                            className="text-[12px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 hover:opacity-90 border"
                            style={{ color: exam.color, background: exam.color + '10', borderColor: exam.color + '20' }}
                        >
                            <Flag size={13} /> Tạo mốc
                        </button>
                      </div>
                      
                      {/* Inline Message */}
                      {milestoneMessage && milestoneMessage.examId === exam.id && editingId === null && (
                        <div className={`text-[12px] font-semibold mb-2 px-3 py-2 rounded-lg ${milestoneMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                          {milestoneMessage.text}
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        {milestones.filter(m => m.subjectId === exam.id).length === 0 ? (
                          <p className="text-[13px] text-slate-400 font-medium italic">Chưa có cột mốc nào.</p>
                        ) : (
                          milestones.filter(m => m.subjectId === exam.id).map(m => (
                            <div key={m.milestoneId} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-md text-white shadow-sm" style={{ background: exam.color }}>
                                {new Date(m.deadlineDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                              </span>
                              <span className="font-semibold text-[13px] text-slate-700 truncate">{m.name}</span>
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
