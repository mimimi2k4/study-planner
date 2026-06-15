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
import { useMilestones } from "./hooks/useMilestones";
// 1. Import hook notification vừa tạo
import { useAppNotification } from "./hooks/useAppNotification";
import { BellRing, CheckCircle, X } from "lucide-react";

export default function App() {
    const [exams, setExams] = useState<ExamInfo[]>(() => getExams());
    const [syllabuses, setSyllabuses] = useState<Syllabus[]>(() => getSyllabuses());
    const [freeSlots, setFreeSlots] = useState<FreeSlot[]>(() => getFreeSlots());
    const [tasks, setTasks] = useState<StudyTask[]>(() => getTasks());
    const [plan, setPlan] = useState<StudyPlan | null>(() => getPlan());

    const { milestones, addMilestones, clearMilestones, setMilestones } = useMilestones();

    // 2. Gọi hook ở cấp độ root để chạy ngay khi mở app
    const { permissionDenied, canPrompt, requestPermission, inAppNotifs, setInAppNotifs } = useAppNotification({
        milestones,
        setMilestones,
    });

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
        clearMilestones(id);
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
                <div className="mb-8 flex items-center gap-3 px-5 py-3.5 rounded-2xl animate-slide bg-gradient-to-br from-amber-50 to-amber-100 border-[1.5px] border-amber-200 shadow-[0_4px_12px_rgba(245,158,11,0.08)]">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                        <BellRing size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-amber-900 font-bold text-sm leading-tight">
                            {canPrompt ? "Chưa bật thông báo trình duyệt" : "Thông báo đã bị chặn"}
                        </p>
                        <p className="text-amber-700 text-xs mt-0.5 font-medium">
                            {canPrompt 
                                ? "Bạn cần cấp quyền thông báo cho trang web này để AI có thể gửi nhắc nhở ôn thi và chúc mừng các mốc tiến độ!"
                                : "Vui lòng bấm vào biểu tượng ổ khóa 🔒 cạnh thanh địa chỉ trình duyệt để cho phép hiển thị thông báo."}
                        </p>
                    </div>
                    {canPrompt ? (
                        <button
                            onClick={requestPermission}
                            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                        >
                            Bật ngay
                        </button>
                    ) : (
                        <div className="shrink-0 px-3 py-1.5 bg-amber-100 text-amber-700 font-semibold text-xs rounded-lg">
                            Đã chặn
                        </div>
                    )}
                </div>
            )}

            {/* ── GIAO DIỆN THÔNG BÁO NỔI (IN-APP TOAST) ── */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {inAppNotifs.map((notif) => (
                    <div
                        key={notif.id}
                        className={`pointer-events-auto flex items-start gap-3 w-[320px] p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border backdrop-blur-md transition-all duration-500 translate-y-0 opacity-100 ${
                            notif.type === "success"
                                ? "bg-emerald-50/95 border-emerald-200"
                                : "bg-amber-50/95 border-amber-200"
                        }`}
                    >
                        <div
                            className={`mt-0.5 shrink-0 ${notif.type === "success" ? "text-emerald-500" : "text-amber-500"}`}
                        >
                            {notif.type === "success" ? (
                                <CheckCircle size={22} />
                            ) : (
                                <BellRing size={22} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4
                                className={`text-sm font-bold ${notif.type === "success" ? "text-emerald-800" : "text-amber-800"}`}
                            >
                                {notif.title}
                            </h4>
                            <p
                                className={`text-xs mt-0.5 ${notif.type === "success" ? "text-emerald-600" : "text-amber-700"}`}
                            >
                                {notif.message}
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                setInAppNotifs((prev) => prev.filter((n) => n.id !== notif.id))
                            }
                            className={`shrink-0 p-1 rounded-lg transition-colors ${notif.type === "success" ? "hover:bg-emerald-100 text-emerald-600" : "hover:bg-amber-100 text-amber-600"}`}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

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
                            milestones={milestones}
                        />
                    }
                />
                <Route
                    path="/exams"
                    element={
                        <ExamsPage
                            exams={exams}
                            tasks={tasks}
                            milestones={milestones}
                            onAdd={handleAddExam}
                            onUpdate={handleUpdateExam}
                            onDelete={handleDeleteExam}
                            onAddMilestones={addMilestones}
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
                            milestones={milestones}
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
