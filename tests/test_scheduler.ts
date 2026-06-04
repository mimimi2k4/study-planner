process.env.TZ = "Asia/Ho_Chi_Minh";

import { generateSchedule } from "../src/utils/scheduler";
import { formatDate } from "../src/utils/schedule";
import type { StudyTask, FreeSlot, ExamInfo, Milestone } from "../src/types";

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
    assert(
        formatted === "2026-05-25",
        `formatDate cục bộ phải trả về "2026-05-25", thực tế: "${formatted}"`
    );

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
    const milestones: Milestone[] = [
        {
            milestoneId: "ms-A",
            subjectId: "sub-A",
            name: "Ôn tập trước thi",
            deadlineDate: "2026-05-28",
            status: "chưa đạt",
        },
        {
            milestoneId: "ms-B",
            subjectId: "sub-B",
            name: "Ôn tập trước thi",
            deadlineDate: "2026-05-30",
            status: "chưa đạt",
        },
    ];
    const result = generateSchedule(tasks, freeSlots, exams, milestones, new Date("2026-05-25"));

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
        JSON.stringify(uniqueTaskOrder) ===
            JSON.stringify(["task-A2", "task-A3", "task-A1", "task-B1"]),
        `Thứ tự EDF xếp lịch thực tế: ${JSON.stringify(uniqueTaskOrder)}`
    );

    // ==========================================
    // TEST CASE 3: Chia nhỏ task (Task Splitting)
    // ==========================================
    // Phân bổ thời gian:
    // - task-A2 cần 150 phút.
    // - Lịch Thứ 2 (25/05) có 120 phút rảnh (19:00 - 21:00).
    // - Do đó, task-A2 (150m) phải bị chia làm 2 chunks:
    //   + Chunk 0: 120 phút vào Thứ 2 (25/05) từ 19:00 - 21:00. Cursor Thứ 2 = 21:05 (đã cộng 5m nghỉ).
    //   + Chunk 1: 30 phút vào Thứ 3 (26/05) từ 19:00 - 19:30. Cursor Thứ 3 = 19:35 (đã cộng 5m nghỉ).
    // - task-A3 (30m) xếp tiếp vào Thứ 3 (26/05) từ 19:35 - 20:05. Cursor Thứ 3 = 20:10.
    // - task-A1 (60m) xếp tiếp vào Thứ 3:
    //   + Thứ 3 còn 50 phút rảnh (20:10 - 21:00) -> xếp chunk 0 50m vào Thứ 3 (20:10 - 21:00). Cursor Thứ 3 = 21:05.
    //   + Thứ 4 (27/05) còn 120 phút rảnh (19:00 - 21:00) -> xếp nốt chunk 1 10m của task-A1 từ 19:00 - 19:10. Cursor Thứ 4 = 19:15.
    // - task-B1 (60m) xếp vào Thứ 4 từ 19:15 - 20:15. Cursor Thứ 4 = 20:20.

    const slotsA2 = result.plan.slots.filter((s) => s.taskId === "task-A2");

    // Kiểm tra task-A2 có đúng 2 slots (đã bị split)
    assert(slotsA2.length === 2, `task-A2 phải bị chia làm 2 slots, thực tế: ${slotsA2.length}`);

    // Kiểm tra thông tin chi tiết từng chunk của task-A2
    assert(
        slotsA2[0].date === "2026-05-25" &&
            slotsA2[0].startTime === "19:00" &&
            slotsA2[0].endTime === "21:00",
        "Chunk 0 của task-A2 phải xếp vào Thứ 2 từ 19:00 đến 21:00"
    );
    assert(
        slotsA2[1].date === "2026-05-26" &&
            slotsA2[1].startTime === "19:00" &&
            slotsA2[1].endTime === "19:30",
        "Chunk 1 của task-A2 phải xếp vào Thứ 3 từ 19:00 đến 19:30"
    );

    // Kiểm tra các task còn lại có được xếp đúng vị trí nối tiếp (có tính break 5 phút)
    const slotA3 = result.plan.slots.find((s) => s.taskId === "task-A3");
    assert(
        slotA3 !== undefined &&
            slotA3.date === "2026-05-26" &&
            slotA3.startTime === "19:35" &&
            slotA3.endTime === "20:05",
        "task-A3 phải được xếp vào Thứ 3 từ 19:35 đến 20:05 (đã tính 5 phút nghỉ)"
    );

    const slotsA1 = result.plan.slots.filter((s) => s.taskId === "task-A1");
    assert(slotsA1.length === 1, `task-A1 phải có 1 slot, thực tế: ${slotsA1.length}`);
    assert(
        slotsA1[0].date === "2026-05-26" &&
            slotsA1[0].startTime === "20:10" &&
            slotsA1[0].endTime === "21:00",
        "task-A1 phải được xếp vào Thứ 3 từ 20:10 đến 21:00"
    );

    // task-A1 còn thiếu 10 phút → overflow
    const overflowA1 = result.overflow.find((t) => t.id === "task-A1");
    assert(
        overflowA1 !== undefined && overflowA1.estimatedMinutes <= 10,
        `task-A1 phải còn 10 phút overflow, thực tế: ${overflowA1?.estimatedMinutes ?? 0}`
    );

    const slotB1 = result.plan.slots.find((s) => s.taskId === "task-B1");
    assert(
        slotB1 !== undefined &&
            slotB1.date === "2026-05-27" &&
            slotB1.startTime === "19:00" &&
            slotB1.endTime === "20:00",
        `task-B1 phải được xếp vào Thứ 4 từ 19:00 đến 20:00, thực tế: ${slotB1?.date} ${slotB1?.startTime}-${slotB1?.endTime}`
    );

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
    // Phân bổ thực tế của EDF Greedy (có BREAK 5m và MIN_SESSION 20m):
    // - Tổng thời gian rảnh trước ngày thi Môn A (Thứ 2, 3, 4) là 360 phút.
    // - task-A4 (200m): Xếp Thứ 2 (120m) và Thứ 3 (80m). Hết 200m. Cursor Thứ 3 = 20:25 (đã cộng 5m nghỉ).
    // - task-A2 (150m): Xếp Thứ 3 (còn 35m khả dụng, từ 20:25 - 21:00) và Thứ 4 (115m, từ 19:00 - 20:55). Hết 150m. Cursor Thứ 4 = 21:00 (đã cộng 5m nghỉ).
    // - task-A3 (30m): Thứ 4 chỉ còn 0 phút khả dụng trước 21:00 -> Đẩy vào overflow 30m!
    // - task-A1 (60m): Không còn lịch rảnh trước ngày thi Môn A -> Đẩy vào overflow 60m!
    // - task-B1 (60m): Môn B thi ngày 30/05, nhưng freeSlots chỉ định nghĩa Thứ 2, 3, 4 đã bị Môn A chiếm hết -> Đẩy vào overflow 60m!
    //
    // Do thế:
    // - Số lượng task bị overflow = 3 (task-A3, task-A1, task-B1)
    // - task-A3 thiếu 30m
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
        },
    ];

    const resultOverflow = generateSchedule(
        tasksWithOverflow,
        freeSlots,
        exams,
        milestones,
        new Date("2026-05-25")
    );

    // Kiểm tra danh sách overflow
    if (resultOverflow.overflow.length !== 3) {
        console.error(
            "Danh sách overflow thực tế:",
            resultOverflow.overflow.map((t) => `${t.id}: còn thiếu ${t.estimatedMinutes}m`)
        );
    }
    assert(
        resultOverflow.overflow.length === 3,
        `Số lượng task bị overflow thực tế: ${resultOverflow.overflow.length}`
    );

    const hasA3 = resultOverflow.overflow.some(
        (t) => t.id === "task-A3" && t.estimatedMinutes === 30
    );
    const hasA1 = resultOverflow.overflow.some(
        (t) => t.id === "task-A1" && t.estimatedMinutes === 60
    );
    const hasB1 = resultOverflow.overflow.some(
        (t) => t.id === "task-B1" && t.estimatedMinutes === 60
    );

    assert(hasA3, "task-A3 phải bị overflow 30 phút");
    assert(hasA1, "task-A1 phải bị overflow 60 phút");
    assert(hasB1, "task-B1 phải bị overflow 60 phút");

    // Kiểm tra cảnh báo trễ hạn
    const hasInsufficientTimeWarning = resultOverflow.warnings.some(
        (w) => w.type === "insufficient_time"
    );
    assert(hasInsufficientTimeWarning, "Phải tồn tại cảnh báo insufficient_time");
    console.log(
        `Cảnh báo thực tế: ${resultOverflow.warnings.find((w) => w.type === "insufficient_time")?.message}`
    );

    // ==========================================
    // TEST CASE 5: Snap-to-Min for small remaining chunks
    // ==========================================
    const test5Exams: ExamInfo[] = [
        {
            id: "sub-A",
            subjectName: "Môn A",
            examDateTime: "2026-05-28T09:00:00",
            examFormat: "multiple_choice",
            targetScore: 8,
            color: "#ff0000",
        },
    ];

    const test5Tasks: StudyTask[] = [
        {
            id: "task-liskov",
            name: "Lập trình Liskov",
            chapter: "Chương 2",
            subjectId: "sub-A",
            subjectName: "Môn A",
            estimatedMinutes: 25,
            priority: "high",
            status: "pending",
            color: "#ff0000",
        },
    ];

    const test5FreeSlots: FreeSlot[] = [
        { day: 0, startTime: "19:00", endTime: "19:20" }, // Thứ 2: 20 phút
        { day: 1, startTime: "19:00", endTime: "20:00" }, // Thứ 3: 60 phút
    ];

    const test5Milestones: Milestone[] = [
        {
            milestoneId: "ms-A5",
            subjectId: "sub-A",
            name: "Ôn tập trước thi",
            deadlineDate: "2026-05-28",
            status: "chưa đạt",
        },
    ];
    const test5Result = generateSchedule(
        test5Tasks,
        test5FreeSlots,
        test5Exams,
        test5Milestones,
        new Date("2026-05-25")
    );

    const slotsLiskov = test5Result.plan.slots.filter((s) => s.taskId === "task-liskov");

    assert(
        slotsLiskov.length === 1,
        `task-liskov phải có 1 slot, thực tế: ${slotsLiskov.length}`
    );
    assert(
        slotsLiskov[0].date === "2026-05-25" &&
            slotsLiskov[0].startTime === "19:00" &&
            slotsLiskov[0].endTime === "19:20",
        `Slot của task-liskov phải dài 20 phút (19:00 - 19:20), thực tế: ${slotsLiskov[0]?.startTime} - ${slotsLiskov[0]?.endTime}`
    );

    // task-liskov còn thiếu 5 phút → overflow (không thể snap-to-min vì budget không đủ)
    const overflowLiskov = test5Result.overflow.find((t) => t.id === "task-liskov");
    assert(
        overflowLiskov !== undefined && overflowLiskov.estimatedMinutes <= 5,
        `task-liskov phải còn 5 phút overflow, thực tế: ${overflowLiskov?.estimatedMinutes ?? 0}`
    );

    // ==========================================
    // TEST CASE 6: Bỏ qua slot quá khứ và tôn trọng thời gian chuẩn bị (Preparation Buffer)
    // ==========================================
    // Giả sử hôm nay là Thứ 4 (2026-05-27) lúc 19:30.
    // Lịch rảnh Thứ 4 từ 19:00 đến 21:00.
    // Với buffer chuẩn bị 15 phút, thời gian bắt đầu học sớm nhất phải là 19:45.
    const test6Exams: ExamInfo[] = [
        {
            id: "sub-A",
            subjectName: "Môn A",
            examDateTime: "2026-05-30T09:00:00",
            examFormat: "multiple_choice",
            targetScore: 8,
            color: "#ff0000",
        },
    ];

    const test6Tasks: StudyTask[] = [
        {
            id: "task-prep",
            name: "Học bài chuẩn bị",
            chapter: "Chương 1",
            subjectId: "sub-A",
            subjectName: "Môn A",
            estimatedMinutes: 30,
            priority: "high",
            status: "pending",
            color: "#ff0000",
        },
    ];

    // Slot Thứ 4 (day: 2)
    const test6FreeSlots: FreeSlot[] = [{ day: 2, startTime: "19:00", endTime: "21:00" }];

    // Khởi tạo thời gian hiện tại là 19:30 Thứ 4 (2026-05-27)
    const currentDateTime = new Date("2026-05-27T19:30:00");
    const test6Milestones: Milestone[] = [
        {
            milestoneId: "ms-A6",
            subjectId: "sub-A",
            name: "Ôn tập trước thi",
            deadlineDate: "2026-05-30",
            status: "chưa đạt",
        },
    ];
    const test6Result = generateSchedule(test6Tasks, test6FreeSlots, test6Exams, test6Milestones, currentDateTime);

    const slotsPrep = test6Result.plan.slots.filter((s) => s.taskId === "task-prep");
    assert(
        slotsPrep.length === 1,
        `task-prep phải được xếp lịch vào hôm nay, thực tế: ${slotsPrep.length}`
    );
    assert(slotsPrep[0].date === "2026-05-27", "Nhiệm vụ phải được xếp vào ngày hôm nay");
    assert(
        slotsPrep[0].startTime === "19:45" && slotsPrep[0].endTime === "20:15",
        `Slot học phải bắt đầu từ 19:45 (sau 15m chuẩn bị từ 19:30), thực tế: ${slotsPrep[0]?.startTime} - ${slotsPrep[0]?.endTime}`
    );

    console.log("=== TẤT CẢ CÁC BÀI KIỂM THỬ ĐÃ THÀNH CÔNG! ===");
}

runTests();
