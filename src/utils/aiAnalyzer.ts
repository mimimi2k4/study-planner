import type { Syllabus, StudyTask, DifficultyLevel } from "../types";
import { nanoid } from "../utils/nanoid";

const MINUTES_BY_DIFFICULTY: Record<DifficultyLevel, number> = {
    low: 40,
    medium: 70,
    high: 110,
};

const PRIORITY_MATRIX: Record<string, DifficultyLevel> = {
    "high-high": "high",
    "high-medium": "high",
    "high-low": "medium",
    "medium-high": "high",
    "medium-medium": "medium",
    "medium-low": "low",
    "low-high": "medium",
    "low-medium": "low",
    "low-low": "low",
};

export function analyzeAndGenerateTasks(
    syllabuses: Syllabus[],
    examSubjectMap: Record<string, string>
): StudyTask[] {
    const tasks: StudyTask[] = [];

    for (const syllabus of syllabuses) {
        for (const chapter of syllabus.chapters) {
            const key = `${chapter.difficulty}-${chapter.importance}`;
            const priority: DifficultyLevel = PRIORITY_MATRIX[key] ?? "medium";
            const estimatedMinutes = MINUTES_BY_DIFFICULTY[chapter.difficulty];
            const color = examSubjectMap[syllabus.subjectId] ?? "#4f46e5";

            tasks.push({
                id: nanoid(),
                name: `Ôn tập: ${chapter.name}`,
                chapter: chapter.name,
                subjectId: syllabus.subjectId,
                subjectName: syllabus.subjectName,
                estimatedMinutes,
                priority,
                status: "pending",
                color,
            });
        }
    }

    // Sort: high priority first, then medium, then low
    const order: Record<DifficultyLevel, number> = { high: 0, medium: 1, low: 2 };
    return tasks.sort((a, b) => order[a.priority] - order[b.priority]);
}
