import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout/Layout'
import DashboardPage from './pages/DashboardPage'
import ExamsPage from './pages/ExamsPage'
import SyllabusPage from './pages/SyllabusPage'
import TimeSlotPage from './pages/TimeSlotPage'
import SchedulePage from './pages/SchedulePage'
import TasksPage from './pages/TasksPage'
import type { ExamInfo, Syllabus, FreeSlot, StudyTask, StudyPlan } from './types'
import {
  getExams, saveExams,
  getSyllabuses, saveSyllabuses,
  getFreeSlots, saveFreeSlots,
  getTasks, saveTasks,
  getPlan, savePlan,
} from './utils/storage'

function calcFreeHours(slots: FreeSlot[]): number {
  return slots.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number)
    const [eh, em] = s.endTime.split(':').map(Number)
    return sum + (eh * 60 + em - sh * 60 - sm) / 60
  }, 0)
}

export default function App() {
  const [exams, setExams] = useState<ExamInfo[]>(() => getExams())
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>(() => getSyllabuses())
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>(() => getFreeSlots())
  const [tasks, setTasks] = useState<StudyTask[]>(() => getTasks())
  const [plan, setPlan] = useState<StudyPlan | null>(() => getPlan())

  // Sync state changes to storage
  useEffect(() => { saveExams(exams) }, [exams])
  useEffect(() => { saveSyllabuses(syllabuses) }, [syllabuses])
  useEffect(() => { saveFreeSlots(freeSlots) }, [freeSlots])
  useEffect(() => { saveTasks(tasks) }, [tasks])
  useEffect(() => { if (plan) savePlan(plan) }, [plan])

  function handleAddExam(exam: ExamInfo) {
    setExams((prev) => [...prev, exam])
  }
  function handleUpdateExam(exam: ExamInfo) {
    setExams((prev) => prev.map((e) => (e.id === exam.id ? exam : e)))
  }
  function handleDeleteExam(id: string) {
    setExams((prev) => prev.filter((e) => e.id !== id))
    setSyllabuses((prev) => prev.filter((s) => s.subjectId !== id))
    setTasks((prev) => prev.filter((t) => t.subjectId !== id))
  }

  function handleAddSyllabus(s: Syllabus) {
    setSyllabuses((prev) => [...prev, s])
  }
  function handleUpdateSyllabus(s: Syllabus) {
    setSyllabuses((prev) => prev.map((x) => (x.id === s.id ? s : x)))
  }
  function handleDeleteSyllabus(id: string) {
    setSyllabuses((prev) => prev.filter((s) => s.id !== id))
  }

  const freeHoursPerWeek = calcFreeHours(freeSlots)

  return (
    <Layout>
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
            <ExamsPage exams={exams} tasks={tasks} onAdd={handleAddExam} onUpdate={handleUpdateExam} onDelete={handleDeleteExam} />
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
          element={
            <TimeSlotPage freeSlots={freeSlots} onSave={setFreeSlots} />
          }
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
          element={
            <TasksPage tasks={tasks} exams={exams} onTasksChange={setTasks} />
          }
        />
      </Routes>
    </Layout>
  )
}
