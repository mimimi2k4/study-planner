import type { ExamInfo, ExamFormat, StudyTask } from "../../types";

export interface ExamFormState {
    subjectName: string;
    examDateTime: string;
    examFormat: ExamFormat;
    targetScore: string;
}

export const DEFAULT_EXAM_FORM_STATE: ExamFormState = {
    subjectName: "",
    examDateTime: "",
    examFormat: "multiple_choice",
    targetScore: "8",
};

export interface ExamFormErrors {
    subjectName?: string;
    examDateTime?: string;
    targetScore?: string;
}

export interface ExamFormProps {
    exams: ExamInfo[];
    tasks: StudyTask[];
    onAdd: (state: ExamFormState) => void;
    onUpdate: (id: string, state: ExamFormState) => void;
    onDelete: (id: string) => void;
}

export function validateExamForm(f: ExamFormState): ExamFormErrors {
    const e: ExamFormErrors = {};
    if (!f.subjectName.trim()) e.subjectName = "Vui lòng nhập tên môn thi";
    if (!f.examDateTime) e.examDateTime = "Vui lòng chọn ngày giờ thi";
    else if (new Date(f.examDateTime) <= new Date())
        e.examDateTime = "Ngày thi phải là ngày trong tương lai";
    const s = Number(f.targetScore);
    if (isNaN(s) || s < 0 || s > 10) e.targetScore = "Điểm mục tiêu phải từ 0 đến 10";
    return e;
}
