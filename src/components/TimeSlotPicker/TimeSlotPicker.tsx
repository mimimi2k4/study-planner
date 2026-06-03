import { useState, useCallback } from "react";
import { AlertCircle, Clock, RefreshCw, Save, Check } from "lucide-react";
import type { TimeSlotPickerProps } from "./types";
import { ZONE, DAYS, DAYS_SHORT } from "./constants";
import {
    SLOTS,
    buildGrid,
    gridToSlots,
    rowZone,
    slotToTime,
    timeToSlot,
    totalHours,
} from "../../utils/timeSlot";

export default function TimeSlotPicker({ freeSlots, onSave }: TimeSlotPickerProps) {
    const [grid, setGrid] = useState<boolean[][]>(() => buildGrid(freeSlots));
    const [dragging, setDragging] = useState(false);
    const [dragVal, setDragVal] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);

    const toggle = useCallback((row: number, col: number, val: boolean) => {
        setGrid((g) => {
            const n = g.map((r) => [...r]);
            n[row][col] = val;
            return n;
        });
        setSaved(false);
        setError("");
    }, []);

    const handleMouseDown = (row: number, col: number) => {
        const v = !grid[row][col];
        setDragging(true);
        setDragVal(v);
        toggle(row, col, v);
    };
    const handleMouseEnter = (row: number, col: number) => {
        if (dragging) toggle(row, col, dragVal);
    };
    const handleMouseUp = () => setDragging(false);

    function handleSave() {
        const slots = gridToSlots(grid);
        if (slots.length === 0) {
            setError("Vui lòng chọn ít nhất một khung giờ rảnh");
            return;
        }
        setError("");
        onSave(slots);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }

    const current = gridToSlots(grid);
    const hours = totalHours(current);
    const totalCells = grid.reduce((s, r) => s + r.filter(Boolean).length, 0);

    return (
        <div
            className="flex flex-col gap-8"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* ── Stats bar ── */}
            <div className="card rounded-xl px-6 py-5 flex flex-wrap items-center gap-6 bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 border border-emerald-100">
                        <Clock size={20} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-emerald-600 leading-none">
                            {hours.toFixed(1)} giờ
                        </p>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">mỗi tuần</p>
                    </div>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div>
                    <p className="text-xl font-black text-slate-800">{totalCells}</p>
                    <p className="text-xs text-slate-400 font-semibold">ô đã chọn</p>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div>
                    <p className="text-xl font-black text-slate-800">{current.length}</p>
                    <p className="text-xs text-slate-400 font-semibold">khung giờ</p>
                </div>

                {/* Legend */}
                <div className="ml-auto flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200" />
                        Trống
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-emerald-500" />
                        Đã chọn
                    </span>
                </div>
            </div>

            {/* ── Grid ── */}
            <div className="card rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                    <div className="min-w-[580px]">
                        {/* Day headers */}
                        <div
                            className="grid border-b border-slate-200 bg-slate-50"
                            style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}
                        >
                            <div className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Giờ
                            </div>
                            {DAYS.map((d, i) => (
                                <div key={d} className="py-4 text-center border-l border-slate-200">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:block">
                                        {d}
                                    </p>
                                    <p className="text-sm font-black text-slate-600 sm:hidden">
                                        {DAYS_SHORT[i]}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Cells */}
                        <div className="select-none bg-white">
                            {Array.from({ length: SLOTS }, (_, row) => {
                                const zone = rowZone(row);
                                const z = ZONE[zone];
                                const showLabel = row % 2 === 0;
                                const isHourBorder = row % 2 === 0;
                                return (
                                    <div
                                        key={row}
                                        className="grid"
                                        style={{
                                            gridTemplateColumns: "64px repeat(7, 1fr)",
                                            height: 26,
                                        }}
                                    >
                                        <div className="flex items-center justify-end pr-3 border-r border-slate-200 bg-slate-50">
                                            {showLabel && (
                                                <span className="text-xs font-bold text-slate-500">
                                                    {slotToTime(row)}
                                                </span>
                                            )}
                                        </div>
                                        {Array.from({ length: 7 }, (_, col) => {
                                            const sel = grid[row][col];
                                            return (
                                                <div
                                                    key={col}
                                                    className="border-l cursor-pointer transition-colors duration-75"
                                                    style={{
                                                        borderColor: "#e2e8f0",
                                                        borderBottom: isHourBorder
                                                            ? "1px solid #e2e8f0"
                                                            : "1px dashed #f1f5f9",
                                                        background: sel ? z.selBg : "transparent",
                                                    }}
                                                    onMouseDown={() => handleMouseDown(row, col)}
                                                    onMouseEnter={() => handleMouseEnter(row, col)}
                                                />
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="flex items-center gap-2.5 px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* ── Actions ── */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    className="btn btn-primary flex items-center gap-2.5 text-base"
                    style={{
                        padding: "14px 32px",
                        borderRadius: 12,
                        background: saved ? "#059669" : undefined,
                        boxShadow: saved ? "none" : undefined,
                    }}
                >
                    {saved ? <Check size={18} /> : <Save size={18} />}
                    {saved ? "Đã lưu thành công!" : "Lưu thời gian rảnh"}
                </button>
                <button
                    onClick={() => {
                        setGrid(Array.from({ length: SLOTS }, () => new Array(7).fill(false)));
                        setSaved(false);
                        setError("");
                    }}
                    className="flex items-center gap-2 font-bold rounded-xl transition-all text-base bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                    style={{ padding: "14px 24px" }}
                >
                    <RefreshCw size={16} /> Đặt lại
                </button>
            </div>

            {/* ── Summary ── */}
            {current.length > 0 && (
                <div className="card rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                    <div className="px-6 py-4 flex items-center gap-3 bg-slate-50 border-b border-slate-100">
                        <Clock size={16} className="text-emerald-500" />
                        <div>
                            <h3 className="font-bold text-slate-900 text-base leading-none">
                                Tóm tắt lịch rảnh
                            </h3>
                            <p className="text-slate-500 text-sm mt-0.5 font-medium">
                                {current.length} khung giờ - {hours.toFixed(1)} giờ/tuần
                            </p>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {current.map((s, i) => {
                                const dur = (timeToSlot(s.endTime) - timeToSlot(s.startTime)) * 30;
                                return (
                                    <div
                                        key={i}
                                        className="rounded-lg px-4 py-3 bg-slate-50 border border-slate-200"
                                    >
                                        <p className="font-bold text-sm text-slate-700">
                                            {DAYS[s.day]}
                                        </p>
                                        <p className="font-mono text-xs font-bold mt-1 text-emerald-600">
                                            {s.startTime}–{s.endTime}
                                        </p>
                                        <p className="text-xs font-medium mt-0.5 text-slate-500">
                                            {dur} phút
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
