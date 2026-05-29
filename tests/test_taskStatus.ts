import { getNextTaskStatus } from "../src/logic/taskStatus";

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        process.exit(1);
    }
    console.log(`✅ PASSED: ${message}`);
}

function runTests() {
    console.log("=== BẮT ĐẦU KIỂM THỬ TASK STATUS ===");

    assert(getNextTaskStatus("pending") === "in_progress", "pending -> in_progress");
    assert(getNextTaskStatus("in_progress") === "completed", "in_progress -> completed");
    assert(getNextTaskStatus("completed") === "pending", "completed -> pending");

    console.log("🎉 TẤT CẢ TEST ĐỀU PASS!");
}

runTests();
