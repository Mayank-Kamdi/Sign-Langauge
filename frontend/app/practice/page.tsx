"use client";

import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { useLabStore } from "@/lib/store";
import { evaluateGesture, Landmark } from "@/lib/gestureClassifier";
import { Camera, Check, HelpCircle, AlertTriangle, Play, RefreshCw, Save } from "lucide-react";

export default function PracticePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    lessons,
    currentSignIndex,
    webcamActive,
    setWebcamActive,
    logAttempt,
    initializeStore,
  } = useLabStore();

  const currentSign = lessons[currentSignIndex];

  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [similarityScore, setSimilarityScore] = useState(0);
  const [feedback, setFeedback] = useState("Observations deck offline. Activate camera.");
  const [detectedHandsCount, setDetectedHandsCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [rawCoordinates, setRawCoordinates] = useState<Landmark[]>([]);

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
          numHands: 2,
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

  // Main Detection Loop
  useEffect(() => {
    if (!webcamActive || !landmarker || !videoRef.current || !canvasRef.current) return;

    let frameId: number;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const runDetection = () => {
      if (video.readyState >= 2) {
        const timestamp = performance.now();
        const results = landmarker.detectForVideo(video, timestamp);

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setDetectedHandsCount(results.landmarks ? results.landmarks.length : 0);

          if (results.landmarks && results.landmarks.length > 0) {
            const firstHand = results.landmarks[0] as Landmark[];
            setRawCoordinates(firstHand);
            setConfidence(results.handednesses?.[0]?.[0]?.score || 0.92);

            const handsData = results.landmarks.map((list, index) => {
              const label = results.handednesses?.[index]?.[0]?.categoryName || "Right";
              return {
                landmarks: list as Landmark[],
                handedness: (label === "Left" ? "Left" : "Right") as "Left" | "Right",
              };
            });

            // Evaluate Sign
            const evaluation = evaluateGesture(currentSign.name, handsData);
            setFeedback(evaluation.feedback);
            setSimilarityScore(Math.round(evaluation.score * 100));

            // Draw Skeletal Mesh lines
            results.landmarks.forEach((landmarks) => {
              ctx.strokeStyle = "#556B2F"; // Forest Green skeleton line
              ctx.lineWidth = 3;
              const drawLine = (pt1: number, pt2: number) => {
                ctx.beginPath();
                ctx.moveTo(landmarks[pt1].x * canvas.width, landmarks[pt1].y * canvas.height);
                ctx.lineTo(landmarks[pt2].x * canvas.width, landmarks[pt2].y * canvas.height);
                ctx.stroke();
              };
              for (let i = 0; i < 4; i++) drawLine(i, i + 1);
              for (let i = 5; i < 8; i++) drawLine(i, i + 1);
              for (let i = 9; i < 12; i++) drawLine(i, i + 1);
              for (let i = 13; i < 16; i++) drawLine(i, i + 1);
              for (let i = 17; i < 20; i++) drawLine(i, i + 1);
              drawLine(0, 5); drawLine(5, 9); drawLine(9, 13); drawLine(13, 17); drawLine(0, 17);

              // Draw point dots
              landmarks.forEach((pt) => {
                ctx.beginPath();
                ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 4, 0, 2 * Math.PI);
                ctx.fillStyle = "#B5651D"; // Burnt Orange nodes
                ctx.fill();
              });
            });
          } else {
            setSimilarityScore(0);
            setConfidence(0);
            setRawCoordinates([]);
          }
        }
      }
      frameId = requestAnimationFrame(runDetection);
    };

    runDetection();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [webcamActive, landmarker, currentSignIndex, currentSign.name]);

  // Scoring Level Descriptor
  const getScoreRating = (score: number) => {
    if (score >= 90) return { label: "Excellent Match", color: "text-[#6B8E23]" };
    if (score >= 75) return { label: "Good Attempt", color: "text-[#3D4F73]" };
    if (score >= 50) return { label: "Needs Improvement", color: "text-[#C9A227]" };
    return { label: "Try Again", color: "text-[#A0522D]" };
  };

  const scoreRating = getScoreRating(similarityScore);

  const handleRecordAttempt = () => {
    logAttempt(currentSign.name, similarityScore);
    alert(`Attempt recorded: Sign "${currentSign.name}" scored ${similarityScore}%`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Webcam observer monitor */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div>
          <span className="font-mono text-xs text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
            HARDWARE INTERFACE
          </span>
          <h2 className="text-2xl font-bold font-display text-[#2F241F]">
            ⚙️ Real-time Observation Deck
          </h2>
        </div>

        {/* Vintage Monitor Screen */}
        <div className="relative aspect-video w-full lab-monitor overflow-hidden bg-[#22252A]">
          {!webcamActive && (
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-20">
              <Camera className="h-14 w-14 text-slate-500 mb-4" />
              <h3 className="text-[#F5EBD7] font-display font-bold text-lg mb-2">Webcam Feed Inactive</h3>
              <p className="text-slate-400 text-xs max-w-sm mb-6">
                Active hand observation requires local camera frame capture processing.
              </p>
              <button
                onClick={startCamera}
                disabled={modelLoading}
                className="lab-button py-2.5 px-6 uppercase text-xs tracking-wider"
              >
                {modelLoading ? "Downloading Models..." : "Start Camera Feed"}
              </button>
            </div>
          )}

          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
          <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-10 pointer-events-none" />
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

        {/* Raw landmark joint telemetry coordinates log */}
        <div className="lab-card p-4">
          <h4 className="text-xs font-mono font-bold text-[#2F241F] border-b border-[#2F241F]/10 pb-2 mb-3">
            [Telemetry Data Log] Active Joint Coordinates
          </h4>
          <div className="max-h-[140px] overflow-y-auto font-mono text-[10px] text-slate-600 grid grid-cols-2 gap-x-6 gap-y-1 pr-2">
            {rawCoordinates.length > 0 ? (
              rawCoordinates.slice(0, 10).map((pt, idx) => (
                <div key={idx} className="flex justify-between border-b border-[#2F241F]/5 py-0.5">
                  <span>Joint #{idx}:</span>
                  <span className="text-[#3D4F73]">
                    ({pt.x.toFixed(3)}, {pt.y.toFixed(3)}, {pt.z.toFixed(3)})
                  </span>
                </div>
              ))
            ) : (
              <span className="col-span-full text-slate-500 text-center py-2">
                Waiting for active coordinate fitting frame logs...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Calculations & Logging */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Sign configuration card */}
        <div className="lab-card p-6">
          <span className="font-mono text-[10px] text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
            TARGET EXPERIMENT
          </span>
          <h3 className="text-3xl font-black text-[#2F241F] mb-1">
            Sign: {currentSign.name}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            {currentSign.description}
          </p>

          <div className="bg-[#F5EBD7] border border-[#2F241F]/15 rounded-lg p-3 text-[11px] text-slate-600 leading-relaxed font-mono">
            <strong className="text-[#3D4F73] block mb-1">Configuration instructions:</strong>
            {currentSign.guide}
          </div>
        </div>

        {/* Calculations / Similarity Score */}
        <div className="lab-card p-6 relative">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-4">
            Similarity Score Computation
          </h4>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-black font-display text-[#2F241F] tracking-tight">
              {similarityScore}%
            </span>
            <span className={`text-xs font-mono font-bold uppercase ${scoreRating.color}`}>
              ({scoreRating.label})
            </span>
          </div>

          {/* Simple retro progress bar */}
          <div className="h-4 w-full bg-[#DCC9A3] border border-[#2F241F] rounded overflow-hidden mb-6">
            <div
              style={{ width: `${similarityScore}%` }}
              className="h-full bg-[#556B2F] border-r border-[#2F241F] transition-all duration-300"
            />
          </div>

          {/* Smart feedback annotation log */}
          <div className="lab-panel p-4 border-l-4 border-l-[#B5651D] rounded-xl mb-6">
            <span className="text-[10px] font-mono text-[#B5651D] font-bold uppercase block mb-1">
              Feedback Annotation
            </span>
            <p className="text-xs text-[#2F241F] leading-relaxed">
              {feedback}
            </p>
          </div>

          {/* Record button */}
          <button
            onClick={handleRecordAttempt}
            disabled={similarityScore === 0}
            className="w-full lab-button py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Record Attempt Log
          </button>
        </div>
      </div>
    </div>
  );
}
