"use client";

import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { useLabStore } from "@/lib/store";
import { getDistance, Landmark } from "@/lib/gestureClassifier";
import { getReferenceLandmarks } from "@/lib/referenceGestures";
import { Camera, Sparkles, Brain, Award, Play, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function MLLabPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { selectedRegion } = useLabStore();

  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [webcamActive, setWebcamActive] = useState(false);
  const [rawCoordinates, setRawCoordinates] = useState<Landmark[]>([]);
  const [handedness, setHandedness] = useState<"Right" | "Left">("Right");

  // Model Training Form & Metrics
  const [selectedModel, setSelectedModel] = useState<string>("Support Vector Machine");
  const [selectedFeatureSet, setSelectedFeatureSet] = useState<string>("Combined Features");
  const [trainingInprogress, setTrainingInprogress] = useState(false);
  const [trainMetrics, setTrainMetrics] = useState<any>(null);

  // Real-time feature extraction states
  const [fingerAngles, setFingerAngles] = useState({
    thumb: 180,
    index: 180,
    middle: 180,
    ring: 180,
    pinky: 180
  });
  const [handSpread, setHandSpread] = useState(0);
  const [palmDirection, setPalmDirection] = useState("Facing Camera");

  // Gesture Assessment
  const [selectedTargetSign, setSelectedTargetSign] = useState("Hello");
  const [assessmentScores, setAssessmentScores] = useState({
    alignment: 0,
    orientation: 0,
    distance: 0,
    overall: 0
  });
  const [personalizedFeedback, setPersonalizedFeedback] = useState<string[]>(["Activate observer deck to start diagnostics."]);

  // Initialize MediaPipe
  useEffect(() => {
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
      } catch (err) {
        console.error(err);
      }
    }
    initMediaPipe();
  }, []);

  // Helper to calculate angle between 3 points: A -> B -> C (angle at B)
  const calculateJointAngle = (a: Landmark, b: Landmark, c: Landmark): number => {
    if (!a || !b || !c) return 180;
    const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
    const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    if (mag1 * mag2 === 0) return 180;
    const cosTheta = dotProduct / (mag1 * mag2);
    // Clamp to [-1, 1]
    const clamped = Math.max(-1, Math.min(1, cosTheta));
    return Math.round((Math.acos(clamped) * 180) / Math.PI);
  };

  // Webcam controls
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
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Detection loop & Feature Extraction
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
          if (results.landmarks && results.landmarks.length > 0) {
            const lm = results.landmarks[0] as Landmark[];
            setRawCoordinates(lm);

            const label = results.handednesses?.[0]?.[0]?.categoryName || "Right";
            setHandedness(label === "Left" ? "Left" : "Right");

            // Draw Hand Skeleton
            ctx.strokeStyle = "#556B2F";
            ctx.lineWidth = 3;
            const drawLine = (pt1: number, pt2: number) => {
              ctx.beginPath();
              ctx.moveTo(lm[pt1].x * canvas.width, lm[pt1].y * canvas.height);
              ctx.lineTo(lm[pt2].x * canvas.width, lm[pt2].y * canvas.height);
              ctx.stroke();
            };
            for (let i = 0; i < 4; i++) drawLine(i, i + 1);
            for (let i = 5; i < 8; i++) drawLine(i, i + 1);
            for (let i = 9; i < 12; i++) drawLine(i, i + 1);
            for (let i = 13; i < 16; i++) drawLine(i, i + 1);
            for (let i = 17; i < 20; i++) drawLine(i, i + 1);
            drawLine(0, 5); drawLine(5, 9); drawLine(9, 13); drawLine(13, 17); drawLine(0, 17);

            lm.forEach((pt) => {
              ctx.beginPath();
              ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 4, 0, 2 * Math.PI);
              ctx.fillStyle = "#B5651D";
              ctx.fill();
            });

            // Feature Engineering: Calculate flex angles
            const tAngle = calculateJointAngle(lm[1], lm[2], lm[4]);
            const iAngle = calculateJointAngle(lm[5], lm[6], lm[8]);
            const mAngle = calculateJointAngle(lm[9], lm[10], lm[12]);
            const rAngle = calculateJointAngle(lm[13], lm[14], lm[16]);
            const pAngle = calculateJointAngle(lm[17], lm[18], lm[20]);

            setFingerAngles({
              thumb: tAngle,
              index: iAngle,
              middle: mAngle,
              ring: rAngle,
              pinky: pAngle
            });

            // Hand spread: Distance between thumb tip and pinky tip
            const spread = Math.round(getDistance(lm[4], lm[20]) * 100);
            setHandSpread(spread);

            // Palm Direction: Check normal vector of palm bases (5, 17) relative to wrist (0)
            const checkY = lm[9].y < lm[0].y;
            setPalmDirection(checkY ? "Facing Camera / Upright" : "Facing Away / Horizontal");

            // Gesture Quality Assessment against Target Sign Reference
            const ref = getReferenceLandmarks(selectedTargetSign);
            if (ref && ref.length === 21) {
              // 1. Calculate Finger Alignment score based on angles differences
              const refTAngle = calculateJointAngle(ref[1], ref[2], ref[4]);
              const refIAngle = calculateJointAngle(ref[5], ref[6], ref[8]);
              const refMAngle = calculateJointAngle(ref[9], ref[10], ref[12]);
              const refRAngle = calculateJointAngle(ref[13], ref[14], ref[16]);
              const refPAngle = calculateJointAngle(ref[17], ref[18], ref[20]);

              const diffSum = Math.abs(tAngle - refTAngle) + 
                              Math.abs(iAngle - refIAngle) + 
                              Math.abs(mAngle - refMAngle) + 
                              Math.abs(rAngle - refRAngle) + 
                              Math.abs(pAngle - refPAngle);

              const alignmentScore = Math.max(0, Math.round(100 - (diffSum / 5)));
              
              // 2. Orientation Score
              const orientationScore = lm[12].y < lm[0].y === ref[12].y < ref[0].y ? 100 : 40;

              // 3. Distance Score (relative tip distance match)
              const detDist = getDistance(lm[4], lm[8]);
              const refDist = getDistance(ref[4], ref[8]);
              const distanceScore = Math.max(0, Math.round(100 - Math.abs(detDist - refDist) * 300));

              // 4. Overall score
              const overall = Math.round(alignmentScore * 0.4 + orientationScore * 0.3 + distanceScore * 0.3);

              setAssessmentScores({
                alignment: alignmentScore,
                orientation: orientationScore,
                distance: distanceScore,
                overall: overall
              });

              // Personalized Feedback Engine based on joint analysis
              const feedback: string[] = [];
              if (overall >= 88) {
                feedback.push("✓ Perfect! Alignment matches expert reference model.");
              } else {
                if (iAngle > 120 && refIAngle < 90) feedback.push("💡 Extend your Index finger straighter.");
                if (iAngle < 90 && refIAngle > 120) feedback.push("💡 Curl in your Index finger.");
                if (mAngle > 120 && refMAngle < 90) feedback.push("💡 Extend your Middle finger straight.");
                if (mAngle < 90 && refMAngle > 120) feedback.push("💡 Fold in your Middle finger.");
                if (rAngle > 120 && refRAngle < 90) feedback.push("💡 Extend your Ring finger.");
                if (rAngle < 90 && refRAngle > 120) feedback.push("💡 Curl your Ring finger into your palm.");
                if (pAngle > 120 && refPAngle < 90) feedback.push("💡 Raise your Pinky finger.");
                if (pAngle < 90 && refPAngle > 120) feedback.push("💡 Curl in your Pinky finger.");
                if (tAngle < 90 && refTAngle > 110) feedback.push("💡 Extend your Thumb outward.");
                if (tAngle > 110 && refTAngle < 90) feedback.push("💡 Fold your Thumb inwards.");
                if (Math.abs(spread - Math.round(getDistance(ref[4], ref[20]) * 100)) > 10) {
                  feedback.push(spread > Math.round(getDistance(ref[4], ref[20]) * 100) ? "💡 Bring your fingers closer together." : "💡 Spread your hand wider.");
                }
              }
              setPersonalizedFeedback(feedback);
            }
          }
        }
      }
      frameId = requestAnimationFrame(runDetection);
    };

    runDetection();
    return () => cancelAnimationFrame(frameId);
  }, [webcamActive, landmarker, selectedTargetSign]);

  // Train Landmark ML model
  const runModelTraining = async () => {
    setTrainingInprogress(true);
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
      }
    } catch (err) {
      alert("Failed to complete ML model training.");
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
            ⚙️ ML Laboratory & Feature Explorer
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Extract features, configure training parameters, train classical classifiers, and audit posture accuracy
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DCC9A3] hover:bg-[#F5EBD7] text-[#2F241F] border-2 border-[#2F241F] font-bold text-xs rounded transition-all shadow-[2px_2px_0px_#2F241F]"
        >
          ← Back to Workstation
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* WEBCAM & FEATURE EXTRACTION VECTORS */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="lab-card p-4">
            <span className="font-mono text-[10px] text-slate-500 uppercase font-bold block mb-2">Webcam Hand Observer</span>
            <div className="relative aspect-video w-full lab-monitor overflow-hidden bg-[#22252A] mb-3">
              {!webcamActive && (
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4 z-20">
                  <Camera className="h-10 w-10 text-slate-500 mb-2" />
                  <button
                    onClick={startCamera}
                    disabled={modelLoading}
                    className="lab-button py-1.5 px-3 uppercase text-[9px] tracking-wider font-mono"
                  >
                    {modelLoading ? "Loading MediaPipe..." : "Start Webcam Feed"}
                  </button>
                </div>
              )}
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-10 pointer-events-none" />
            </div>

            <div className="font-mono text-[10px] text-slate-600 space-y-1.5 border-t border-[#2F241F]/10 pt-3">
              <span className="font-bold text-[#B5651D] block">Engineered Local Features:</span>
              <div className="flex justify-between">
                <span>Handedness:</span>
                <strong className="text-[#2F241F]">{rawCoordinates.length > 0 ? handedness : "N/A"}</strong>
              </div>
              <div className="flex justify-between">
                <span>Hand Spread Rating:</span>
                <strong className="text-[#2F241F]">{handSpread} units</strong>
              </div>
              <div className="flex justify-between">
                <span>Palm Orientation:</span>
                <strong className="text-[#2F241F]">{palmDirection}</strong>
              </div>
            </div>
          </div>

          {/* REAL-TIME FINGER ANGLES */}
          <div className="lab-card p-6">
            <h3 className="font-bold text-sm text-[#2F241F] mb-3 font-mono border-b border-[#2F241F]/10 pb-1 uppercase tracking-wider">Finger Joint Angles</h3>
            <div className="space-y-3 font-mono text-xs text-slate-700">
              <div className="flex justify-between items-center">
                <span>Thumb Flex Angle:</span>
                <strong className="text-[#3D4F73]">{fingerAngles.thumb}°</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Index Flex Angle:</span>
                <strong className="text-[#3D4F73]">{fingerAngles.index}°</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Middle Flex Angle:</span>
                <strong className="text-[#3D4F73]">{fingerAngles.middle}°</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Ring Flex Angle:</span>
                <strong className="text-[#3D4F73]">{fingerAngles.ring}°</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Pinky Flex Angle:</span>
                <strong className="text-[#3D4F73]">{fingerAngles.pinky}°</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ML MODEL TRAINER & EXPERIMENTS */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="lab-card p-6 border-l-4 border-[#556B2F]">
            <h3 className="font-bold text-base text-[#2F241F] mb-4 border-b border-[#2F241F]/10 pb-2 flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#556B2F]" />
              Model Training Panel
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
            </div>
          </div>

          {/* TRAINING METRICS REPORT */}
          {trainMetrics && (
            <div className="lab-card p-6">
              <h3 className="font-bold text-sm text-[#2F241F] mb-3 font-mono border-b border-[#2F241F]/10 pb-1">
                Evaluation Metrics
              </h3>
              <div className="grid grid-cols-2 gap-2 text-center font-mono text-[10px] mb-4">
                <div className="bg-[#E8DCC4] p-2 rounded border border-[#2F241F]/10">
                  <span className="block text-slate-500">Accuracy</span>
                  <strong className="text-xs text-emerald-800">{Math.round(trainMetrics.accuracy * 100)}%</strong>
                </div>
                <div className="bg-[#E8DCC4] p-2 rounded border border-[#2F241F]/10">
                  <span className="block text-slate-500">F1 Score</span>
                  <strong className="text-xs text-[#2F241F]">{Math.round(trainMetrics.f1_score * 100)}%</strong>
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-[10px] text-slate-700">
                {trainMetrics.per_class_metrics?.map((m: any) => (
                  <div key={m.class_name} className="flex justify-between border-b border-[#2F241F]/5 py-0.5">
                    <span>{m.class_name}</span>
                    <span>Precision: {m.precision} | Recall: {m.recall}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GESTURE QUALITY & FEEDBACK ENGINE */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="lab-card p-6 border-l-4 border-[#B5651D]">
            <div className="flex justify-between items-center mb-3 border-b border-[#2F241F]/10 pb-1">
              <h3 className="font-bold text-base text-[#2F241F] flex items-center gap-2 font-display">
                <Award className="h-5 w-5 text-[#B5651D]" />
                Gesture Assessment
              </h3>
              <select
                value={selectedTargetSign}
                onChange={(e) => setSelectedTargetSign(e.target.value)}
                className="bg-[#DCC9A3] border border-[#2F241F] font-mono text-[10px] font-bold rounded p-1 outline-none"
              >
                <option value="Hello">Hello</option>
                <option value="Thank You">Thank You</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Please">Please</option>
                <option value="Sorry">Sorry</option>
              </select>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-baseline justify-between mb-2 bg-[#E8DCC4] p-3 rounded border border-[#2F241F]/10">
                <span className="text-slate-600 text-[10px] uppercase font-bold">Overall Quality</span>
                <span className="text-3xl font-black text-[#2F241F]">{assessmentScores.overall} / 100</span>
              </div>

              <div className="space-y-2 text-[10px] text-slate-700">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Finger Alignment Score:</span>
                    <strong>{assessmentScores.alignment}%</strong>
                  </div>
                  <div className="h-2 w-full bg-[#E8DCC4] border border-[#2F241F] rounded overflow-hidden">
                    <div style={{ width: `${assessmentScores.alignment}%` }} className="h-full bg-[#556B2F]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Orientation Match:</span>
                    <strong>{assessmentScores.orientation}%</strong>
                  </div>
                  <div className="h-2 w-full bg-[#E8DCC4] border border-[#2F241F] rounded overflow-hidden">
                    <div style={{ width: `${assessmentScores.orientation}%` }} className="h-full bg-[#3D4F73]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Joint Distances Rating:</span>
                    <strong>{assessmentScores.distance}%</strong>
                  </div>
                  <div className="h-2 w-full bg-[#E8DCC4] border border-[#2F241F] rounded overflow-hidden">
                    <div style={{ width: `${assessmentScores.distance}%` }} className="h-full bg-[#B5651D]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI FEEDBACK PANEL */}
          <div className="lab-card p-6">
            <h3 className="font-bold text-sm text-[#2F241F] mb-3 font-mono border-b border-[#2F241F]/10 pb-1 uppercase tracking-wider">AI Posture Feedback</h3>
            <div className="space-y-2.5 font-mono text-xs text-slate-800">
              {rawCoordinates.length > 0 ? (
                personalizedFeedback.map((f, idx) => (
                  <div key={idx} className="bg-[#E8DCC4] p-2.5 rounded border border-[#2F241F]/15 flex gap-2 items-start">
                    <span className="shrink-0 text-amber-700">▶</span>
                    <span>{f}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500">
                  Waiting for active coordinate fitting frame logs...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
