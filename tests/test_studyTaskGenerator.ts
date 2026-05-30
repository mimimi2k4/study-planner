// RED: Failing tests for generateStudyTasks
// Module does not exist yet — all tests should fail with "Cannot find module"

import { generateStudyTasks } from "../src/logic/studyTaskGenerator";
import type { Syllabus, ExamInfo } from "../src/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assert(condition: boolean, message: string): void {
    if (!condition) {
        console.error(`  ❌ FAILED: ${message}`);
        process.exitCode = 1;
    } else {
        console.log(`  ✅ PASSED: ${message}`);
    }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockExam: ExamInfo = {
    id: "exam-math",
    subjectName: "Toán",
    examDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days later
    examFormat: "multiple_choice",
    targetScore: 8,
    color: "#ff0000",
};

const mockSyllabus: Syllabus = {
    id: "syl-1",
    subjectId: "exam-math", // matches exam.id so color resolves
    subjectName: "Toán",
    chapters: [
        { id: "ch-1", name: "Giới hạn", difficulty: "high", importance: "high" },
        { id: "ch-2", name: "Đạo hàm", difficulty: "medium", importance: "medium" },
        { id: "ch-3", name: "Tích phân", difficulty: "low", importance: "low" },
    ],
};

// ─── Test Suite ────────────────────────────────────────────────────────────────

console.log("=== Test: generateStudyTasks ===\n");

// Test 1: Returns non-empty array for valid input
console.log("Test 1: Trả về mảng không rỗng với input hợp lệ");
{
    const tasks = generateStudyTasks([mockSyllabus], [mockExam]);
    assert(tasks.length > 0, `Phải sinh ra ít nhất 1 task (nhận được ${tasks.length})`);
    assert(tasks.length === 3, `Phải sinh ra đúng 3 tasks (nhận được ${tasks.length})`);
}

// Test 2: high difficulty + high importance → priority = "high"
console.log("\nTest 2: difficulty=high, importance=high → priority=high");
{
    const tasks = generateStudyTasks([mockSyllabus], [mockExam]);
    const highTask = tasks.find((t) => t.chapter === "Giới hạn");
    assert(highTask !== undefined, "Phải có task cho chương 'Giới hạn'");
    assert(
        highTask?.priority === "high",
        `priority phải là 'high' (nhận được '${highTask?.priority}')`
    );
}

// Test 3: low difficulty + low importance → priority = "low"
console.log("\nTest 3: difficulty=low, importance=low → priority=low");
{
    const tasks = generateStudyTasks([mockSyllabus], [mockExam]);
    const lowTask = tasks.find((t) => t.chapter === "Tích phân");
    assert(lowTask !== undefined, "Phải có task cho chương 'Tích phân'");
    assert(
        lowTask?.priority === "low",
        `priority phải là 'low' (nhận được '${lowTask?.priority}')`
    );
}

// Test 4: All tasks have status = "pending"
console.log("\nTest 4: Tất cả task phải có status='pending'");
{
    const tasks = generateStudyTasks([mockSyllabus], [mockExam]);
    const allPending = tasks.every((t) => t.status === "pending");
    assert(allPending, "Tất cả tasks phải có status='pending'");
}

// Test 5: Color is taken from matching exam
console.log("\nTest 5: Color lấy từ exam tương ứng theo subjectId");
{
    const tasks = generateStudyTasks([mockSyllabus], [mockExam]);
    const allRed = tasks.every((t) => t.color === "#ff0000");
    assert(
        allRed,
        `Tất cả tasks phải có color='#ff0000' (exam color), nhận được: ${tasks.map((t) => t.color).join(", ")}`
    );
}

// Test 6: Empty syllabuses → empty array
console.log("\nTest 6: syllabuses=[] → trả về []");
{
    const tasks = generateStudyTasks([], [mockExam]);
    assert(tasks.length === 0, `Phải trả về [] khi syllabuses rỗng (nhận được ${tasks.length})`);
}

// Test 7: Each task has required fields
console.log("\nTest 7: Mỗi task phải có đủ các trường bắt buộc");
{
    const tasks = generateStudyTasks([mockSyllabus], [mockExam]);
    for (const task of tasks) {
        assert(typeof task.id === "string" && task.id.length > 0, `task.id phải là string hợp lệ`);
        assert(
            typeof task.name === "string" && task.name.length > 0,
            `task.name phải là string hợp lệ`
        );
        assert(typeof task.chapter === "string", `task.chapter phải là string`);
        assert(typeof task.subjectId === "string", `task.subjectId phải là string`);
        assert(
            typeof task.estimatedMinutes === "number" && task.estimatedMinutes > 0,
            `task.estimatedMinutes phải > 0`
        );
    }
}

// Test 8: Tasks sorted by priority (high → medium → low)
console.log("\nTest 8: Tasks được sắp xếp theo priority (high → medium → low)");
{
    const tasks = generateStudyTasks([mockSyllabus], [mockExam]);
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    let sorted = true;
    for (let i = 0; i < tasks.length - 1; i++) {
        if (order[tasks[i].priority] > order[tasks[i + 1].priority]) {
            sorted = false;
            break;
        }
    }
    assert(
        sorted,
        `Tasks phải được sắp xếp high → medium → low (nhận được: ${tasks.map((t) => t.priority).join(", ")})`
    );
}

console.log("\n=== KẾT THÚC TEST ===");
