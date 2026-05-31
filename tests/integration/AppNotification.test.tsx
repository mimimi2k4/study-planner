import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import App from "../../src/App";
import { MemoryRouter } from "react-router-dom";
import * as storage from "../../src/utils/storage";

describe("Integration Test: AppNotification Flow", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it("nên tự động hiện thông báo khi có milestone tới hạn hôm nay", async () => {
        const todayStr = new Date().toISOString().split("T")[0];

        const mockExam = {
            id: "exam-1",
            subjectName: "Test Notification",
            examDateTime: "2026-10-10T08:00",
            examFormat: "essay",
            targetScore: 8,
            color: "#ff0000",
        };

        const mockMilestone = {
            milestoneId: "ms-1",
            subjectId: "exam-1",
            name: "Mốc tới hạn hôm nay",
            deadlineDate: todayStr,
            status: "chưa đạt",
        };

        vi.spyOn(storage, "getExams").mockReturnValue([mockExam as any]);

        vi.spyOn(storage, "getMilestones").mockReturnValue([mockMilestone as any]);

        const setMilestonesSpy = vi.spyOn(storage, "saveMilestones");

        render(
            <MemoryRouter initialEntries={["/study-planner"]}>
                <App />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Chúc mừng đạt mốc! 🎉")).toBeInTheDocument();

            expect(screen.getByText("Hoàn thành: Mốc tới hạn hôm nay")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(setMilestonesSpy).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        milestoneId: "ms-1",
                        status: "đã đạt",
                    }),
                ])
            );
        });
    });
});
