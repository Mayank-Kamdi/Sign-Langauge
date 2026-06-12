"use client";

import React, { useEffect, useRef, useState } from "react";
import { getReferenceLandmarks, ReferenceLandmark } from "@/lib/referenceGestures";
import { Volume2, VolumeX, Sparkles, BookOpen, User } from "lucide-react";

interface AITutorGuideProps {
  signName: string;
  accuracyScore: number;
  feedbackText: string;
  isActive: boolean;
}

export default function AITutorGuide({
  signName,
  accuracyScore,
  feedbackText,
  isActive,
}: AITutorGuideProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const lastSpokenRef = useRef<string>("");

  // Determine Tutor State based on accuracy and activity
  let tutorState: "idle" | "thinking" | "guiding" | "correct" = "idle";
  if (!isActive) {
    tutorState = "idle";
  } else if (accuracyScore === 0) {
    tutorState = "thinking";
  } else if (accuracyScore >= 85) {
    tutorState = "correct";
  } else {
    tutorState = "guiding";
  }

  // Draw reference hand on reference canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw retro grid background
    ctx.strokeStyle = "rgba(47, 36, 31, 0.05)";
    ctx.lineWidth = 1;
    const gridSize = 15;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const landmarks = getReferenceLandmarks(signName);
    if (!landmarks || landmarks.length === 0) return;

    const scaleX = canvas.width;
    const scaleY = canvas.height;

    // Drawing helper line
    const drawLine = (pt1Idx: number, pt2Idx: number) => {
      const p1 = landmarks[pt1Idx];
      const p2 = landmarks[pt2Idx];
      ctx.beginPath();
      ctx.moveTo(p1.x * scaleX, p1.y * scaleY);
      ctx.lineTo(p2.x * scaleX, p2.y * scaleY);
      ctx.stroke();
    };

    // Style for AI holographic skeleton
    ctx.strokeStyle = "#3D4F73"; // Navy line
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#3D4F73";

    // Draw bones
    // Thumb
    for (let i = 0; i < 4; i++) drawLine(i, i + 1);
    // Index
    for (let i = 5; i < 8; i++) drawLine(i, i + 1);
    // Middle
    for (let i = 9; i < 12; i++) drawLine(i, i + 1);
    // Ring
    for (let i = 13; i < 16; i++) drawLine(i, i + 1);
    // Pinky
    for (let i = 17; i < 20; i++) drawLine(i, i + 1);
    // Palm connections
    drawLine(0, 5);
    drawLine(5, 9);
    drawLine(9, 13);
    drawLine(13, 17);
    drawLine(0, 17);

    // Reset shadow for joints
    ctx.shadowBlur = 0;

    // Draw joints
    landmarks.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x * scaleX, pt.y * scaleY, 5, 0, 2 * Math.PI);
      // Highlight tip joints
      if ([4, 8, 12, 16, 20].includes(idx)) {
        ctx.fillStyle = "#B5651D"; // Burnt Orange for tips
      } else {
        ctx.fillStyle = "#556B2F"; // Forest Green for normal joints
      }
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#2F241F";
      ctx.stroke();
    });
  }, [signName]);

  // Voice Speech synthesis
  useEffect(() => {
    if (!speakEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    let speechText = "";
    if (tutorState === "idle") {
      speechText = "Observations deck offline. Activate camera to start learning with me.";
    } else if (tutorState === "thinking") {
      speechText = "Show your hand clearly in front of the camera, and I will evaluate it.";
    } else if (tutorState === "correct") {
      speechText = `Excellent job! You successfully matched the sign for ${signName}.`;
    } else {
      // Speak the feedback text, cleaning it up a bit if needed
      speechText = feedbackText;
    }

    // Debounce/Prevent duplicate speaking of the same feedback
    if (speechText && speechText !== lastSpokenRef.current) {
      lastSpokenRef.current = speechText;
      window.speechSynthesis.cancel(); // cancel any active speech
      const utterance = new SpeechSynthesisUtterance(speechText);
      
      // Select a friendly English female voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.includes("Google") || voice.name.includes("Natural") || voice.name.includes("Zira") || voice.name.includes("Samantha"))
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [feedbackText, tutorState, signName, speakEnabled]);

  // Handle speaker toggle
  const toggleSpeak = () => {
    if (speakEnabled) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakEnabled(false);
    } else {
      setSpeakEnabled(true);
    }
  };

  return (
    <div className="lab-card p-6 flex flex-col gap-6 relative overflow-hidden">
      {/* Voice Toggle button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleSpeak}
          className={`p-2 rounded-lg border-2 border-[#2F241F] shadow-[2px_2px_0px_#2F241F] transition-all flex items-center justify-center ${
            speakEnabled
              ? "bg-[#556B2F] text-[#F5EBD7]"
              : "bg-[#DCC9A3] text-[#2F241F]/80"
          }`}
          title={speakEnabled ? "Mute AI Tutor Voice" : "Enable AI Tutor Voice"}
        >
          {speakEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Tutor Character Panel */}
      <div className="flex gap-4 items-center">
        {/* Animated Avatar Face */}
        <div className="relative h-20 w-20 flex-shrink-0 rounded-full border-4 border-[#2F241F] bg-[#DCC9A3] overflow-hidden flex items-center justify-center shadow-[3px_3px_0px_#2F241F]">
          {/* Animated SVG face matching retro style */}
          <svg
            viewBox="0 0 100 100"
            className={`w-full h-full transform transition-all duration-500 ${
              tutorState === "correct" ? "scale-105 animate-pulse" : "animate-none"
            }`}
          >
            {/* Hair */}
            <path d="M15 45 C15 15, 85 15, 85 45 C85 45, 90 40, 90 35 C90 15, 10 15, 10 35 C10 40, 15 45, 15 45 Z" fill="#2F241F" />
            {/* Skin */}
            <circle cx="50" cy="53" r="32" fill="#E8DCC4" stroke="#2F241F" strokeWidth="3" />
            
            {/* Blush cheeks */}
            <ellipse cx="28" cy="62" rx="6" ry="4" fill="#B5651D" fillOpacity="0.3" />
            <ellipse cx="72" cy="62" rx="6" ry="4" fill="#B5651D" fillOpacity="0.3" />

            {/* Eyes */}
            {tutorState === "correct" ? (
              // Joyful arches ^ ^
              <>
                <path d="M30 54 Q35 48 40 54" fill="none" stroke="#2F241F" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M60 54 Q65 48 70 54" fill="none" stroke="#2F241F" strokeWidth="3.5" strokeLinecap="round" />
              </>
            ) : tutorState === "thinking" ? (
              // Thinking horizontal lines or blinking
              <>
                <line x1="30" y1="52" x2="40" y2="52" stroke="#2F241F" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="60" y1="52" x2="70" y2="52" stroke="#2F241F" strokeWidth="3.5" strokeLinecap="round" />
              </>
            ) : tutorState === "guiding" ? (
              // Focused look
              <>
                <circle cx="35" cy="52" r="3.5" fill="#2F241F" />
                <circle cx="65" cy="52" r="3.5" fill="#2F241F" />
                <path d="M30 45 L40 47" stroke="#2F241F" strokeWidth="2" strokeLinecap="round" />
                <path d="M70 45 L60 47" stroke="#2F241F" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              // Idle neutral eyes
              <>
                <circle cx="35" cy="52" r="3" fill="#2F241F" className="animate-ping duration-1000 opacity-20" />
                <circle cx="35" cy="52" r="3.5" fill="#2F241F" />
                <circle cx="65" cy="52" r="3.5" fill="#2F241F" />
              </>
            )}

            {/* Mouth */}
            {tutorState === "correct" ? (
              // Big smile
              <path d="M40 65 Q50 78 60 65" fill="none" stroke="#2F241F" strokeWidth="3.5" strokeLinecap="round" />
            ) : tutorState === "thinking" ? (
              // Straight line
              <line x1="42" y1="67" x2="58" y2="67" stroke="#2F241F" strokeWidth="3.5" strokeLinecap="round" />
            ) : tutorState === "guiding" ? (
              // Small flat smile or speaking mouth
              <path d="M44 66 Q50 70 56 66" fill="none" stroke="#2F241F" strokeWidth="3" strokeLinecap="round" />
            ) : (
              // Small smile
              <path d="M42 66 Q50 74 58 66" fill="none" stroke="#2F241F" strokeWidth="3" strokeLinecap="round" />
            )}

            {/* Glasses */}
            <circle cx="35" cy="52" r="10" fill="none" stroke="#3D4F73" strokeWidth="2.5" />
            <circle cx="65" cy="52" r="10" fill="none" stroke="#3D4F73" strokeWidth="2.5" />
            <line x1="45" y1="52" x2="55" y2="52" stroke="#3D4F73" strokeWidth="2.5" />
          </svg>

          {/* Active indicator */}
          {isActive && (
            <div className="absolute bottom-0 right-0 h-4.5 w-4.5 bg-[#556B2F] border-2 border-[#2F241F] rounded-full flex items-center justify-center text-[8px] text-white">
              ✓
            </div>
          )}
        </div>

        {/* Coach Speech Bubble */}
        <div className="flex-1 min-w-0 bg-[#F5EBD7] border-2 border-[#2F241F] rounded-2xl p-3 shadow-[2px_2px_0px_#2F241F] relative">
          <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-10 border-r-[#2F241F] border-b-8 border-b-transparent">
            <div className="absolute top-[1px] -right-[1.5px] w-0 h-0 border-t-7 border-t-transparent border-r-9 border-r-[#F5EBD7] border-b-7 border-b-transparent" />
          </div>
          <span className="font-mono text-[9px] text-[#B5651D] font-black uppercase tracking-wider block mb-1">
            ANJALI (AI INSTRUCTOR)
          </span>
          <p className="text-xs text-[#2F241F] font-semibold leading-relaxed">
            {tutorState === "idle" && (
              "Welcome! I am your visual ISL Coach. Turn on the camera feed, and I will show you how to sign and help you correct your fingers."
            )}
            {tutorState === "thinking" && (
              "Hold up your hand so the camera can see it! I am ready to evaluate."
            )}
            {tutorState === "correct" && (
              "Superb! Your hand matches the template perfectly. Record your log below!"
            )}
            {tutorState === "guiding" && feedbackText}
          </p>
        </div>
      </div>

      <div className="border-t border-[#2F241F]/15 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expected Skeletal Model Panel */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] text-[#B5651D] font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> AI Model Reference Guide
          </span>
          <div className="bg-[#22252A] rounded-xl border-2 border-[#2F241F] p-2 flex items-center justify-center relative aspect-video overflow-hidden">
            <canvas
              ref={canvasRef}
              width={250}
              height={180}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 left-2 bg-[#2F241F]/80 border border-[#DCC9A3]/30 px-1.5 py-0.5 rounded text-[8px] font-mono text-[#F5EBD7]">
              EXPECTED POSTURE: {signName}
            </div>
          </div>
        </div>

        {/* Visual Tips checklist */}
        <div className="flex flex-col gap-2 justify-between">
          <div>
            <span className="font-mono text-[10px] text-[#3D4F73] font-bold uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" /> How to follow this sign:
            </span>
            <div className="mt-1.5 space-y-1.5 font-mono text-[10px] text-slate-700">
              <div className="flex items-start gap-1.5">
                <span className="text-[#556B2F] font-bold">1.</span>
                <span>Match your hand orientation to the blue skeleton lines.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[#556B2F] font-bold">2.</span>
                <span>The orange dots represent finger tip positions you need to fold/extend.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[#556B2F] font-bold">3.</span>
                <span>Watch my expression: I will smile and cheer when you get it correct!</span>
              </div>
            </div>
          </div>

          <div className="bg-[#E8DCC4] rounded-lg border border-[#2F241F]/20 p-2.5 flex items-center justify-between text-[10px] font-mono mt-2">
            <span>Progress:</span>
            <span className={`font-bold ${accuracyScore >= 85 ? "text-[#556B2F]" : "text-[#B5651D]"}`}>
              {tutorState === "correct" ? "PASSED (85%+ Match)" : "ADJUSTING"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
