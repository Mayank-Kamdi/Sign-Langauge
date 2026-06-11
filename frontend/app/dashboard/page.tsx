"use client";

import { useLabStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { ClipboardList, Award, Percent, Hash, Trash2 } from "lucide-react";

export default function DashboardPage() {
  const { attempts, clearHistory, initializeStore } = useLabStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    initializeStore();
    setHydrated(true);
  }, [initializeStore]);

  if (!hydrated) {
    return (
      <div className="flex-1 flex justify-center items-center font-mono text-xs">
        Loading workbook data logs...
      </div>
    );
  }

  // Calculate stats
  const totalAttempts = attempts.length;
  const bestScore = totalAttempts > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;
  const averageScore =
    totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
      : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-8">
      {/* Title */}
      <div className="flex justify-between items-start">
        <div>
          <span className="font-mono text-xs text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
            DATA ARCHIVES
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#2F241F] tracking-tight">
            📊 Research Logbook
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review experimental metric recordings and validation telemetry logs stored in this terminal sandbox.
          </p>
        </div>

        {totalAttempts > 0 && (
          <button
            onClick={() => {
              if (confirm("Reset all stored laboratory validation records?")) {
                clearHistory();
              }
            }}
            className="lab-button lab-button-warn py-2 px-4 flex items-center gap-2 text-xs uppercase font-bold tracking-wider"
          >
            <Trash2 className="h-4 w-4" />
            Clear Logbook
          </button>
        )}
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        {/* Total attempts */}
        <div className="lab-panel p-6 border-l-4 border-l-[#3D4F73] rounded-2xl flex items-center gap-4">
          <div className="bg-[#3D4F73]/10 text-[#3D4F73] rounded-xl p-3 border border-[#3D4F73]/20">
            <Hash className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-600 uppercase block font-bold">Total Attempts</span>
            <span className="text-2xl font-black text-[#2F241F]">{totalAttempts}</span>
          </div>
        </div>

        {/* Avg score */}
        <div className="lab-panel p-6 border-l-4 border-l-[#556B2F] rounded-2xl flex items-center gap-4">
          <div className="bg-[#556B2F]/10 text-[#556B2F] rounded-xl p-3 border border-[#556B2F]/20">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-600 uppercase block font-bold">Average Similarity</span>
            <span className="text-2xl font-black text-[#2F241F]">{averageScore}%</span>
          </div>
        </div>

        {/* Best score */}
        <div className="lab-panel p-6 border-l-4 border-l-[#B5651D] rounded-2xl flex items-center gap-4">
          <div className="bg-[#B5651D]/10 text-[#B5651D] rounded-xl p-3 border border-[#B5651D]/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-600 uppercase block font-bold">Best Similarity</span>
            <span className="text-2xl font-black text-[#2F241F]">{bestScore}%</span>
          </div>
        </div>
      </div>

      {/* Attempts logbook table */}
      <div className="lab-card p-6">
        <h3 className="text-lg font-bold font-display text-[#2F241F] flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5 text-[#556B2F]" />
          Record Logs Notebook
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#2F241F] text-[#2F241F]/80 pb-2">
                <th className="py-2.5 font-bold uppercase">Attempt ID</th>
                <th className="py-2.5 font-bold uppercase">Sign Name</th>
                <th className="py-2.5 font-bold uppercase">Validation Date</th>
                <th className="py-2.5 font-bold uppercase text-right">Similarity Score</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="border-b border-[#2F241F]/10 text-slate-700 hover:bg-[#DCC9A3]/20">
                  <td className="py-3 font-bold">#{attempt.id}</td>
                  <td className="py-3 font-bold text-[#2F241F]">{attempt.signName}</td>
                  <td className="py-3 text-slate-500">{attempt.timestamp}</td>
                  <td className={`py-3 text-right font-black ${
                    attempt.score >= 90 ? "text-[#6B8E23]" : attempt.score >= 75 ? "text-[#3D4F73]" : "text-[#B5651D]"
                  }`}>
                    {attempt.score}%
                  </td>
                </tr>
              ))}

              {attempts.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500 font-mono">
                    No validation experiments recorded. Visit the Practice observation deck.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
