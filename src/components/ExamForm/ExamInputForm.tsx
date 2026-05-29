import React from 'react';
import { Plus, Pencil, X, AlertCircle } from 'lucide-react';
import type { ExamFormState, ExamFormErrors } from './types';

interface ExamInputFormProps {
  form: ExamFormState;
  errors: ExamFormErrors;
  editingId: string | null;
  set: (field: keyof ExamFormState, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleCancel: () => void;
}

const FORMAT_OPTIONS = [
  { value: 'multiple_choice' as const, label: 'Trắc nghiệm', emoji: '☑️' },
  { value: 'essay'           as const, label: 'Tự luận',     emoji: '✍️' },
  { value: 'combined'        as const, label: 'Kết hợp',     emoji: '📋' },
];

export default function ExamInputForm({ form, errors, editingId, set, handleSubmit, handleCancel }: ExamInputFormProps) {
  const score = Number(form.targetScore);

  return (
    <div className="card rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-100">
      {/* Header */}
      <div className="px-7 py-5 flex items-center justify-between gap-4 bg-gradient-to-br from-violet-50 to-violet-100 border-b-2 border-violet-200">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 ${editingId ? 'bg-violet-600/10 border-violet-300' : 'bg-white/60 border-violet-200'}`}>
            {editingId ? <Pencil size={20} className="text-violet-600" /> : <Plus size={20} className="text-violet-500" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-none">
              {editingId ? 'Chỉnh sửa môn thi' : 'Thêm môn thi mới'}
            </h3>
            <p className="text-slate-500 text-sm mt-0.5">
              {editingId ? 'Cập nhật thông tin bên dưới.' : 'Điền thông tin bên dưới nhé!'}
            </p>
          </div>
        </div>
        {editingId && (
          <button type="button" onClick={handleCancel}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
            <X size={15} /> Huỷ
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-7 flex flex-col gap-7">

        {/* Subject name */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-violet-600 uppercase tracking-wider">
            Tên môn thi *
          </label>
          <input type="text" value={form.subjectName} onChange={(e) => set('subjectName', e.target.value)}
            placeholder="VD: Toán cao cấp, Lập trình web..."
            className={`h-12 px-4 rounded-xl border-2 outline-none text-[15px] transition-colors ${errors.subjectName ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200 focus:border-violet-400 bg-slate-50/50 focus:bg-white'}`} />
          {errors.subjectName && (
            <p className="text-xs text-red-500 flex items-center gap-1.5 mt-0.5">
              <AlertCircle size={13} /> {errors.subjectName}
            </p>
          )}
        </div>

        {/* Date + Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-violet-600 uppercase tracking-wider">
              Ngày giờ thi *
            </label>
            <input type="datetime-local" value={form.examDateTime}
              onChange={(e) => set('examDateTime', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className={`h-12 px-4 rounded-xl border-2 outline-none text-[14px] transition-colors ${errors.examDateTime ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200 focus:border-violet-400 bg-slate-50/50 focus:bg-white'}`} />
            {errors.examDateTime && (
              <p className="text-xs text-red-500 flex items-center gap-1.5 mt-0.5">
                <AlertCircle size={13} /> {errors.examDateTime}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-violet-600 uppercase tracking-wider">
              Hình thức thi
            </label>
            <div className="flex gap-2 h-12">
              {FORMAT_OPTIONS.map((opt) => {
                const active = form.examFormat === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => set('examFormat', opt.value)}
                    className={`flex-1 rounded-xl text-[13px] font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${active ? 'bg-violet-100 border-violet-500 text-violet-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-violet-300 hover:text-violet-500'}`}>
                    <span className="text-[15px]">{opt.emoji}</span>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-violet-600 uppercase tracking-wider">
            Điểm mục tiêu —{' '}
            <span className="normal-case text-base font-black text-violet-800">
              {form.targetScore}/10 ⭐
            </span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => {
              const active = score === v;
              return (
                <button key={v} type="button" onClick={() => set('targetScore', String(v))}
                  className={`h-14 rounded-2xl font-extrabold text-[17px] border-2 transition-all ${active ? 'bg-gradient-to-br from-violet-600 to-violet-700 border-transparent text-white shadow-lg shadow-violet-500/40 scale-105' : 'bg-slate-50 border-violet-200 text-slate-400 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50'}`}>
                  {v}
                </button>
              )
            })}
          </div>
          {errors.targetScore && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle size={13} /> {errors.targetScore}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full justify-center text-[15px] h-[52px] rounded-2xl font-bold mt-2">
          {editingId ? <><Pencil size={17} /> Cập nhật môn thi</> : <><Plus size={18} /> Thêm môn thi</>}
        </button>
      </form>
    </div>
  );
}
