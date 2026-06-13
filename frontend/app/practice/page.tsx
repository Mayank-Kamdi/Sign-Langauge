"use client";

import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { useLabStore } from "@/lib/store";
import { evaluateStaticGesture, evaluateDynamicGesture, isSignDynamic, Landmark } from "@/lib/gestureClassifier";
import { getReferenceLandmarks } from "@/lib/referenceGestures";
import { Camera, Save } from "lucide-react";
import AITutorGuide from "@/components/AITutorGuide";
import Link from "next/link";

export default function PracticePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const userCanvasRef = useRef<HTMLCanvasElement>(null);
  const expectedCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    lessons,
    currentSignIndex,
    webcamActive,
    setWebcamActive,
    logAttempt,
    initializeStore,
    selectedRegion,
  } = useLabStore();

  const currentSign = lessons[currentSignIndex] || { name: "Hello", description: "", guide: "" };

  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [similarityScore, setSimilarityScore] = useState(0);
  const [feedback, setFeedback] = useState("Observations deck offline. Activate camera.");
  const [detectedHandsCount, setDetectedHandsCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [rawCoordinates, setRawCoordinates] = useState<Landmark[]>([]);

  // Telemetry trajectory queue for dynamic gestures
  const [trajectoryQueue, setTrajectoryQueue] = useState<any[][]>([]);
  const [incorrectFingers, setIncorrectFingers] = useState<string[]>([]);
  const [missingMovement, setMissingMovement] = useState<string>("");
  const [sequenceState, setSequenceState] = useState<string>("start");

  const signMode = isSignDynamic(currentSign.name) ? ("dynamic" as const) : ("static" as const);

  useEffect(() => {
    initializeStore();

    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        const landmarkerInstance = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        setLandmarker(landmarkerInstance);
        setModelLoading(false);
        setFeedback("AI hand landmarker loaded. Start camera to observe.");
      } catch (err) {
        console.error("MediaPipe initialization failed:", err);
        setFeedback("Error launching vision models.");
      }
    }
    initMediaPipe();
  }, [initializeStore]);

  // Handle Webcam Start
  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener("loadeddata", () => {
        setWebcamActive(true);
        setFeedback("Observing frame: Hold sign posture steady.");
      });
    } catch (err) {
      console.error(err);
      setFeedback("Webcam permissions blocked.");
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setWebcamActive(false);
    };
  }, [setWebcamActive]);

  // Render Expected Canvas Preview (Side-by-Side Left)
  useEffect(() => {
    const canvas = expectedCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw reference skeleton
    const refLandmarks = getReferenceLandmarks(currentSign.name);
    if (!refLandmarks || refLandmarks.length === 0) return;

    const scaleX = canvas.width;
    const scaleY = canvas.height;

    const drawLine = (pt1: number, pt2: number) => {
      ctx.beginPath();
      ctx.moveTo(refLandmarks[pt1].x * scaleX, refLandmarks[pt1].y * scaleY);
      ctx.lineTo(refLandmarks[pt2].x * scaleX, refLandmarks[pt2].y * scaleY);
      ctx.stroke();
    };

    ctx.strokeStyle = "#3D4F73";
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) drawLine(i, i + 1);
    for (let i = 5; i < 8; i++) drawLine(i, i + 1);
    for (let i = 9; i < 12; i++) drawLine(i, i + 1);
    for (let i = 13; i < 16; i++) drawLine(i, i + 1);
    for (let i = 17; i < 20; i++) drawLine(i, i + 1);
    drawLine(0, 5); drawLine(5, 9); drawLine(9, 13); drawLine(13, 17); drawLine(0, 17);

    refLandmarks.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x * scaleX, pt.y * scaleY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = [4, 8, 12, 16, 20].includes(idx) ? "#B5651D" : "#556B2F";
      ctx.fill();
    });
  }, [currentSign.name]);

  // Main Detection Loop (Side-by-Side Right Canvas)
  useEffect(() => {
    if (!webcamActive || !landmarker || !videoRef.current || !userCanvasRef.current || !currentSign.name) return;

    let frameId: number;
    const video = videoRef.current;
    const canvas = userCanvasRef.current;
    const ctx = canvas.getContext("2d");

    const runDetection = () => {
      if (video.readyState >= 2) {
        const timestamp = performance.now();
        const results = landmarker.detectForVideo(video, timestamp);

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const handCount = results.landmarks ? results.landmarks.length : 0;
          setDetectedHandsCount((prev) => (prev !== handCount ? handCount : prev));

          if (results.landmarks && results.landmarks.length > 0) {
            const firstHand = results.landmarks[0] as Landmark[];
            setRawCoordinates(firstHand);
            
            const conf = results.handednesses?.[0]?.[0]?.score || 0.95;
            setConfidence((prev) => (prev !== conf ? conf : prev));

            const handsData = [{
              landmarks: firstHand,
              handedness: "Right" as const
            }];

            let activeIncorrectFingers: string[] = [];

            // Evaluate according to Sign Mode
            if (signMode === "static") {
              const evaluation = evaluateStaticGesture(currentSign.name, handsData, selectedRegion);
              setFeedback((prev) => (prev !== evaluation.feedback ? evaluation.feedback : prev));
              const score = Math.round(evaluation.score * 100);
              setSimilarityScore((prev) => (prev !== score ? score : prev));
              
              activeIncorrectFingers = evaluation.incorrectFingers || [];
              setIncorrectFingers((prev) => {
                const changed = prev.length !== activeIncorrectFingers.length || 
                                prev.some((v, i) => v !== activeIncorrectFingers[i]);
                return changed ? activeIncorrectFingers : prev;
              });
              setMissingMovement((prev) => (prev !== "" ? "" : prev));
            } else {
              // Queue frames for trajectory processing
              setTrajectoryQueue((prev) => {
                const updated = [...prev, handsData].slice(-25); // retain last 25 frames
                const evaluation = evaluateDynamicGesture(currentSign.name, updated, selectedRegion);
                setFeedback((prev) => (prev !== evaluation.feedback ? evaluation.feedback : prev));
                const score = Math.round(evaluation.score * 100);
                setSimilarityScore((prev) => (prev !== score ? score : prev));
                
                const missing = evaluation.missingMovement || "";
                setMissingMovement((prev) => (prev !== missing ? missing : prev));
                
                const seq = evaluation.sequenceState || "moving";
                setSequenceState((prev) => (prev !== seq ? seq : prev));
                return updated;
              });
            }

            // Draw active skeleton with correction highlights
            results.landmarks.forEach((landmarks) => {
              const drawLine = (pt1: number, pt2: number, color: string) => {
                ctx.beginPath();
                ctx.moveTo(landmarks[pt1].x * canvas.width, landmarks[pt1].y * canvas.height);
                ctx.lineTo(landmarks[pt2].x * canvas.width, landmarks[pt2].y * canvas.height);
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.stroke();
              };

              // Determine bone color alert configurations (red/green based on alignment checks)
              // We check if fingers are incorrect to highlight them in red
              const hasIncThumb = activeIncorrectFingers.includes("Thumb");
              const hasIncIndex = activeIncorrectFingers.includes("Index");
              const hasIncMiddle = activeIncorrectFingers.includes("Middle");
              const hasIncRing = activeIncorrectFingers.includes("Ring");
              const hasIncPinky = activeIncorrectFingers.includes("Pinky");

              // Draw bones
              const tCol = hasIncThumb ? "#A0522D" : "#556B2F";
              for (let i = 0; i < 4; i++) drawLine(i, i + 1, tCol);

              const iCol = hasIncIndex ? "#A0522D" : "#556B2F";
              for (let i = 5; i < 8; i++) drawLine(i, i + 1, iCol);

              const mCol = hasIncMiddle ? "#A0522D" : "#556B2F";
              for (let i = 9; i < 12; i++) drawLine(i, i + 1, mCol);

              const rCol = hasIncRing ? "#A0522D" : "#556B2F";
              for (let i = 13; i < 16; i++) drawLine(i, i + 1, rCol);

              const pCol = hasIncPinky ? "#A0522D" : "#556B2F";
              for (let i = 17; i < 20; i++) drawLine(i, i + 1, pCol);

              // Palm bases
              ctx.strokeStyle = "#556B2F";
              drawLine(0, 5, "#556B2F"); drawLine(5, 9, "#556B2F"); drawLine(9, 13, "#556B2F"); drawLine(13, 17, "#556B2F"); drawLine(0, 17, "#556B2F");

              // Draw point nodes
              landmarks.forEach((pt, idx) => {
                ctx.beginPath();
                ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 5, 0, 2 * Math.PI);
                ctx.fillStyle = [4, 8, 12, 16, 20].includes(idx) ? "#B5651D" : "#2F241F";
                ctx.fill();
              });
            });
          } else {
            setSimilarityScore(0);
            setConfidence(0);
            setRawCoordinates([]);
            setTrajectoryQueue([]);
          }
        }
      }
      frameId = requestAnimationFrame(runDetection);
    };

    runDetection();
    return () => cancelAnimationFrame(frameId);
  }, [webcamActive, landmarker, currentSignIndex, currentSign.name, signMode]);

  const handleRecordAttempt = () => {
    logAttempt(currentSign.name, similarityScore);
    alert(`Attempt recorded: Sign "${currentSign.name}" scored ${similarityScore}%`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6">
      {/* Back Button Panel */}
      <div className="flex justify-between items-center">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DCC9A3] hover:bg-[#F5EBD7] text-[#2F241F] border-2 border-[#2F241F] font-bold text-xs rounded transition-all shadow-[2px_2px_0px_#2F241F]"
        >
          ← Back to Study Guide
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Side-by-side monitors */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div>
            <span className="font-mono text-xs text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
              OBSERVATION DECK (MODE: {signMode.toUpperCase()})
            </span>
            <h2 className="text-2xl font-bold font-display text-[#2F241F]">
              ⚙️ Real-time Side-by-Side Comparison
            </h2>
          </div>

          {/* Skeletons Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Expected Posture */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-slate-500 uppercase font-bold block">EXPECTED REFERENCE SHAPE</span>
              <div className="bg-[#22252A] rounded-xl border-2 border-[#2F241F] aspect-video relative flex items-center justify-center overflow-hidden">
                <canvas ref={expectedCanvasRef} width={320} height={240} className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Right: Active Webcam Skeleton */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-slate-500 uppercase font-bold block">ACTIVE USER WEBCAM (HIGHLIGHTED)</span>
              <div className="bg-[#22252A] rounded-xl border-2 border-[#2F241F] aspect-video relative flex items-center justify-center overflow-hidden">
                {!webcamActive && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4 z-20">
                    <button
                      onClick={startCamera}
                      disabled={modelLoading}
                      className="lab-button py-2 px-4 uppercase text-[10px] tracking-wider font-mono"
                    >
                      {modelLoading ? "Loading MediaPipe..." : "Start Camera Feed"}
                    </button>
                  </div>
                )}
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-30" />
                <canvas ref={userCanvasRef} width={320} height={240} className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-10 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Observation statistics panels */}
          <div className="grid grid-cols-3 gap-4 font-mono text-xs">
            <div className="lab-panel p-3 text-center">
              <span className="text-slate-600 block text-[10px] uppercase font-bold">Hands Detected</span>
              <span className="text-lg font-bold text-[#2F241F]">{detectedHandsCount}</span>
            </div>
            <div className="lab-panel p-3 text-center">
              <span className="text-slate-600 block text-[10px] uppercase font-bold">Landmark Nodes</span>
              <span className="text-lg font-bold text-[#2F241F]">
                {detectedHandsCount > 0 ? "21 / Hand" : "0"}
              </span>
            </div>
            <div className="lab-panel p-3 text-center">
              <span className="text-slate-600 block text-[10px] uppercase font-bold">Fitting Confidence</span>
              <span className="text-lg font-bold text-[#2F241F]">{Math.round(confidence * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Tutor & Logging */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="lab-card p-6">
            <span className="font-mono text-[10px] text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
              TARGET GESTURE
            </span>
            <h3 className="text-3xl font-black text-[#2F241F] mb-1">
              Sign: {currentSign.name}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {currentSign.description || "Select a lesson to begin."}
            </p>

            <div className="bg-[#F5EBD7] border border-[#2F241F]/15 rounded-lg p-3 text-[11px] text-slate-600 leading-relaxed font-mono">
              <strong className="text-[#3D4F73] block mb-1">Instructions:</strong>
              {currentSign.guide || "No instructions loaded."}
            </div>
          </div>

          {/* AI Tutor Companion */}
          <AITutorGuide
            signName={currentSign.name}
            accuracyScore={similarityScore}
            feedbackText={feedback}
            isActive={webcamActive}
            incorrectFingers={incorrectFingers}
            missingMovement={missingMovement}
            mode={signMode}
            sequenceState={sequenceState}
          />

          {/* Similarity Score */}
          <div className="lab-card p-6 relative">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-4">
              Accuracy / Progress Score
            </h4>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black font-display text-[#2F241F] tracking-tight">
                {similarityScore}%
              </span>
              <span className={`text-xs font-mono font-bold uppercase ${similarityScore >= 80 ? "text-emerald-800" : "text-amber-800"}`}>
                ({similarityScore >= 80 ? "Matched" : "Adjusting"})
              </span>
            </div>

            <div className="h-4 w-full bg-[#DCC9A3] border border-[#2F241F] rounded overflow-hidden mb-6">
              <div
                style={{ width: `${similarityScore}%` }}
                className="h-full bg-[#556B2F] border-r border-[#2F241F] transition-all duration-300"
              />
            </div>

            <button
              onClick={handleRecordAttempt}
              disabled={similarityScore === 0}
              className="w-full lab-button py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
            >
              Record Attempt Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
