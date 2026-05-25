process.env.TZ = "Asia/Ho_Chi_Minh";

import { generateSchedule } from "../src/utils/scheduler";
import { formatDate } from "../src/utils/schedule";
import type { StudyTask, FreeSlot, ExamInfo } from "../src/types";

// Helper assertions
function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        process.exit(1);
    }
    console.log(`✅ PASSED: ${message}`);
}

function runTests() {
    console.log("=== BẮT ĐẦU KIỂM THỬ THUẬT TOÁN SCHEDULER ===");

    // ==========================================
    // TEST CASE 1: Định dạng ngày tháng local timezone (Timezone Bug)
    // ==========================================
    const testDate = new Date("2026-05-25T00:00:00"); // 25/05/2026 midnight local
    const formatted = formatDate(testDate);
    assert(formatted === "2026-05-25", `formatDate cục bộ phải trả về "2026-05-25", thực tế: "${formatted}"`);

    // ==========================================
    // TEST CASE 2: Sắp xếp EDF (Earliest Deadline First) & Tie-breakers
    // ==========================================
    const exams: ExamInfo[] = [
        {
            id: "sub-A",
            subjectName: "Môn A",
            examDateTime: "2026-05-28T09:00:00",
            examFormat: "multiple_choice",
            targetScore: 8,
            color: "#ff0000",
        },
        {
            id: "sub-B",
            subjectName: "Môn B",
            examDateTime: "2026-05-30T09:00:00",
            examFormat: "essay",
            targetScore: 9,
            color: "#00ff00",
        },
    ];

    const tasks: StudyTask[] = [
        {
            id: "task-B1",
            name: "Task B1 (Môn B, thi muộn hơn, priority high)",
            chapter: "Chương 1",
            subjectId: "sub-B",
            subjectName: "Môn B",
            estimatedMinutes: 60,
            priority: "high",
            status: "pending",
            color: "#00ff00",
        },
        {
            id: "task-A1",
            name: "Task A1 (Môn A, thi sớm hơn, priority medium)",
            chapter: "Chương 1",
            subjectId: "sub-A",
            subjectName: "Môn A",
            estimatedMinutes: 60,
            priority: "medium",
            status: "pending",
            color: "#ff0000",
        },
        {
            id: "task-A2",
            name: "Task A2 (Môn A, thi sớm hơn, priority high, nặng hơn)",
            chapter: "Chương 2",
            subjectId: "sub-A",
            subjectName: "Môn A",
            estimatedMinutes: 150, // Cài đặt 150 phút để kiểm thử Task Splitting ở Test 3
            priority: "high",
            status: "pending",
            color: "#ff0000",
        },
        {
            id: "task-A3",
            name: "Task A3 (Môn A, thi sớm hơn, priority high, nhẹ hơn)",
            chapter: "Chương 3",
            subjectId: "sub-A",
            subjectName: "Môn A",
            estimatedMinutes: 30,
            priority: "high",
            status: "pending",
            color: "#ff0000",
        },
    ];

    const freeSlots: FreeSlot[] = [
        { day: 0, startTime: "19:00", endTime: "21:00" }, // Thứ 2: 120 phút
        { day: 1, startTime: "19:00", endTime: "21:00" }, // Thứ 3: 120 phút
        { day: 2, startTime: "19:00", endTime: "21:00" }, // Thứ 4: 120 phút
    ];

    // Freeze startDate là 2026-05-25 (Thứ 2) để tránh việc test bị ảnh hưởng khi thời gian thay đổi
    const result = generateSchedule(tasks, freeSlots, exams, new Date("2026-05-25"));

    // Thứ tự mong đợi sau sắp xếp EDF:
    // 1. Môn A thi ngày 28/05 (sớm hơn Môn B thi ngày 30/05) -> các task môn A lên trước.
    // 2. Trong các task môn A:
    //    - task-A2 (high, 150m) và task-A3 (high, 30m) xếp trước task-A1 (medium, 60m).
    //    - Giữa task-A2 và task-A3: task-A2 nặng hơn (150m > 30m) xếp trước.
    //    - Cuối cùng của môn A là task-A1.
    // 3. Sau cùng là các task môn B (task-B1).
    // Do đó thứ tự xếp lịch mong đợi: task-A2 -> task-A3 -> task-A1 -> task-B1.

    const uniqueTaskOrder: string[] = [];
    for (const slot of result.plan.slots) {
        if (!uniqueTaskOrder.includes(slot.taskId)) {
            uniqueTaskOrder.push(slot.taskId);
        }
    }

    assert(
        JSON.stringify(uniqueTaskOrder) === JSON.stringify(["task-A2", "task-A3", "task-A1", "task-B1"]),
        `Thứ tự EDF xếp lịch thực tế: ${JSON.stringify(uniqueTaskOrder)}`
    );

    // ==========================================
    // TEST CASE 3: Chia nhỏ task (Task Splitting)
    // ==========================================
    // Phân bổ thời gian:
    // - task-A2 cần 150 phút.
    // - Lịch Thứ 2 (25/05) có 120 phút rảnh (19:00 - 21:00).
    // - Do đó, task-A2 phải bị chia làm 2 chunks:
    //   + Chunk 0: 120 phút vào Thứ 2 (25/05) từ 19:00 - 21:00.
    //   + Chunk 1: 30 phút vào Thứ 3 (26/05) từ 19:00 - 19:30.
    // - Lịch Thứ 3 (26/05) còn trống 90 phút (19:30 - 21:00).
    //   + task-A3 (30m) xếp vào Thứ 3 từ 19:30 - 20:00.
    //   + task-A1 (60m) xếp vào Thứ 3 từ 20:00 - 21:00.
    // - Lịch Thứ 4 (27/05) còn trống 120 phút (19:00 - 21:00).
    //   + task-B1 (60m) xếp vào Thứ 4 từ 19:00 - 20:00.

    const slotsA2 = result.plan.slots.filter(s => s.taskId === "task-A2");
    
    // Kiểm tra task-A2 có đúng 2 slots (đã bị split)
    assert(slotsA2.length === 2, `task-A2 phải bị chia làm 2 slots, thực tế: ${slotsA2.length}`);
    
    // Kiểm tra thông tin chi tiết từng chunk của task-A2
    assert(slotsA2[0].date === "2026-05-25" && slotsA2[0].startTime === "19:00" && slotsA2[0].endTime === "21:00", 
        "Chunk 0 của task-A2 phải xếp vào Thứ 2 từ 19:00 đến 21:00");
    assert(slotsA2[1].date === "2026-05-26" && slotsA2[1].startTime === "19:00" && slotsA2[1].endTime === "19:30", 
        "Chunk 1 của task-A2 phải xếp vào Thứ 3 từ 19:00 đến 19:30");

    // Kiểm tra các task còn lại có được xếp đúng vị trí nối tiếp không
    const slotA3 = result.plan.slots.find(s => s.taskId === "task-A3");
    assert(slotA3 !== undefined && slotA3.date === "2026-05-26" && slotA3.startTime === "19:30" && slotA3.endTime === "20:00",
        "task-A3 phải được xếp vào Thứ 3 từ 19:30 đến 20:00");

    const slotA1 = result.plan.slots.find(s => s.taskId === "task-A1");
    assert(slotA1 !== undefined && slotA1.date === "2026-05-26" && slotA1.startTime === "20:00" && slotA1.endTime === "21:00",
        "task-A1 phải được xếp vào Thứ 3 từ 20:00 đến 21:00");

    const slotB1 = result.plan.slots.find(s => s.taskId === "task-B1");
    assert(slotB1 !== undefined && slotB1.date === "2026-05-27" && slotB1.startTime === "19:00" && slotB1.endTime === "20:00",
        "task-B1 phải được xếp vào Thứ 4 từ 19:00 đến 20:00");

    // ==========================================
    // TEST CASE 4: Quá tải (Overflow) & Cảnh báo (Warnings)
    // ==========================================
    // Thêm task-A4 siêu nặng (200m) cho Môn A (thi ngày 28/05).
    // Thứ tự EDF sau khi sắp xếp:
    // 1. task-A4 (Môn A, high, 200m)
    // 2. task-A2 (Môn A, high, 150m)
    // 3. task-A3 (Môn A, high, 30m)
    // 4. task-A1 (Môn A, medium, 60m)
    // 5. task-B1 (Môn B, high, 60m)
    //
    // Phân bổ thực tế của EDF Greedy:
    // - Tổng thời gian rảnh trước ngày thi Môn A (Thứ 2, 3, 4) là 360 phút.
    // - task-A4 (200m): Xếp Thứ 2 (120m) và Thứ 3 (80m). Hết 200m. (Còn dư: Thứ 3: 40m, Thứ 4: 120m)
    // - task-A2 (150m): Xếp Thứ 3 (40m) và Thứ 4 (110m). Hết 150m. (Còn dư: Thứ 4: 10m)
    // - task-A3 (30m): Cần 30m nhưng Thứ 4 chỉ còn 10m -> Xếp 10m vào Thứ 4. Còn thiếu 20m -> Đẩy vào overflow!
    // - task-A1 (60m): Môn A hết lịch rảnh khả dụng -> Đẩy vào overflow 60m!
    // - task-B1 (60m): Môn B thi ngày 30/05. Mặc dù lịch trước ngày 30/05 còn trống Thứ 5, Thứ 6, v.v., 
    //   nhưng freeSlots của ta chỉ định nghĩa Thứ 2, 3, 4. Các ngày này đã bị môn A chiếm hết -> Đẩy vào overflow 60m!
    //
    // Do đó:
    // - Số lượng task bị overflow = 3 (task-A3, task-A1, task-B1)
    // - task-A3 thiếu 20m
    // - task-A1 thiếu 60m
    // - task-B1 thiếu 60m
    
    const tasksWithOverflow: StudyTask[] = [
        ...tasks,
        {
            id: "task-A4",
            name: "Task A4 (Môn A, siêu nặng)",
            chapter: "Chương 4",
            subjectId: "sub-A",
            subjectName: "Môn A",
            estimatedMinutes: 200,
            priority: "high",
            status: "pending",
            color: "#ff0000",
        }
    ];

    const resultOverflow = generateSchedule(tasksWithOverflow, freeSlots, exams, new Date("2026-05-25"));
    
    // Kiểm tra danh sách overflow
    if (resultOverflow.overflow.length !== 3) {
        console.error("Danh sách overflow thực tế:", resultOverflow.overflow.map(t => `${t.id}: còn thiếu ${t.estimatedMinutes}m`));
    }
    assert(resultOverflow.overflow.length === 3, `Số lượng task bị overflow thực tế: ${resultOverflow.overflow.length}`);
    
    const hasA3 = resultOverflow.overflow.some(t => t.id === "task-A3" && t.estimatedMinutes === 20);
    const hasA1 = resultOverflow.overflow.some(t => t.id === "task-A1" && t.estimatedMinutes === 60);
    const hasB1 = resultOverflow.overflow.some(t => t.id === "task-B1" && t.estimatedMinutes === 60);
    
    assert(hasA3, "task-A3 phải bị overflow 20 phút");
    assert(hasA1, "task-A1 phải bị overflow 60 phút");
    assert(hasB1, "task-B1 phải bị overflow 60 phút");

    // Kiểm tra cảnh báo trễ hạn
    const hasInsufficientTimeWarning = resultOverflow.warnings.some(w => w.type === "insufficient_time");
    assert(hasInsufficientTimeWarning, "Phải tồn tại cảnh báo insufficient_time");
    console.log(`Cảnh báo thực tế: ${resultOverflow.warnings.find(w => w.type === "insufficient_time")?.message}`);

    console.log("=== TẤT CẢ CÁC BÀI KIỂM THỬ ĐÃ THÀNH CÔNG! ===");
}

runTests();
