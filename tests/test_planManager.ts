/**
 * tests/test_planManager.ts
 * Kiểm thử thuần túy cho executePlanAction (pure function).
 * Chạy bằng: npx ts-node --esm tests/test_planManager.ts
 */

import { executePlanAction } from "../src/utils/storage";
import type { StudyPlan, StudyTask, ScheduleSlot } from "../src/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        process.exit(1);
    }
    console.log(`✅ PASSED: ${message}`);
}

function makePlan(slots: ScheduleSlot[]): StudyPlan {
    return { slots, generatedAt: new Date().toISOString(), manualEdited: false };
}

function makeSlot(overrides: Partial<ScheduleSlot> = {}): ScheduleSlot {
    return {
        id: "slot-1",
        date: "2026-06-01",
        startTime: "09:00",
        endTime: "10:00",
        taskName: "Ôn tập: Chương 1",
        taskId: "task-1",
        subjectName: "Toán",
        subjectId: "sub-1",
        color: "#4f46e5",
        ...overrides,
    };
}

function makeTask(overrides: Partial<StudyTask> = {}): StudyTask {
    return {
        id: "task-1",
        name: "Ôn tập: Chương 1",
        chapter: "Chương 1",
        subjectId: "sub-1",
        subjectName: "Toán",
        estimatedMinutes: 60,
        priority: "high",
        status: "pending",
        color: "#4f46e5",
        ...overrides,
    };
}

// ─── TEST SUITE ───────────────────────────────────────────────────────────────

console.log("=== BẮT ĐẦU KIỂM THỬ executePlanAction ===\n");

// ─────────────────────────────────────────────────────────────────────────────
// NHÓM 1: reset_auto
// ─────────────────────────────────────────────────────────────────────────────
console.log("--- [reset_auto] ---");

{
    const plan = makePlan([makeSlot()]);
    const tasks = [makeTask()];
    const result = executePlanAction("reset_auto", {}, plan, tasks);
    assert(result.success === true, "reset_auto luôn thành công");
    assert(result.success && result.newPlan === null, "reset_auto trả về newPlan = null");
    assert(result.success && result.newTasks === tasks, "reset_auto giữ nguyên tasks");
}

{
    // reset_auto không phụ thuộc vào plan có tồn tại hay không
    const result = executePlanAction("reset_auto", {}, null, []);
    assert(result.success === true, "reset_auto thành công kể cả khi plan = null");
}

// ─────────────────────────────────────────────────────────────────────────────
// NHÓM 2: delete_task
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n--- [delete_task] ---");

{
    const slot = makeSlot({ id: "slot-A" });
    const plan = makePlan([slot, makeSlot({ id: "slot-B" })]);
    const result = executePlanAction("delete_task", { slotId: "slot-A" }, plan, []);
    assert(result.success === true, "delete_task hợp lệ thành công");
    assert(
        result.success && result.newPlan !== null && result.newPlan.slots.length === 1,
        "delete_task loại bỏ đúng slot"
    );
    assert(
        result.success && result.newPlan !== null && result.newPlan.slots[0].id === "slot-B",
        "delete_task giữ lại slot còn lại"
    );
    assert(
        result.success && result.newPlan !== null && result.newPlan.manualEdited === true,
        "delete_task đánh dấu manualEdited = true"
    );
    // Không được thay đổi plan gốc (immutability)
    assert(plan.slots.length === 2, "delete_task không mutate plan gốc");
}

{
    // Thiếu slotId
    const result = executePlanAction("delete_task", {}, makePlan([makeSlot()]), []);
    assert(result.success === false, "delete_task thiếu slotId → lỗi");
    assert(!result.success && result.error.includes("slotId"), "delete_task thông báo lỗi đúng");
}

{
    // Plan = null
    const result = executePlanAction("delete_task", { slotId: "x" }, null, []);
    assert(result.success === false, "delete_task khi plan = null → lỗi");
}

// ─────────────────────────────────────────────────────────────────────────────
// NHÓM 3: move_task
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n--- [move_task] ---");

{
    const slot = makeSlot({
        id: "slot-1",
        date: "2026-06-10",
        startTime: "09:00",
        endTime: "10:00",
    });
    const plan = makePlan([slot]);
    const result = executePlanAction(
        "move_task",
        { slotId: "slot-1", newDate: "2026-06-15", newStartTime: "14:00", newEndTime: "15:30" },
        plan,
        []
    );
    assert(result.success === true, "move_task hợp lệ thành công");
    const moved = result.success ? result.newPlan?.slots[0] : undefined;
    assert(moved?.date === "2026-06-15", "move_task cập nhật đúng date");
    assert(moved?.startTime === "14:00", "move_task cập nhật đúng startTime");
    assert(moved?.endTime === "15:30", "move_task cập nhật đúng endTime");
    assert(moved?.manualEdited === true, "move_task đánh dấu slot.manualEdited = true");
    assert(
        result.success && result.newPlan?.manualEdited === true,
        "move_task đánh dấu plan.manualEdited = true"
    );
    // Immutability
    assert(plan.slots[0].date === "2026-06-10", "move_task không mutate slot gốc");
}

{
    // Thời gian kết thúc trước thời gian bắt đầu
    const result = executePlanAction(
        "move_task",
        { slotId: "slot-1", newDate: "2026-06-15", newStartTime: "15:00", newEndTime: "14:00" },
        makePlan([makeSlot()]),
        []
    );
    assert(result.success === false, "move_task endTime < startTime → lỗi");
    assert(
        !result.success && result.error.includes("kết thúc"),
        "move_task thông báo lỗi thời gian"
    );
}

