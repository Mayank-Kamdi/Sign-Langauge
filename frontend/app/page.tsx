"use client";

import Link from "next/link";
import { useLabStore } from "@/lib/store";
import { useEffect } from "react";
import { ClipboardList, BookOpen, Settings, Info } from "lucide-react";

export default function Home() {
  const initializeStore = useLabStore((state) => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <div className="flex-1 lab-grid flex flex-col justify-center items-center py-12 px-6">
      {/* Vintage Laboratory Notebook Container */}
      <div className="max-w-3xl w-full lab-card p-8 md:p-12 relative overflow-hidden">
        {/* Binder Holes representation on the left */}
        <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-around pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-5 h-5 rounded-full bg-[#2F241F] shadow-[inset_2px_2px_0_rgba(0,0,0,0.4)]" />
          ))}
        </div>

        <div className="pl-6 md:pl-10 space-y-8">
          {/* Notebook Header */}
          <div className="border-b-2 border-dashed border-[#2F241F] pb-6">
            <span className="font-mono text-xs uppercase tracking-widest text-[#B5651D] block mb-1">
              HUMAN-COMPUTER INTERACTION DIVISION • PROJECT REPORT
            </span>
            <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-[#2F241F]">
              SignVerse AI
            </h1>
            <p className="text-sm font-mono text-[#3D4F73] mt-2">
              Phase 1 Research Prototype: ASL Gesture Recognition
            </p>
          </div>

          {/* Research Objectives */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-display text-[#2F241F] flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#556B2F]" />
              Experimental Objectives
            </h3>
            <p className="text-sm leading-relaxed text-[#3B3B3B]">
              This workstation serves as a research platform evaluating the viability of client-side, real-time computer vision heuristics for teaching American Sign Language (ASL) fingerspelling. 
              The prototype accesses local webcam hardware, tracks 21 hand joints, and logs similarity configurations against structured sign representations.
            </p>
          </div>

          {/* Blueprint Section */}
          <div className="lab-panel p-5 rounded-xl border-l-4 border-l-[#3D4F73]">
            <h4 className="font-bold font-mono text-xs text-[#3D4F73] uppercase tracking-wider mb-2">
              Pipeline Blueprint
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono text-[#2F241F]/80">
              <div className="p-2 border border-[#2F241F]/20 bg-[#F5EBD7] rounded">
                [01] Webcam Frame
              </div>
              <div className="p-2 border border-[#2F241F]/20 bg-[#F5EBD7] rounded">
                [02] Joint Fitting
              </div>
              <div className="p-2 border border-[#2F241F]/20 bg-[#F5EBD7] rounded">
                [03] Score Logs
              </div>
            </div>
          </div>

          {/* Operations Button panel */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/learn" className="flex-1">
              <button className="w-full lab-button lab-button-accent py-4 text-center text-sm uppercase tracking-wider">
                📚 Study Lesson Guides
              </button>
            </Link>
            <Link href="/practice" className="flex-1">
              <button className="w-full lab-button py-4 text-center text-sm uppercase tracking-wider">
                ⚙️ Open Observation Deck
              </button>
            </Link>
          </div>

          {/* Warnings & Notes */}
          <div className="flex gap-2 items-start border border-[#C9A227]/30 bg-[#C9A227]/5 p-4 rounded-lg">
            <Info className="h-5 w-5 text-[#C9A227] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#3B3B3B]/90 font-mono">
              Note: This is an academic research application. All landmark metrics calculations and observation logs are preserved strictly inside your browser's local sandbox storage directory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
