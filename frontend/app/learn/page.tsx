"use client";

import { useLabStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, ArrowRight, HelpCircle } from "lucide-react";

export default function LearnPage() {
  const router = useRouter();
  const { lessons, selectSign, initializeStore } = useLabStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const handleStartPractice = (index: number) => {
    selectSign(index);
    router.push("/practice");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-8">
      {/* Title block */}
      <div>
        <span className="font-mono text-xs text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
          ISL STUDY SYLLABUS
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#2F241F] tracking-tight">
          📚 Study Guide Workbook
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Select a gesture lesson below to study its hand configurations before entering the Practice Deck.
        </p>
      </div>

      {/* Grid of lessons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson, index) => (
          <div
            key={lesson.name}
            className="lab-card p-6 flex flex-col justify-between items-start gap-4 transition-all"
          >
            <div className="w-full">
              <div className="flex justify-between items-center border-b border-[#2F241F]/10 pb-2 mb-3">
                <span className="font-mono text-[10px] text-[#3D4F73] font-bold">
                  LESSON #{index + 1}
                </span>
                <span className="text-[10px] font-mono uppercase bg-[#DCC9A3] px-1.5 py-0.5 rounded border border-[#2F241F]/20 text-[#2F241F]">
                  ISL Core
                </span>
              </div>
              
              <h3 className="text-2xl font-black text-[#2F241F] mb-2">
                {lesson.name}
              </h3>
              
              <p className="text-xs text-[#3B3B3B] leading-relaxed mb-4">
                {lesson.description}
              </p>

              {/* Muted instruction guide box */}
              <div className="bg-[#F5EBD7] border border-[#2F241F]/15 rounded-lg p-3 text-[11px] text-slate-600 leading-relaxed font-mono">
                <strong className="text-[#B5651D] block mb-1">Observation Guide:</strong>
                {lesson.guide}
              </div>
            </div>

            <button
              onClick={() => handleStartPractice(index)}
              className="w-full lab-button py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider mt-2"
            >
              Analyze in Deck
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
