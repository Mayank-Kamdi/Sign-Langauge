"use client";

import React, { useEffect, useRef, useState } from "react";
import { getReferenceLandmarks } from "@/lib/referenceGestures";
import { Volume2, VolumeX, Sparkles, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface AITutorGuideProps {
  signName: string;
  accuracyScore: number;
  feedbackText: string;
  isActive: boolean;
  incorrectFingers?: string[];
  missingMovement?: string;
  mode: "static" | "dynamic";
  sequenceState?: string;
}

export default function AITutorGuide({
  signName,
  accuracyScore,
  feedbackText,
  isActive,
  incorrectFingers = [],
  missingMovement = "",
  mode,
  sequenceState,
}: AITutorGuideProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const lastSpokenRef = useRef<string>("");

  let tutorState: "idle" | "thinking" | "guiding" | "correct" = "idle";
  if (!isActive) {
    tutorState = "idle";
  } else if (accuracyScore === 0) {
    tutorState = "thinking";
  } else if (accuracyScore >= 80) {
    tutorState = "correct";
  } else {
    tutorState = "guiding";
  }

  // Draw expected posture landmarks on reference canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = "rgba(47, 36, 31, 0.05)";
    ctx.lineWidth = 1;
    const gridSize = 15;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const landmarks = getReferenceLandmarks(signName);
    if (!landmarks || landmarks.length === 0) return;

    const scaleX = canvas.width;
    const scaleY = canvas.height;

    const drawLine = (pt1Idx: number, pt2Idx: number) => {
      const p1 = landmarks[pt1Idx];
      const p2 = landmarks[pt2Idx];
      ctx.beginPath();
      ctx.moveTo(p1.x * scaleX, p1.y * scaleY);
      ctx.lineTo(p2.x * scaleX, p2.y * scaleY);
      ctx.stroke();
    };

    ctx.strokeStyle = "#3D4F73";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    // Draw lines
    for (let i = 0; i < 4; i++) drawLine(i, i + 1);
    for (let i = 5; i < 8; i++) drawLine(i, i + 1);
    for (let i = 9; i < 12; i++) drawLine(i, i + 1);
    for (let i = 13; i < 16; i++) drawLine(i, i + 1);
    for (let i = 17; i < 20; i++) drawLine(i, i + 1);
    drawLine(0, 5); drawLine(5, 9); drawLine(9, 13); drawLine(13, 17); drawLine(0, 17);

    // Draw joints
    landmarks.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x * scaleX, pt.y * scaleY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = [4, 8, 12, 16, 20].includes(idx) ? "#B5651D" : "#556B2F";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#2F241F";
      ctx.stroke();
    });
  }, [signName]);

  // Voice output control
  useEffect(() => {
    if (!speakEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    let speechText = "";
    if (tutorState === "idle") {
      speechText = "Tutor offline. Turn on the camera feed.";
    } else if (tutorState === "thinking") {
      speechText = "Show your hand gesture in the camera frame.";
    } else if (tutorState === "correct") {
      speechText = `Excellent! You successfully matched ${signName}.`;
    } else {
      speechText = feedbackText;
    }

    if (speechText && speechText !== lastSpokenRef.current) {
      lastSpokenRef.current = speechText;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      window.speechSynthesis.speak(utterance);
    }
  }, [feedbackText, tutorState, signName, speakEnabled]);

  // Generate step-by-step guidelines
  const getStepGuide = () => {
    const name = signName.toUpperCase().trim();
    if (mode === "dynamic") {
      if (name === "HELLO" || name === "GOODBYE") {
        return [
          "1. Start: Raise hand to forehead, palm facing forward.",
          "2. Movement Path: Wave hand side-to-side horizontally.",
          "3. End: Relax hand to chest level."
        ];
      }
      if (name === "THANK YOU") {
        return [
          "1. Start: Touch fingertips of flat hand to your chin.",
          "2. Movement Path: Bring hand down and outward towards the camera.",
          "3. End: Position hand open palm up at chest height."
        ];
      }
      if (name === "HOW ARE YOU") {
        return [
          "1. Start: Bring chest height hands forward near body.",
          "2. Movement Path: Rotate wrists outwards and extend fingers.",
          "3. End: Point hands open-palmed facing the camera."
        ];
      }
      return [
        "1. Start: Place hand in front of camera.",
        "2. Movement Path: Follow specific motion path instructions.",
        "3. End: Hold steady at target position."
      ];
    }

    // Static guides
    return [
      "1. Match your hand to the target reference skeleton shape.",
      "2. Check that the correct fingers are extended or folded.",
      "3. Hold the pose steady within the fitting boundary."
    ];
  };

  return (
    <div className="lab-card p-6 flex flex-col gap-5 relative overflow-hidden">
      {/* Speaker Toggle Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setSpeakEnabled(!speakEnabled)}
          className={`p-2 rounded border-2 border-[#2F241F] shadow-[2px_2px_0px_#2F241F] transition-all flex items-center justify-center ${
            speakEnabled ? "bg-[#556B2F] text-[#F5EBD7]" : "bg-[#DCC9A3] text-[#2F241F]"
          }`}
        >
          {speakEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>

      {/* Instructor Chat Bubble */}
      <div className="flex gap-4 items-start">
        {/* Character Icon */}
        <div className="h-16 w-16 rounded-full border-4 border-[#2F241F] bg-[#DCC9A3] flex items-center justify-center font-bold text-xl text-[#2F241F]">
          👩‍🏫
        </div>

        <div className="flex-1 bg-[#F5EBD7] border-2 border-[#2F241F] rounded-xl p-3 shadow-[2px_2px_0px_#2F241F] relative">
          <span className="font-mono text-[9px] text-[#B5651D] font-black uppercase tracking-wider block mb-1">
            ANJALI (AI INSTRUCTOR)
          </span>
          <p className="text-xs text-[#2F241F] font-bold leading-relaxed">
            {tutorState === "idle" && "Tutor offline: Please activate the camera feed."}
            {tutorState === "thinking" && "Hold your hand steady in front of the camera."}
            {tutorState === "correct" && `✓ Perfect! You completed the sign: ${signName}.`}
            {tutorState === "guiding" && feedbackText}
          </p>
        </div>
      </div>

      {/* Reference Skeletal Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#2F241F]/10 pt-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[9px] text-[#B5651D] font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Reference Pose Target
          </span>
          <div className="bg-[#22252A] rounded-xl border-2 border-[#2F241F] p-2 flex items-center justify-center relative aspect-video">
            <canvas ref={canvasRef} width={250} height={180} className="w-full h-full object-contain" />
            <div className="absolute top-2 left-2 bg-[#2F241F]/80 px-2 py-0.5 rounded text-[8px] font-mono text-white">
              Target Posture: {signName} ({mode.toUpperCase()})
            </div>
          </div>
        </div>

        {/* Step-by-Step Instructions & Quality feedback */}
        <div className="flex flex-col gap-3 justify-between">
          <div className="space-y-2">
            <span className="font-mono text-[9px] text-[#3D4F73] font-bold uppercase tracking-wider block">
              Step-by-step Guide
            </span>
            <div className="space-y-1 font-mono text-[10px] text-slate-700">
              {getStepGuide().map((step, idx) => (
                <div key={idx} className="leading-relaxed">
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Diagnostics Alerts */}
          <div className="bg-[#E8DCC4] p-3 rounded border border-[#2F241F]/15 font-mono text-[10px]">
            {mode === "static" ? (
              <div className="space-y-1">
                <span className="font-bold text-[#B5651D] block">FINGERS STATUS:</span>
                {incorrectFingers.length > 0 ? (
                  <div className="flex items-center gap-1 text-red-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Incorrect: {incorrectFingers.join(", ")}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-800">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>All fingers aligned!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <span className="font-bold text-[#3D4F73] block">MOTION STATUS:</span>
                {missingMovement ? (
                  <div className="flex items-center gap-1 text-red-800">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Missing: {missingMovement}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-800">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Motion path matching!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