{
    // Thời gian bằng nhau (endTime === startTime)
    const result = executePlanAction(
        "move_task",
        { slotId: "slot-1", newDate: "2026-06-15", newStartTime: "10:00", newEndTime: "10:00" },
        makePlan([makeSlot()]),
        []
    );
    assert(result.success === false, "move_task endTime === startTime → lỗi");
}

{
    // Thiếu trường bắt buộc
    const result = executePlanAction(
        "move_task",
        { slotId: "slot-1", newDate: "2026-06-15" },
        makePlan([makeSlot()]),
        []
    );
    assert(result.success === false, "move_task thiếu newStartTime/newEndTime → lỗi");
}

// ─────────────────────────────────────────────────────────────────────────────
// NHÓM 4: add_task
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n--- [add_task] ---");

{
    const task = makeTask({ id: "task-2", name: "Ôn tập: Chương 2" });
    const plan = makePlan([]);
    const result = executePlanAction(
        "add_task",
        { taskId: "task-2", date: "2026-06-05", startTime: "08:00", endTime: "09:00" },
        plan,
        [task]
    );
    assert(result.success === true, "add_task hợp lệ thành công");
    assert(result.success && result.newPlan?.slots.length === 1, "add_task thêm slot vào plan");
    const added = result.success ? result.newPlan?.slots[0] : undefined;
    assert(added?.taskId === "task-2", "add_task gắn đúng taskId");
    assert(added?.taskName === "Ôn tập: Chương 2", "add_task sao chép taskName");
    assert(added?.date === "2026-06-05", "add_task gắn đúng date");
    assert(added?.manualEdited === true, "add_task đánh dấu slot.manualEdited = true");
    assert(
        result.success && result.newPlan?.manualEdited === true,
        "add_task đánh dấu plan.manualEdited = true"
    );
}

{
    // add_task với nhiều slot → kiểm tra thứ tự sắp xếp
    const task = makeTask({ id: "task-X" });
    const existingSlot = makeSlot({
        id: "slot-late",
        date: "2026-06-10",
        startTime: "10:00",
        endTime: "11:00",
    });
    const plan = makePlan([existingSlot]);
    const result = executePlanAction(
        "add_task",
        { taskId: "task-X", date: "2026-06-05", startTime: "08:00", endTime: "09:00" },
        plan,
        [task]
    );
    assert(result.success === true, "add_task sắp xếp — thành công");
    // Slot mới (ngày 05) phải đứng trước slot cũ (ngày 10)
    assert(
        result.success && result.newPlan?.slots[0].date === "2026-06-05",
        "add_task giữ thứ tự slot theo ngày tăng dần"
    );
}

{
    // taskId không tồn tại
    const result = executePlanAction(
        "add_task",
        { taskId: "ghost", date: "2026-06-05", startTime: "08:00", endTime: "09:00" },
        makePlan([]),
        [makeTask()]
    );
    assert(result.success === false, "add_task taskId không tồn tại → lỗi");
    assert(!result.success && result.error.includes("ghost"), "add_task thông báo lỗi taskId");
}

{
    // endTime trước startTime
    const result = executePlanAction(
        "add_task",
        { taskId: "task-1", date: "2026-06-05", startTime: "10:00", endTime: "09:00" },
        makePlan([]),
        [makeTask()]
    );
    assert(result.success === false, "add_task endTime < startTime → lỗi");
}

{
    // Plan = null
    const result = executePlanAction(
        "add_task",
        { taskId: "task-1", date: "2026-06-05", startTime: "08:00", endTime: "09:00" },
        null,
        [makeTask()]
    );
    assert(result.success === false, "add_task khi plan = null → lỗi");
}

// ─────────────────────────────────────────────────────────────────────────────
// NHÓM 5: update_task_status
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n--- [update_task_status] ---");

{
    const task = makeTask({ id: "task-S", status: "pending" });
    const result = executePlanAction(
        "update_task_status",
        { taskId: "task-S", status: "completed" },
        null, // plan không quan trọng với action này
        [task]
    );
    assert(result.success === true, "update_task_status hợp lệ thành công");
    const updated = result.success ? result.newTasks.find((t) => t.id === "task-S") : undefined;
    assert(updated?.status === "completed", "update_task_status thay đổi đúng status");
    // Immutability
    assert(task.status === "pending", "update_task_status không mutate task gốc");
}

{
    // Thiếu taskId
    const result = executePlanAction("update_task_status", { status: "completed" }, null, [
        makeTask(),
    ]);
    assert(result.success === false, "update_task_status thiếu taskId → lỗi");
}

// ─────────────────────────────────────────────────────────────────────────────
// NHÓM 6: action không hợp lệ
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n--- [invalid action] ---");

{
    // @ts-expect-error test hành vi runtime
    const result = executePlanAction("unknown_action", {}, makePlan([]), []);
    assert(result.success === false, "Action không hợp lệ → lỗi");
    assert(
        !result.success && result.error.includes("unknown_action"),
        "Thông báo lỗi chứa tên action sai"
    );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n=== TẤT CẢ CÁC BÀI KIỂM THỬ executePlanAction ĐÃ THÀNH CÔNG! ===");
