"use client";

import { useState } from "react";
import { Brain, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ModelTrainingPage() {
  const [selectedModel, setSelectedModel] = useState<string>("Support Vector Machine");
  const [selectedFeatureSet, setSelectedFeatureSet] = useState<string>("Combined Features");
  const [trainingInprogress, setTrainingInprogress] = useState(false);
  const [trainMetrics, setTrainMetrics] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Trainer idle.");

  const runModelTraining = async () => {
    setTrainingInprogress(true);
    setStatusMessage("Extracting features and building training batches...");
    try {
      const response = await fetch("http://localhost:8000/api/research/ml/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_name: selectedModel,
          features: selectedFeatureSet
        })
      });

      if (response.ok) {
        const metrics = await response.json();
        setTrainMetrics(metrics);
        setStatusMessage(`✓ Training completed successfully for ${selectedModel}!`);
        
        // Log experiment inside backend DB
        await fetch("http://localhost:8000/api/research/experiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${selectedModel} Landmark Experiment`,
            dataset_version: "WASM_Landmarks_v1.0",
            model_used: selectedModel,
            accuracy: metrics.accuracy,
            notes: `Trained using ${selectedFeatureSet} with SQLite landmark database samples.`
          })
        });
      } else {
        setStatusMessage("Error: Model training failed.");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Error: Network failure connecting to ML engine.");
    }
    setTrainingInprogress(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#2F241F] pb-4 gap-4">
        <div>
          <span className="font-mono text-xs text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
            MACHINE LEARNING PIPELINE
          </span>
          <h1 className="text-3xl font-black text-[#2F241F] font-display">
            ⚙️ Model Training Engine
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Fit classical structural models (SVM, Random Forest, MLP) directly on skeletal coordinates
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
        {/* TRAINING CONFIGURATION */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="lab-card p-6 border-l-4 border-[#556B2F]">
            <h3 className="font-bold text-base text-[#2F241F] mb-4 border-b border-[#2F241F]/10 pb-2 flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#556B2F]" />
              Model Configuration
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Classifier Model:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#E8DCC4] border-2 border-[#2F241F] rounded p-2 font-bold outline-none"
                >
                  <option value="Random Forest">Random Forest</option>
                  <option value="Support Vector Machine">Support Vector Machine</option>
                  <option value="Multi-Layer Perceptron">Multi-Layer Perceptron (MLP)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Feature Extraction Mode:</label>
                <select
                  value={selectedFeatureSet}
                  onChange={(e) => setSelectedFeatureSet(e.target.value)}
                  className="w-full bg-[#E8DCC4] border-2 border-[#2F241F] rounded p-2 font-bold outline-none"
                >
                  <option value="Raw Landmarks">Raw Landmarks Only (63 features)</option>
                  <option value="Finger Angles">Finger Joint Angles Only (5 features)</option>
                  <option value="Combined Features">Combined Features (Coordinates + Angles)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={runModelTraining}
                  disabled={trainingInprogress}
                  className="w-full lab-button py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {trainingInprogress ? "Fitting Classifier..." : "Execute Model Training"}
                </button>
              </div>

              <div className="text-[10px] font-bold text-center text-slate-700 bg-[#E8DCC4] p-2 rounded border border-[#2F241F]/10">
                Status: {statusMessage}
              </div>
            </div>
          </div>
        </div>

        {/* METRICS & REPORTS */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {trainMetrics ? (
            <div className="lab-card p-6">
              <h3 className="font-bold text-base text-[#2F241F] mb-4 border-b border-[#2F241F]/10 pb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                Training Report & Metrics
              </h3>

              <div className="grid grid-cols-2 gap-3 text-center font-mono text-[10px] mb-6">
                <div className="bg-[#E8DCC4] p-3 rounded border border-[#2F241F]/10">
                  <span className="block text-slate-500">Accuracy</span>
                  <strong className="text-sm text-emerald-800">{Math.round(trainMetrics.accuracy * 100)}%</strong>
                </div>
                <div className="bg-[#E8DCC4] p-3 rounded border border-[#2F241F]/10">
                  <span className="block text-slate-500">Training Time</span>
                  <strong className="text-sm text-[#3D4F73]">{trainMetrics.training_time_ms} ms</strong>
                </div>
              </div>

              <div className="space-y-2 font-mono text-[10px] text-slate-700">
                <span className="font-bold block border-b border-[#2F241F]/5 pb-1">Class-wise Metrics:</span>
                {trainMetrics.per_class_metrics?.map((m: any) => (
                  <div key={m.class_name} className="flex justify-between py-0.5 border-b border-[#2F241F]/5">
                    <span>{m.class_name}:</span>
                    <span>Precision: {m.precision} | Recall: {m.recall} | F1: {m.f1_score}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="lab-card p-6 text-center text-slate-500 font-mono text-xs py-16">
              Select model configuration and click "Execute Model Training" to generate metrics logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
