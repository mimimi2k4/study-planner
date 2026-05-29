import React from 'react';
import { Plus, Pencil, X, AlertCircle, CheckSquare, AlignLeft, Layers } from 'lucide-react';
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
  { value: 'multiple_choice' as const, label: 'Trắc nghiệm', icon: CheckSquare },
  { value: 'essay'           as const, label: 'Tự luận',     icon: AlignLeft },
  { value: 'combined'        as const, label: 'Kết hợp',     icon: Layers },
];

export default function ExamInputForm({ form, errors, editingId, set, handleSubmit, handleCancel }: ExamInputFormProps) {
  const score = Number(form.targetScore);

  return (
    <div className="card rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-200">
      {/* Header */}
      <div className="px-7 py-5 flex items-center justify-between gap-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 ${editingId ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
            {editingId ? <Pencil size={20} /> : <Plus size={20} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-none">
              {editingId ? 'Chỉnh sửa môn thi' : 'Thêm môn thi mới'}
            </h3>
            <p className="text-slate-500 font-medium text-sm mt-0.5">
              {editingId ? 'Cập nhật thông tin bên dưới.' : 'Điền thông tin bên dưới nhé!'}
            </p>
          </div>
        </div>
        {editingId && (
          <button type="button" onClick={handleCancel}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
            <X size={15} /> Huỷ
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-7 flex flex-col gap-7">

        {/* Subject name */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tên môn thi *
          </label>
          <input type="text" value={form.subjectName} onChange={(e) => set('subjectName', e.target.value)}
            placeholder="VD: Toán cao cấp, Lập trình web..."
            className={`h-12 px-4 rounded-xl border outline-none text-[15px] transition-colors ${errors.subjectName ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-slate-300 focus:border-emerald-500 bg-slate-50 focus:bg-white'}`} />
          {errors.subjectName && (
            <p className="text-xs font-medium text-red-500 flex items-center gap-1.5 mt-0.5">
              <AlertCircle size={13} /> {errors.subjectName}
            </p>
          )}
        </div>

        {/* Date + Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ngày giờ thi *
            </label>
            <input type="datetime-local" value={form.examDateTime}
              onChange={(e) => set('examDateTime', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className={`h-12 px-4 rounded-xl border outline-none text-[14px] font-medium transition-colors ${errors.examDateTime ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-slate-300 focus:border-emerald-500 bg-slate-50 focus:bg-white'}`} />
            {errors.examDateTime && (
              <p className="text-xs font-medium text-red-500 flex items-center gap-1.5 mt-0.5">
                <AlertCircle size={13} /> {errors.examDateTime}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Hình thức thi
            </label>
            <div className="flex gap-2 h-12">
              {FORMAT_OPTIONS.map((opt) => {
                const active = form.examFormat === opt.value;
                const Icon = opt.icon;
                return (
                  <button key={opt.value} type="button" onClick={() => set('examFormat', opt.value)}
                    className={`flex-1 rounded-xl text-[13px] font-bold border transition-all flex items-center justify-center gap-2 ${active ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100'}`}>
                    <Icon size={16} className={active ? 'text-emerald-600' : 'text-slate-400'} />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            Điểm mục tiêu —
            <span className="normal-case text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {form.targetScore}/10
            </span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => {
              const active = score === v;
              return (
                <button key={v} type="button" onClick={() => set('targetScore', String(v))}
                  className={`h-12 rounded-xl font-black text-[16px] border transition-all ${active ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}>
                  {v}
                </button>
              )
            })}
          </div>
          {errors.targetScore && (
            <p className="text-xs font-medium text-red-500 flex items-center gap-1.5 mt-0.5">
              <AlertCircle size={13} /> {errors.targetScore}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full justify-center text-[15px] h-[52px] rounded-xl font-bold mt-2 shadow-sm">
          {editingId ? <><Pencil size={17} /> Cập nhật môn thi</> : <><Plus size={18} /> Thêm môn thi</>}
        </button>
      </form>
    </div>
  );
}
