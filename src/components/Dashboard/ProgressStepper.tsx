import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

interface StepperProps {
    steps: { label: string; desc: string; to: string; icon: LucideIcon; key: string }[];
    stepDone: Record<string, boolean>;
}

export default function ProgressStepper({ steps, stepDone }: StepperProps) {
    return (
        <div className="flex flex-col gap-2">
            {steps.map((step, i) => {
                const done = stepDone[step.key];
                const Icon = step.icon;
                return (
                    <Link
                        key={i}
                        to={step.to}
                        className="flex items-center gap-4 rounded-2xl p-4 transition-all duration-150 group bg-white border border-slate-200 hover:border-slate-300 shadow-sm"
                        style={{
                            background: done ? "#f0fdf4" : undefined,
                            borderColor: done ? "#bbf7d0" : undefined,
                        }}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700'}`}>
                            {done ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className="font-bold text-base"
                                style={{ color: done ? "#15803d" : "#0f172a" }}
                            >
                                {step.label}
                            </p>
                            <p className="text-sm text-slate-500 mt-0.5">{step.desc}</p>
                        </div>
                        {done && (
                            <span className="text-green-500 shrink-0">
                                <Check size={20} strokeWidth={3} />
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}