import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./components/Layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import ExamsPage from "./pages/ExamsPage";
import SyllabusPage from "./pages/SyllabusPage";
import TimeSlotPage from "./pages/TimeSlotPage";
import SchedulePage from "./pages/SchedulePage";
import TasksPage from "./pages/TasksPage";
import type { ExamInfo, Syllabus, FreeSlot, StudyTask, StudyPlan } from "./types";
import {
  getExams,
  saveExams,
  getSyllabuses,
  saveSyllabuses,
  getFreeSlots,
  saveFreeSlots,
  getTasks,
  saveTasks,
  getPlan,
  savePlan,
} from "./utils/storage";
import { totalHours } from "./utils/timeSlot";
// 1. Import hook notification vừa tạo
import { useAppNotification } from "./hooks/useAppNotification";

export default function App() {
  const [exams, setExams] = useState<ExamInfo[]>(() => getExams());
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>(() => getSyllabuses());
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>(() => getFreeSlots());
  const [tasks, setTasks] = useState<StudyTask[]>(() => getTasks());
  const [plan, setPlan] = useState<StudyPlan | null>(() => getPlan());

  // 2. Gọi hook ở cấp độ root để chạy ngay khi mở app
  const { permissionDenied } = useAppNotification();

  // Sync state changes to storage
  useEffect(() => {
    saveExams(exams);
  }, [exams]);
  useEffect(() => {
    saveSyllabuses(syllabuses);
  }, [syllabuses]);
  useEffect(() => {
    saveFreeSlots(freeSlots);
  }, [freeSlots]);
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);
  useEffect(() => {
    if (plan) savePlan(plan);
  }, [plan]);

  function handleAddExam(exam: ExamInfo) {
    setExams((prev) => [...prev, exam]);
  }
  function handleUpdateExam(exam: ExamInfo) {
    setExams((prev) => prev.map((e) => (e.id === exam.id ? exam : e)));
  }
  function handleDeleteExam(id: string) {
    setExams((prev) => prev.filter((e) => e.id !== id));
    setSyllabuses((prev) => prev.filter((s) => s.subjectId !== id));
    setTasks((prev) => prev.filter((t) => t.subjectId !== id));
  }

  function handleAddSyllabus(s: Syllabus) {
    setSyllabuses((prev) => [...prev, s]);
  }
  function handleUpdateSyllabus(s: Syllabus) {
    setSyllabuses((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  }
  function handleDeleteSyllabus(id: string) {
    setSyllabuses((prev) => prev.filter((s) => s.id !== id));
  }

  const freeHoursPerWeek = totalHours(freeSlots);

  return (
    <Layout>
      {/* 3. Hiển thị banner cảnh báo nếu người dùng chưa cấp quyền nhận thông báo */}
      {permissionDenied && (
        <div 
          className="mb-8 flex items-center gap-3 px-5 py-3.5 rounded-2xl animate-slide"
          style={{ 
            background: "linear-gradient(135deg, #fffbeb, #fef3c7)", 
            border: "1.5px solid #fde68a",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.08)"
          }}
        >
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            🔔
          </div>
          <div>
            <p className="text-amber-900 font-bold text-sm leading-tight">
              Chưa bật thông báo trình duyệt
            </p>
            <p className="text-amber-700 text-xs mt-0.5 font-medium">
              Bạn cần cấp quyền thông báo cho trang web này để AI có thể gửi nhắc nhở ôn thi và chúc mừng các mốc tiến độ!
            </p>
          </div>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              exams={exams}
              syllabuses={syllabuses}
              tasks={tasks}
              plan={plan}
              freeHoursPerWeek={freeHoursPerWeek}
            />
          }
        />
        <Route
          path="/exams"
          element={
            <ExamsPage
              exams={exams}
              tasks={tasks}
              onAdd={handleAddExam}
              onUpdate={handleUpdateExam}
              onDelete={handleDeleteExam}
            />
          }
        />
        <Route
          path="/syllabus"
          element={
            <SyllabusPage
              syllabuses={syllabuses}
              exams={exams}
              onAdd={handleAddSyllabus}
              onUpdate={handleUpdateSyllabus}
              onDelete={handleDeleteSyllabus}
            />
          }
        />
        <Route
          path="/timeslots"
          element={<TimeSlotPage freeSlots={freeSlots} onSave={setFreeSlots} />}
        />
        <Route
          path="/schedule"
          element={
            <SchedulePage
              exams={exams}
              syllabuses={syllabuses}
              freeSlots={freeSlots}
              tasks={tasks}
              plan={plan}
              onTasksChange={setTasks}
              onPlanChange={setPlan}
            />
          }
        />
        <Route
          path="/tasks"
          element={<TasksPage tasks={tasks} exams={exams} onTasksChange={setTasks} />}
        />
      </Routes>
    </Layout>
  );
}