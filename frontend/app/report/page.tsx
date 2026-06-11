"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { BookOpen, Code, Database, Eye, Shield, Cpu, Activity, Check, Info } from "lucide-react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

// Hand landmarks configuration (21 points)
const connections = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [9, 10], [10, 11], [11, 12],     // Middle
  [13, 14], [14, 15], [15, 16],    // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17] // Palm bases
];

const landmarks = [
  { x: 150, y: 350 }, // 0: Wrist
  { x: 100, y: 320 }, { x: 70, y: 280 }, { x: 50, y: 240 }, { x: 30, y: 200 }, // 1-4: Thumb
  { x: 110, y: 190 }, { x: 100, y: 140 }, { x: 90, y: 100 }, { x: 80, y: 60 },  // 5-8: Index
  { x: 150, y: 170 }, { x: 150, y: 120 }, { x: 150, y: 80 }, { x: 150, y: 40 },  // 9-12: Middle
  { x: 190, y: 180 }, { x: 200, y: 130 }, { x: 210, y: 95 }, { x: 220, y: 60 },  // 13-16: Ring
  { x: 230, y: 210 }, { x: 250, y: 170 }, { x: 270, y: 140 }, { x: 290, y: 110 }  // 17-20: Pinky
];

export default function ReportPage() {
  const [activeSection, setActiveSection] = useState("vision");
  const [pipelineState, setPipelineState] = useState<"idle" | "capture" | "detect" | "heuristics">("heuristics");

  const sections = [
    { id: "vision", label: "Product Vision", icon: BookOpen },
    { id: "pipeline", label: "Gesture Pipeline", icon: Eye },
    { id: "architecture", label: "System Architecture", icon: Cpu },
    { id: "data-models", label: "Data Schemas", icon: Database },
    { id: "api-spec", label: "API Reference", icon: Code },
  ];

  return (
    <div className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans bg-[#0D1B2A] text-[#F0F4F8] min-h-screen flex flex-col`}>
      {/* Interactive Hero */}
      <div className="relative border-b border-slate-700 bg-slate-900/30 overflow-hidden py-16 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00C9A7] font-mono">
              TECHNICAL REPORT & SYSTEM ARCHITECTURE
            </span>
            <h1 className="text-4xl md:text-5xl font-bold font-display mt-2 mb-4 text-[#F0F4F8] tracking-tight">
              SignVerse AI: Interactive PRD
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              This document reviews the technology stack, ML gesture recognition pipeline, database architecture, and operational specifications of the SignVerse Indian Sign Language learning platform.
            </p>
          </div>

          {/* MediaPipe Hand Skeleton Animation SVG */}
          <div className="relative w-80 h-96 flex items-center justify-center bg-[#2A3F54]/30 rounded-3xl border border-slate-700 shadow-2xl p-4">
            <svg viewBox="0 0 320 400" className="w-full h-full">
              {/* Draw Connection Lines */}
              {connections.map(([p1, p2], idx) => (
                <line
                  key={idx}
                  x1={landmarks[p1].x}
                  y1={landmarks[p1].y}
                  x2={landmarks[p2].x}
                  y2={landmarks[p2].y}
                  stroke="#00C9A7"
                  strokeWidth="2.5"
                  strokeOpacity="0.4"
                />
              ))}

              {/* Pulsing hand connections */}
              {connections.map(([p1, p2], idx) => (
                <motion.line
                  key={`pulse-${idx}`}
                  x1={landmarks[p1].x}
                  y1={landmarks[p1].y}
                  x2={landmarks[p2].x}
                  y2={landmarks[p2].y}
                  stroke="#00C9A7"
                  strokeWidth="2"
                  animate={{ strokeDashoffset: [0, -20], strokeDasharray: ["5, 5"] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
              ))}

              {/* Landmark Dots */}
              {landmarks.map((lm, idx) => (
                <g key={idx}>
                  <motion.circle
                    cx={lm.x}
                    cy={lm.y}
                    r="9"
                    fill="#00C9A7"
                    opacity="0.15"
                    animate={{ scale: [1, 1.6, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 + (idx % 3) * 0.3, ease: "easeInOut" }}
                  />
                  <circle
                    cx={lm.x}
                    cy={lm.y}
                    r="4"
                    fill="#00C9A7"
                  />
                  <text
                    x={lm.x + 8}
                    y={lm.y + 4}
                    fill="#F0F4F8"
                    fontSize="8"
                    className="font-mono opacity-40 select-none"
                  >
                    {idx}
                  </text>
                </g>
              ))}
            </svg>
            <div className="absolute bottom-4 left-4 bg-slate-900/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-[10px] font-mono text-[#00C9A7]">
              MediaPipe Hands: 21 Landmarks
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col md:flex-row gap-8 items-start">
        {/* Sticky Left Navigation */}
        <aside className="w-full md:w-64 md:sticky md:top-20 flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 block">
            Sections
          </span>
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  activeSection === sec.id
                    ? "bg-[#2A3F54] border-[#00C9A7]/30 text-[#00C9A7]"
                    : "border-transparent text-slate-400 hover:bg-[#2A3F54]/30 hover:text-[#F0F4F8]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {sec.label}
              </a>
            );
          })}
        </aside>

        {/* Scrollable Right Content */}
        <div className="flex-1 w-full space-y-12">
          {/* Section: Product Vision */}
          <section id="vision" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-[#F0F4F8]">
              1. Product Vision & Requirements
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              SignVerse AI bridges the gap between hearing and deaf/hard-of-hearing communities by serving as a gamified, interactive training platform for Indian Sign Language (ISL).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-[#2A3F54]/40 border border-slate-700 rounded-2xl p-6">
                <h4 className="font-bold text-sm text-[#00C9A7] uppercase tracking-wider mb-2">Target Metrics</h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex gap-2 items-start"><Check className="h-4 w-4 text-[#00C9A7] shrink-0" /> Minimum 90% recognition accuracy</li>
                  <li className="flex gap-2 items-start"><Check className="h-4 w-4 text-[#00C9A7] shrink-0" /> AI feedback response under 1.0 seconds</li>
                  <li className="flex gap-2 items-start"><Check className="h-4 w-4 text-[#00C9A7] shrink-0" /> Streamlined double-handed gesture mapping</li>
                </ul>
              </div>
              <div className="bg-[#2A3F54]/40 border border-slate-700 rounded-2xl p-6">
                <h4 className="font-bold text-sm text-[#00C9A7] uppercase tracking-wider mb-2">Core MVP Scope</h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex gap-2 items-start"><Check className="h-4 w-4 text-[#00C9A7] shrink-0" /> 50 ISL signs tracked & structured</li>
                  <li className="flex gap-2 items-start"><Check className="h-4 w-4 text-[#00C9A7] shrink-0" /> Smart posture feedback metrics</li>
                  <li className="flex gap-2 items-start"><Check className="h-4 w-4 text-[#00C9A7] shrink-0" /> SQLite progress logs & achievements</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section: Gesture Pipeline */}
          <section id="pipeline" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-[#F0F4F8]">
              2. Real-Time Gesture Recognition Pipeline
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              The hand detection pipeline computes 3D skeletal data client-side and validates postures instantly. Toggle the stages below to review how joint frames are parsed:
            </p>

            {/* Interactive Pipeline State Simulator */}
            <div className="bg-[#2A3F54]/40 border border-slate-700 rounded-2xl p-6">
              <div className="flex gap-2 border-b border-slate-700 pb-4 mb-6 overflow-x-auto">
                {["capture", "detect", "heuristics"].map((state) => (
                  <button
                    key={state}
                    onClick={() => setPipelineState(state as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase transition-all ${
                      pipelineState === state
                        ? "bg-[#00C9A7] text-[#0D1B2A]"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Stage: {state}
                  </button>
                ))}
              </div>

              {pipelineState === "capture" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <h4 className="font-bold text-sm text-[#F0F4F8]">Video Stream Acquisition</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Obtains camera feed via <code className="font-mono text-[#00C9A7]">navigator.mediaDevices.getUserMedia</code> at 30fps. Mirror scaling is applied via CSS transform to enhance coordination.
                  </p>
                </motion.div>
              )}

              {pipelineState === "detect" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <h4 className="font-bold text-sm text-[#F0F4F8]">MediaPipe Landmark Fitting</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Fileset WebAssembly outputs 21 landmarks containing 3D coordinate weights <code className="font-mono text-[#00C9A7]">(x, y, z)</code>. The GPU delegate maps coordinates directly from canvas buffers.
                  </p>
                </motion.div>
              )}

              {pipelineState === "heuristics" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <h4 className="font-bold text-sm text-[#F0F4F8]">Geometric Vector Classification</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Compares absolute distances and joint angle projections to verify fingers curl states:
                  </p>
                  <pre className="font-mono text-[11px] bg-slate-950 p-4 rounded-xl text-emerald-400 overflow-x-auto">
{`function isFingerExtended(landmarks, mcp, pip, dip, tip) {
  const mcpToTip = getDistance(landmarks[mcp], landmarks[tip]);
  const segmentsSum = getDistance(landmarks[mcp], landmarks[pip]) + 
                      getDistance(landmarks[pip], landmarks[dip]) + 
                      getDistance(landmarks[dip], landmarks[tip]);
  return mcpToTip > segmentsSum * 0.75; // Verification ratio
}`}
                  </pre>
                </motion.div>
              )}
            </div>
          </section>

          {/* Section: System Architecture */}
          <section id="architecture" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-[#F0F4F8]">
              3. System Architecture
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              A dual-layer design utilizing client-side WASM computer vision alongside a thin FastAPI backend.
            </p>

            <div className="bg-[#2A3F54]/40 border border-slate-700 rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-sm text-[#00C9A7]">Architecture Flow Map</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                  <span className="text-xs font-bold text-purple-300 block mb-1">1. User Interaction</span>
                  <p className="text-[10px] text-slate-400">Webcam feeds video frame buffer to browser canvas context.</p>
                </div>
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                  <span className="text-xs font-bold text-[#00C9A7] block mb-1">2. Local Inference</span>
                  <p className="text-[10px] text-slate-400">WASM Landmarker computes landmarks & parses vectors locally.</p>
                </div>
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                  <span className="text-xs font-bold text-blue-300 block mb-1">3. REST Sync</span>
                  <p className="text-[10px] text-slate-400">Completed metrics are synced to FastAPI & stored in SQLite.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Data Schemas */}
          <section id="data-models" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-[#F0F4F8]">
              4. Database Entity schemas
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              SQLite database mappings defined using SQLAlchemy models:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#2A3F54]/40 border border-slate-700 rounded-2xl p-6">
                <h4 className="font-bold text-sm text-[#00C9A7] font-mono mb-3">Table: users</h4>
                <pre className="font-mono text-[10px] text-slate-300 bg-slate-950 p-4 rounded-xl">
{`id: Integer (Primary Key)
username: String (Unique)
email: String (Unique)
hashed_password: String
xp: Integer (default 0)
streak: Integer (default 0)
last_active: DateTime`}
                </pre>
              </div>

              <div className="bg-[#2A3F54]/40 border border-slate-700 rounded-2xl p-6">
                <h4 className="font-bold text-sm text-[#00C9A7] font-mono mb-3">Table: user_progress</h4>
                <pre className="font-mono text-[10px] text-slate-300 bg-slate-950 p-4 rounded-xl">
{`id: Integer (Primary Key)
user_id: ForeignKey('users.id')
sign_id: ForeignKey('signs.id')
completed_at: DateTime
accuracy_score: Float
status: String`}
                </pre>
              </div>
            </div>
          </section>

          {/* Section: API Spec */}
          <section id="api-spec" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-[#F0F4F8]">
              5. API Route Specifications
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Standard REST API communication layer endpoints hosted at port 8000:
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex gap-4 items-center bg-[#2A3F54]/20 border border-slate-700 p-4 rounded-xl">
                <span className="bg-emerald-500/20 text-[#00C9A7] px-2.5 py-1 rounded font-bold">POST</span>
                <span className="text-slate-200">/api/auth/signup</span>
                <span className="text-slate-500 text-[10px]">Create new user credentials</span>
              </div>
              
              <div className="flex gap-4 items-center bg-[#2A3F54]/20 border border-slate-700 p-4 rounded-xl">
                <span className="bg-emerald-500/20 text-[#00C9A7] px-2.5 py-1 rounded font-bold">POST</span>
                <span className="text-slate-200">/api/auth/login</span>
                <span className="text-slate-500 text-[10px]">Authenticate user & return JWT token</span>
              </div>

              <div className="flex gap-4 items-center bg-[#2A3F54]/20 border border-slate-700 p-4 rounded-xl">
                <span className="bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded font-bold">GET</span>
                <span className="text-slate-200">/api/dictionary</span>
                <span className="text-slate-500 text-[10px]">Retrieve list of 50 seeded signs</span>
              </div>

              <div className="flex gap-4 items-center bg-[#2A3F54]/20 border border-slate-700 p-4 rounded-xl">
                <span className="bg-emerald-500/20 text-[#00C9A7] px-2.5 py-1 rounded font-bold">POST</span>
                <span className="text-slate-200">/api/progress</span>
                <span className="text-slate-500 text-[10px]">Submit learned gestures & update XP stats</span>
              </div>
            </div>
            
            {/* Warning alert styled in amber */}
            <div className="bg-[#FFB703]/10 border border-[#FFB703]/30 rounded-2xl p-4 flex gap-3 items-start mt-6">
              <Info className="h-5 w-5 text-[#FFB703] shrink-0 mt-0.5" />
              <div className="text-xs text-[#F0F4F8]/90 leading-relaxed">
                <strong className="text-[#FFB703]">JWT Authentication Requirement:</strong> Protected routes require passing the OAuth2 authorization token inside the <code className="font-mono text-[#00C9A7] bg-slate-950 px-1 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code> request header context.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
