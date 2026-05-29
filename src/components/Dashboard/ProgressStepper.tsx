import { Link } from "react-router-dom";

interface StepperProps {
    steps: { label: string; desc: string; to: string; emoji: string; key: string }[];
    stepDone: Record<string, boolean>;
}

export default function ProgressStepper({ steps, stepDone }: StepperProps) {
    return (
        <div className="flex flex-col gap-2">
            {steps.map((step, i) => {
                const done = stepDone[step.key];
                return (
                    <Link
                        key={i}
                        to={step.to}
                        className="flex items-center gap-3 rounded-xl p-3 transition-all duration-150 group"
                        style={{
                            background: done ? "#f0fdf4" : "#faf8ff",
                            border: `1px solid ${done ? "#bbf7d0" : "#ede9fe"}`,
                            textDecoration: "none",
                        }}
                    >
                        <span className="text-lg shrink-0">{done ? "✓" : step.emoji}</span>
                        <div className="flex-1 min-w-0">
                            <p
                                className="font-semibold text-sm"
                                style={{ color: done ? "#15803d" : "#1e293b" }}
                            >
                                {step.label}
                            </p>
                            <p className="text-xs text-slate-500">{step.desc}</p>
                        </div>
                        {done && (
                            <span className="text-green-500 text-base shrink-0">✓</span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}