"use client";

import { useLabStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, ArrowRight, HelpCircle, Layers, Radio } from "lucide-react";

export default function LearnPage() {
  const router = useRouter();
  const { lessons, selectSign, initializeStore, selectedRegion } = useLabStore();
  const [activeTab, setActiveTab] = useState<"static" | "dynamic">("static");

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const handleStartPractice = (signName: string) => {
    const originalIndex = lessons.findIndex(l => l.name === signName);
    if (originalIndex !== -1) {
      selectSign(originalIndex);
      router.push("/practice");
    }
  };

  const staticLessons = lessons.filter(l => l.isStatic !== false);
  const dynamicLessons = lessons.filter(l => l.isStatic === false);
  const displayLessons = activeTab === "static" ? staticLessons : dynamicLessons;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[#2F241F]/10 pb-6">
        <div>
          <span className="font-mono text-xs text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
            {selectedRegion} VERIFIED SIGN LIBRARY
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#2F241F] tracking-tight">
            📚 Educational Sign Reference ({selectedRegion})
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Study authentic hand gestures and sequence steps. Skeletons are used purely for internal AI analysis.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 bg-[#E8DCC4] p-1 rounded-lg border-2 border-[#2F241F]">
          <button
            onClick={() => setActiveTab("static")}
            className={`px-4 py-2 text-xs font-bold font-mono rounded flex items-center gap-1.5 transition-all ${
              activeTab === "static"
                ? "bg-[#556B2F] text-white shadow"
                : "text-[#2F241F]/75 hover:bg-[#DCC9A3]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Static Signs
          </button>
          <button
            onClick={() => setActiveTab("dynamic")}
            className={`px-4 py-2 text-xs font-bold font-mono rounded flex items-center gap-1.5 transition-all ${
              activeTab === "dynamic"
                ? "bg-[#3D4F73] text-white shadow"
                : "text-[#2F241F]/75 hover:bg-[#DCC9A3]"
            }`}
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            Dynamic Signs
          </button>
        </div>
      </div>

      {/* Warning Banner for ISL/BSL */}
      {(selectedRegion === "ISL" || selectedRegion === "BSL") && (
        <div className="p-4 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-lg text-xs font-mono text-[#2F241F]">
          ⚠️ <strong>Two-Handed Language Notice:</strong> {selectedRegion} manual alphabets are traditionally two-handed. 
          Because our camera tracker is currently optimized for one-handed signs, we recommend switching the mode in the top menu to <strong>ASL (American Sign Language)</strong> for correct reference signs and real-time detection.
        </div>
      )}

      {/* Grid of lessons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayLessons.map((lesson) => (
          <div
            key={lesson.name}
            className="lab-card p-6 flex flex-col justify-between items-start gap-4 transition-all"
          >
            <div className="w-full">
              <div className="flex justify-between items-center border-b border-[#2F241F]/10 pb-2 mb-3">
                <span className="font-mono text-[9px] text-[#3D4F73] font-bold">
                  {lesson.category.toUpperCase()}
                </span>
                <span className="text-[9px] font-mono uppercase bg-[#DCC9A3] px-1.5 py-0.5 rounded border border-[#2F241F]/20 text-[#2F241F]">
                  {selectedRegion}
                </span>
              </div>
              
              <h3 className="text-2xl font-black text-[#2F241F] mb-1">
                {lesson.name}
              </h3>
              
              <p className="text-xs text-[#3B3B3B] leading-relaxed mb-3">
                {lesson.description}
              </p>

              {/* Hand Demonstration Reference */}
              <div className="my-3 w-full h-32 rounded bg-[#E8DCC4] border border-[#2F241F]/15 flex items-center justify-center relative overflow-hidden">
                {lesson.handImageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={lesson.handImageUrl}
                    alt={`${lesson.name} sign representation`}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      // fallback if image not found on disk yet
                      (e.target as HTMLElement).style.display = "none";
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent) {
                        const fallbackText = parent.querySelector(".fallback-text");
                        if (fallbackText) fallbackText.classList.remove("hidden");
                      }
                    }}
                  />
                ) : null}
                <div className={`fallback-text absolute inset-0 bg-[#2F241F]/5 font-mono text-[9px] flex flex-col items-center justify-center text-[#2F241F]/60 select-none ${lesson.handImageUrl ? "hidden" : ""}`}>
                  <span className="text-lg mb-1">📖</span>
                  <span>[ VERIFIED REFERENCE STUDY PHOTO ]</span>
                </div>
                <span className="absolute bottom-2 right-3 text-2xl font-black text-[#2F241F]/15 select-none">{lesson.name}</span>
              </div>

              {/* Verified Step-by-Step Sequence */}
              {lesson.gestureSteps && lesson.gestureSteps.length > 0 && (
                <div className="mt-3 space-y-1.5 bg-[#F5EBD7] border border-[#2F241F]/15 rounded-lg p-3">
                  <span className="text-[10px] font-mono font-bold text-[#B5651D] uppercase tracking-wider block">
                    📖 Step-by-Step Sequence:
                  </span>
                  <ol className="list-decimal pl-4 text-[10px] text-slate-700 font-mono space-y-1">
                    {lesson.gestureSteps.map((step, idx) => (
                      <li key={idx} className="leading-normal">{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <button
              onClick={() => handleStartPractice(lesson.name)}
              className="w-full lab-button py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider mt-2"
            >
              Analyze in Deck
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        ))}

        {displayLessons.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 font-mono text-xs">
            No {activeTab} signs registered for {selectedRegion} in the verified library database.
          </div>
        )}
      </div>
    </div>
  );
}
