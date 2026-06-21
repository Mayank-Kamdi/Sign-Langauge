"use client";

import { useEffect, useState } from "react";
import { BookOpen, Cpu, Calendar } from "lucide-react";
import Link from "next/link";

export default function ExperimentsRegistryPage() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExperiments = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/research/experiments");
      if (res.ok) {
        const data = await res.json();
        setExperiments(data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#2F241F] pb-4 gap-4">
        <div>
          <span className="font-mono text-xs text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
            RESEARCH REGISTRY
          </span>
          <h1 className="text-3xl font-black text-[#2F241F] font-display">
            📜 Historical Experiments Registry
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Access logs and parameters of model checkpoints saved to the physical SQLite ledger
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DCC9A3] hover:bg-[#F5EBD7] text-[#2F241F] border-2 border-[#2F241F] font-bold text-xs rounded transition-all shadow-[2px_2px_0px_#2F241F]"
        >
          ← Back to Workstation
        </Link>
      </div>

      <div className="lab-card p-6">
        <h3 className="font-bold text-base text-[#2F241F] mb-4 border-b border-[#2F241F]/10 pb-2 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#3D4F73]" />
          Experiment Ledger
        </h3>

        {loading ? (
          <div className="text-center py-12 font-mono text-xs text-slate-500">
            Reading experiment ledger...
          </div>
        ) : experiments.length === 0 ? (
          <div className="text-center py-12 font-mono text-xs text-slate-500">
            No experiments registered yet. Complete a training run in the ML Laboratory to log results.
          </div>
        ) : (
          <div className="space-y-4">
            {experiments.map((e) => (
              <div key={e.id} className="bg-[#E8DCC4] border-2 border-[#2F241F] rounded-lg p-4 font-mono text-xs text-slate-700">
                <div className="flex justify-between items-start border-b border-[#2F241F]/10 pb-2 mb-3">
                  <div>
                    <h4 className="font-bold text-[#556B2F] text-sm">{e.name}</h4>
                    <span className="text-[10px] text-slate-500">Dataset Version: {e.dataset_version}</span>
                  </div>
                  <div className="bg-[#3D4F73] text-[#F5EBD7] px-2 py-0.5 rounded text-[10px] font-bold border border-[#2F241F]">
                    Accuracy: {Math.round(e.accuracy * 100)}%
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-slate-500" />
                    <span>Model: <strong>{e.model_used}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span>Date: {new Date(e.date).toLocaleString()}</span>
                  </div>
                </div>

                {e.notes && (
                  <div className="mt-3 bg-[#DCC9A3]/50 p-2.5 rounded border border-[#2F241F]/10 text-[10px] text-slate-600 leading-relaxed">
                    <strong>Observations:</strong> {e.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
