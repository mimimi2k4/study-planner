import { z } from 'zod';

// Basic Enums
export const ExamFormatSchema = z.enum(["multiple_choice", "essay", "combined"]);
export const DifficultyLevelSchema = z.enum(["low", "medium", "high"]);
export const TaskStatusSchema = z.enum(["pending", "in_progress", "completed"]);

export const ExamInfoSchema = z.object({
  id: z.string(),
  subjectName: z.string(),
  examDateTime: z.string(),
  examFormat: ExamFormatSchema,
  targetScore: z.number(),
  color: z.string(),
});

export const ChapterSchema = z.object({
  id: z.string(),
  name: z.string(),
  difficulty: DifficultyLevelSchema,
  importance: DifficultyLevelSchema,
  level: z.number().optional(),
});

export const SyllabusSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  chapters: z.array(ChapterSchema),
});

export const FreeSlotSchema = z.object({
  day: z.number(),
  startTime: z.string(),
  endTime: z.string(),
});

export const StudyTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  chapter: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  estimatedMinutes: z.number(),
  priority: DifficultyLevelSchema,
  status: TaskStatusSchema,
  color: z.string(),
});

export const ScheduleSlotSchema = z.object({
  id: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  taskName: z.string(),
  taskId: z.string(),
  subjectName: z.string(),
  subjectId: z.string(),
  color: z.string(),
  manualEdited: z.boolean().optional(),
});

export const StudyPlanSchema = z.object({
  slots: z.array(ScheduleSlotSchema),
  generatedAt: z.string(),
  manualEdited: z.boolean(),
});

export const MilestoneSchema = z.object({
  milestoneId: z.string(),
  subjectId: z.string(),
  name: z.string(),
  deadlineDate: z.string(),
  status: z.enum(["chưa đạt", "đã đạt"]),
});

// Arrays of objects
export const ExamInfoArraySchema = z.array(ExamInfoSchema);
export const SyllabusArraySchema = z.array(SyllabusSchema);
export const FreeSlotArraySchema = z.array(FreeSlotSchema);
export const StudyTaskArraySchema = z.array(StudyTaskSchema);
export const MilestoneArraySchema = z.array(MilestoneSchema);
