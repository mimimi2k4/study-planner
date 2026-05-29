import { getExams, getTasks } from '../src/utils/storage';

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

console.log("=== BẮT ĐẦU KIỂM THỬ STORAGE VALIDATION ===");

// RED: Invalid data is saved directly to localStorage
const invalidData = [{ id: "123", subjectName: "Test" }]; // Missing examDateTime, etc.
localStorage.setItem("study_exams", JSON.stringify(invalidData));

const exams = getExams();

// With current type casting `as T`, it would return invalidData.
// With Zod, it should fail validation and return the fallback ([]).
if (exams.length === 0) {
    console.log("✅ PASSED: getExams trả về [] khi dữ liệu không hợp lệ");
} else {
    console.error("❌ FAILED: getExams không chặn được dữ liệu sai", exams);
    process.exit(1);
}

// Test valid data
const validData = [{
    id: "123",
    subjectName: "Math",
    examDateTime: "2024-01-01T10:00:00Z",
    examFormat: "multiple_choice",
    targetScore: 9,
    color: "#ff0000"
}];
localStorage.setItem("study_exams", JSON.stringify(validData));

const exams2 = getExams();
if (exams2.length === 1 && exams2[0].id === "123") {
    console.log("✅ PASSED: getExams trả về dữ liệu hợp lệ");
} else {
    console.error("❌ FAILED: getExams sai với dữ liệu hợp lệ", exams2);
    process.exit(1);
}

// Test tasks with invalid enum
const invalidTasks = [{
    id: "t1",
    name: "T1",
    chapter: "C1",
    subjectId: "s1",
    subjectName: "S1",
    estimatedMinutes: 30,
    priority: "super_high", // invalid priority
    status: "pending",
    color: "#000"
}];
localStorage.setItem("study_tasks", JSON.stringify(invalidTasks));

const tasks = getTasks();
if (tasks.length === 0) {
    console.log("✅ PASSED: getTasks trả về [] khi dữ liệu sai enum");
} else {
    console.error("❌ FAILED: getTasks không bắt được lỗi enum sai", tasks);
    process.exit(1);
}

console.log("=== KẾT THÚC TEST ===");
