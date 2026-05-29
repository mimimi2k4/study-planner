import { generateMilestones } from "../src/logic/milestoneGenerator";

function runTest(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✅ PASSED: ${name}`);
    } catch (e) {
        console.error(`❌ FAILED: ${name}`);
        console.error(e);
        process.exit(1);
    }
}

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
}

const today = new Date();
today.setHours(0, 0, 0, 0);

function createDateStr(daysAdded: number): string {
    const d = new Date(today);
    d.setDate(d.getDate() + daysAdded);
    return d.toISOString().split("T")[0];
}

console.log("--- [Test Milestone Generator] ---");

runTest("Lỗi khi examDate trống", () => {
    const res = generateMilestones("exam-1", "", 10);
    assert(!res.success, "Cần trả về false");
    if (!res.success) {
        assert(res.error.includes("trống"), "Cần báo lỗi chuỗi trống");
    }
});

runTest("Lỗi khi examDate ở quá khứ", () => {
    const res = generateMilestones("exam-1", createDateStr(-5), 10);
    assert(!res.success, "Cần trả về false");
    if (!res.success) {
        assert(res.error.includes("đã qua"), "Cần báo lỗi quá khứ");
    }
});

runTest("Dưới 7 ngày (VD 5 ngày) -> 3 mốc", () => {
    const res = generateMilestones("exam-1", createDateStr(5), 10);
    assert(res.success, "Cần thành công");
    if (res.success) {
        assert(res.milestones.length === 3, `Số mốc thực tế: ${res.milestones.length}`);
    }
});

runTest("Từ 8-30 ngày (VD 20 ngày) -> chia tuần", () => {
    const res = generateMilestones("exam-1", createDateStr(20), 10);
    assert(res.success, "Cần thành công");
    if (res.success) {
        // 7, 14 (2 mốc tuần) + 1 mốc sát ngày thi = 3 mốc
        assert(res.milestones.length === 3, `Số mốc thực tế: ${res.milestones.length}`);
        assert(res.milestones[0].name.includes("tuần 1"), "Tên mốc 1");
    }
});

runTest("Trên 30 ngày (VD 45 ngày) -> chia 2 tuần", () => {
    const res = generateMilestones("exam-1", createDateStr(45), 10);
    assert(res.success, "Cần thành công");
    if (res.success) {
        // 14, 28, 42 (3 mốc) + 1 mốc thi thử (cách 7 ngày) = 4 mốc
        assert(res.milestones.length === 4, `Số mốc thực tế: ${res.milestones.length}`);
        assert(res.milestones[0].name.includes("2 tuần"), "Tên mốc 1");
    }
});
