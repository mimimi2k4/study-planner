import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import App from "../../src/App";
import { MemoryRouter } from "react-router-dom";
import * as storage from "../../src/utils/storage";

vi.mock("../../src/logic/milestoneGenerator", () => ({
    generateMilestones: vi.fn((subjectId: string, examDateTime: string) => {
        return {
            success: true,
            milestones: [
                {
                    milestoneId: `mock-ms-${Date.now()}`,
                    subjectId,
                    name: "Mock Milestone",
                    deadlineDate: examDateTime.split("T")[0],
                    status: "chưa đạt",
                },
            ],
        };
    }),
}));

describe("Integration Test: Exam Flow", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it("nên tạo môn thi mới, hiển thị trên danh sách và tạo mốc ôn tập thành công", async () => {
        const saveExamsSpy = vi.spyOn(storage, "saveExams");
        const saveMilestonesSpy = vi.spyOn(storage, "saveMilestones");

        render(
            <MemoryRouter initialEntries={["/study-planner"]}>
                <App />
            </MemoryRouter>
        );

        const examNavButton = screen.getByText("Môn thi");
        await userEvent.click(examNavButton);

        await waitFor(() => {
            expect(screen.getByText("Thêm môn thi mới")).toBeInTheDocument();
        });

        const subjectInput = screen.getByPlaceholderText("VD: Toán cao cấp, Lập trình web...");

        const dateInput = document.querySelector(
            'input[type="datetime-local"]'
        ) as HTMLInputElement;

        await userEvent.type(subjectInput, "Toán Rời Rạc");

        fireEvent.change(dateInput, {
            target: { value: "2026-10-10T08:00" },
        });

        const scoreButton = screen.getByText("9");
        await userEvent.click(scoreButton);

        const submitButton = screen.getByText("Thêm môn thi");
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("Toán Rời Rạc")).toBeInTheDocument();
            expect(saveExamsSpy).toHaveBeenCalled();
        });

        const createMilestoneBtn = screen.getByText("Tạo mốc");
        await userEvent.click(createMilestoneBtn);

        await waitFor(() => {
            expect(screen.getByText("Tạo mốc ôn tập thành công!")).toBeInTheDocument();

            expect(screen.getByText("Mock Milestone")).toBeInTheDocument();

            expect(saveMilestonesSpy).toHaveBeenCalled();
        });
    });
});
