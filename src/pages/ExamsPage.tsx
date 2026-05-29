import type { ExamInfo, StudyTask } from "../types";
import type { ExamFormState } from "../components/ExamForm/types";
import ExamForm from "../components/ExamForm/ExamForm";
import PageHeader from "../components/PageHeader";
import { nanoid } from "../utils/nanoid";
import { getSubjectColor } from "../utils/colors";

export interface ExamsPageProps {
    exams: ExamInfo[];
    tasks: StudyTask[];
    onAdd: (exam: ExamInfo) => void;
    onUpdate: (exam: ExamInfo) => void;
    onDelete: (id: string) => void;
    milestones: import("../types").Milestone[];
    onAddMilestones: (m: import("../types").Milestone[]) => void;
}

export default function ExamsPage({ exams, tasks, milestones, onAdd, onUpdate, onDelete, onAddMilestones }: ExamsPageProps) {
    function handleAdd(state: ExamFormState) {
        onAdd({
            id: nanoid(),
            subjectName: state.subjectName.trim(),
            examDateTime: state.examDateTime,
            examFormat: state.examFormat,
            targetScore: Number(state.targetScore),
            color: getSubjectColor(exams.length),
        });
    }

    function handleUpdate(id: string, state: ExamFormState) {
        const existing = exams.find((e) => e.id === id)!;
        onUpdate({
            id,
            subjectName: state.subjectName.trim(),
            examDateTime: state.examDateTime,
            examFormat: state.examFormat,
            targetScore: Number(state.targetScore),
            color: existing.color,
        });
    }

    return (
        <div className="space-y-8">
            <PageHeader
                emoji="📚"
                title="Môn thi"
                subtitle="Thêm môn thi, ngày thi và điểm mục tiêu của bạn"
            />
            <ExamForm
                exams={exams}
                tasks={tasks}
                onAdd={handleAdd}
                onUpdate={handleUpdate}
                onDelete={onDelete}
                milestones={milestones}
                onAddMilestones={onAddMilestones}
            />
        </div>
    );
}
