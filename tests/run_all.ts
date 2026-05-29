import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = fs
    .readdirSync(__dirname)
    .filter((file) => file.startsWith("test_") && file.endsWith(".ts"));

console.log(`Tìm thấy ${testFiles.length} file test. Bắt đầu chạy kiểm thử...\n`);

let passed = 0;
let failed = 0;

for (const file of testFiles) {
    console.log(`\nĐang chạy [${file}]...`);
    try {
        execSync(`npx tsx ${path.join(__dirname, file)}`, { stdio: "inherit" });
        passed++;
    } catch (error) {
        failed++;
        console.error(`[${file}] thất bại!`);
    }
}

console.log(`\n========================================`);
console.log(`TỔNG KẾT: ${passed} file PASS | ${failed} file FAIL`);

if (failed > 0) {
    process.exit(1);
}
