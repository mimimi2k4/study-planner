import { useState } from "react";
import type { ExamInfo } from "../../types";
import type { ExamFormProps, ExamFormState, ExamFormErrors } from "./types";
import { DEFAULT_EXAM_FORM_STATE, validateExamForm } from "./types";
import { useAllExamsCountdown } from "../../hooks/useExamCountdown";
import { generateMilestones } from "../../logic/milestoneGenerator";

import ExamInputForm from "./ExamInputForm";
import ExamList from "./ExamList";

export interface ExtendedExamFormProps extends ExamFormProps {
    milestones: import("../../types").Milestone[];
    onAddMilestones: (m: import("../../types").Milestone[]) => void;
}

export default function ExamForm({
    exams,
    tasks,
    onAdd,
    onUpdate,
    onDelete,
    milestones,
    onAddMilestones,
}: ExtendedExamFormProps) {
    const [form, setForm] = useState<ExamFormState>(DEFAULT_EXAM_FORM_STATE);
    const [errors, setErrors] = useState<ExamFormErrors>({});
    const [submitted, setSubmitted] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [milestoneMessage, setMilestoneMessage] = useState<{
        examId: string;
        type: "error" | "success";
        text: string;
    } | null>(null);
    const countdowns = useAllExamsCountdown(exams, tasks);

    function handleGenerateMilestones(exam: ExamInfo) {
        const res = generateMilestones(exam.id, exam.examDateTime);
        if (res.success === false) {
            setMilestoneMessage({ examId: exam.id, type: "error", text: "Lỗi: " + res.error });
        } else {
            onAddMilestones(res.milestones);
            setMilestoneMessage({
                examId: exam.id,
                type: "success",
                text: "Tạo mốc ôn tập thành công!",
            });
        }
        setTimeout(() => setMilestoneMessage(null), 3000);
    }

    function set(field: keyof ExamFormState, value: string) {
        const next = { ...form, [field]: value };
        setForm(next);
        if (submitted) setErrors(validateExamForm(next));
    }

    function handleEdit(exam: ExamInfo) {
        setForm({
            subjectName: exam.subjectName,
            examDateTime: exam.examDateTime,
            examFormat: exam.examFormat,
            targetScore: String(exam.targetScore),
        });
        setEditingId(exam.id);
        setErrors({});
        setSubmitted(false);
    }

    function handleCancel() {
        setForm(DEFAULT_EXAM_FORM_STATE);
        setErrors({});
        setSubmitted(false);
        setEditingId(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitted(true);
        const errs = validateExamForm(form);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        if (editingId) {
            onUpdate(editingId, form);
            setEditingId(null);
        } else {
            onAdd(form);
        }
        setForm(DEFAULT_EXAM_FORM_STATE);
        setErrors({});
        setSubmitted(false);
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-7">
            <div className="xl:col-span-3">
                <ExamInputForm
                    form={form}
                    errors={errors}
                    editingId={editingId}
                    set={set}
                    handleSubmit={handleSubmit}
                    handleCancel={handleCancel}
                />
            </div>

            <div className="xl:col-span-2">
                <ExamList
                    exams={exams}
                    countdowns={countdowns}
                    editingId={editingId}
                    milestones={milestones}
                    milestoneMessage={milestoneMessage}
                    handleEdit={handleEdit}
                    onDelete={onDelete}
                    handleGenerateMilestones={handleGenerateMilestones}
                />
            </div>
        </div>
    );
}
