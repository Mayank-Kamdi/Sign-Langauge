"use client";

import { useEffect, useState } from "react";
import { Trash2, Eye, Database, Table } from "lucide-react";
import Link from "next/link";

export default function DatasetExplorerPage() {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSample, setSelectedSample] = useState<any>(null);

  const fetchSamples = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/research/dataset");
      if (res.ok) {
        const data = await res.json();
        setSamples(data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#2F241F] pb-4 gap-4">
        <div>
          <span className="font-mono text-xs text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
            DATASET REGISTRY
          </span>
          <h1 className="text-3xl font-black text-[#2F241F] font-display">
            📂 Landmark Dataset Explorer
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Review, inspect, and audit physical coordinate records saved inside SQLite
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DCC9A3] hover:bg-[#F5EBD7] text-[#2F241F] border-2 border-[#2F241F] font-bold text-xs rounded transition-all shadow-[2px_2px_0px_#2F241F]"
        >
          ← Back to Workstation
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SAMPLES TABLE */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="lab-card p-6">
            <h3 className="font-bold text-base text-[#2F241F] mb-4 border-b border-[#2F241F]/10 pb-2 flex items-center gap-2">
              <Table className="h-5 w-5 text-[#3D4F73]" />
              Database Record Index
            </h3>

            {loading ? (
              <div className="text-center py-12 font-mono text-xs text-slate-500">
                Querying database records...
              </div>
            ) : samples.length === 0 ? (
              <div className="text-center py-12 font-mono text-xs text-slate-500">
                No landmark samples found in the database. Go to "Collect Dataset" to record gestures.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-[#E8DCC4] border-b-2 border-[#2F241F]">
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Sign</th>
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Hand</th>
                      <th className="p-2.5">Session</th>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5 text-center">Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.map((s) => (
                      <tr key={s.id} className="border-b border-[#2F241F]/10 hover:bg-[#E8DCC4]/30">
                        <td className="p-2.5 font-bold">#{s.id}</td>
                        <td className="p-2.5 font-bold text-[#556B2F]">{s.sign_name}</td>
                        <td className="p-2.5">{s.user_id}</td>
                        <td className="p-2.5">{s.handedness}</td>
                        <td className="p-2.5">Session {s.session_number}</td>
                        <td className="p-2.5 text-slate-500">{new Date(s.timestamp).toLocaleString()}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => setSelectedSample(s)}
                            className="p-1 bg-[#DCC9A3] border border-[#2F241F] rounded hover:bg-[#F5EBD7]"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#3D4F73]" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* DETAILS INSPECTOR */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="lab-card p-6">
            <h3 className="font-bold text-base text-[#2F241F] mb-4 border-b border-[#2F241F]/10 pb-2 flex items-center gap-2">
              <Database className="h-5 w-5 text-[#B5651D]" />
              Landmark Vector Inspector
            </h3>

            {selectedSample ? (
              <div className="space-y-4 font-mono text-[11px] text-slate-700">
                <div>
                  <strong>Record ID:</strong> #{selectedSample.id}
                </div>
                <div>
                  <strong>Sign Class:</strong> <span className="font-bold text-[#556B2F]">{selectedSample.sign_name}</span>
                </div>
                <div>
                  <strong>Handedness:</strong> {selectedSample.handedness} Hand
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date(selectedSample.timestamp).toLocaleString()}
                </div>

                <div className="border-t border-[#2F241F]/10 pt-3">
                  <span className="font-bold block mb-1">63 Feature Landmarks:</span>
                  <div className="max-h-[220px] overflow-y-auto bg-[#E8DCC4] p-3.5 rounded border border-[#2F241F]/15 space-y-1 text-[10px]">
                    {JSON.parse(selectedSample.landmarks).map((pt: any, idx: number) => (
                      <div key={idx} className="flex justify-between border-b border-[#2F241F]/5 py-0.5">
                        <span className="font-bold">Point {idx}:</span>
                        <span>({pt.x.toFixed(4)}, {pt.y.toFixed(4)}, {pt.z.toFixed(4)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                Select a database sample to inspect coordinate features.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
