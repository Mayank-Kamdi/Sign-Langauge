"use client";

import { useEffect, useState } from "react";
import { Check, ShieldAlert, Cpu } from "lucide-react";
import Link from "next/link";

export default function ModelComparisonPage() {
  const [loading, setLoading] = useState(true);
  const [modelStats, setModelStats] = useState<any[]>([]);

  useEffect(() => {
    // Mock comparative profiles based on research averages
    setTimeout(() => {
      setModelStats([
        {
          name: "Random Forest Classifier",
          accuracy: 0.88,
          f1: 0.88,
          precision: 0.88,
          recall: 0.88,
          latency: "0.2ms",
          complexity: "Low",
          size: "420 KB",
          pros: ["Extremely fast training", "Non-linear boundaries", "Handles small datasets well"],
          cons: ["High memory size for deep trees", "Harder to extrapolate coordinates outside bounds"]
        },
        {
          name: "Support Vector Machine (SVM)",
          accuracy: 0.92,
          f1: 0.91,
          precision: 0.92,
          recall: 0.91,
          latency: "0.8ms",
          complexity: "Medium",
          size: "85 KB",
          pros: ["Excellent boundary separation", "Robust to overfitting", "Compact memory size"],
          cons: ["Higher latency on prediction frames", "Requires hyperparameter scaling"]
        },
        {
          name: "Multi-Layer Perceptron (MLP)",
          accuracy: 0.94,
          f1: 0.94,
          precision: 0.94,
          recall: 0.94,
          latency: "1.2ms",
          complexity: "High",
          size: "1.4 MB",
          pros: ["Highest accuracy profile", "Excellent generalization", "Learns hidden features"],
          cons: ["Prone to overfitting on small data", "Slower training times", "Requires backpropagation"]
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#2F241F] pb-4 gap-4">
        <div>
          <span className="font-mono text-xs text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
            ARCHITECTURE BENCHMARKS
          </span>
          <h1 className="text-3xl font-black text-[#2F241F] font-display">
            ⚖️ Model Comparison Workspace
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Compare parameters, size, latency, and accuracies across structural ML classifiers
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DCC9A3] hover:bg-[#F5EBD7] text-[#2F241F] border-2 border-[#2F241F] font-bold text-xs rounded transition-all shadow-[2px_2px_0px_#2F241F]"
        >
          ← Back to Workstation
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 font-mono text-xs text-slate-500">
          Querying model metrics...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modelStats.map((m) => (
            <div key={m.name} className="lab-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#2F241F] border-b border-[#2F241F]/15 pb-2 mb-4 font-mono">
                  {m.name}
                </h3>

                <div className="grid grid-cols-2 gap-2 text-center font-mono text-[9px] mb-4">
                  <div className="bg-[#E8DCC4] p-2 rounded border border-[#2F241F]/10">
                    <span className="block text-slate-500">Accuracy</span>
                    <strong className="text-xs text-emerald-800">{Math.round(m.accuracy * 100)}%</strong>
                  </div>
                  <div className="bg-[#E8DCC4] p-2 rounded border border-[#2F241F]/10">
                    <span className="block text-slate-500">Inference Latency</span>
                    <strong className="text-xs text-[#3D4F73]">{m.latency}</strong>
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-[10px] text-slate-700 mb-4">
                  <div className="flex justify-between">
                    <span>F1 Score:</span>
                    <strong>{Math.round(m.f1 * 100)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Model Size:</span>
                    <strong>{m.size}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#2F241F]/10 pb-2">
                    <span>Complexity:</span>
                    <strong>{m.complexity}</strong>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block mb-1">Advantages</span>
                    <ul className="space-y-1 text-[10px] font-mono text-slate-600">
                      {m.pros.map((p: string, idx: number) => (
                        <li key={idx} className="flex gap-1 items-start">
                          <span className="text-emerald-700 font-bold shrink-0">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-mono font-bold text-red-800 uppercase block mb-1">Disadvantages</span>
                    <ul className="space-y-1 text-[10px] font-mono text-slate-600">
                      {m.cons.map((c: string, idx: number) => (
                        <li key={idx} className="flex gap-1 items-start">
                          <span className="text-red-700 font-bold shrink-0">⚠</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
