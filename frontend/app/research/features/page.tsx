"use client";

import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { useLabStore } from "@/lib/store";
import { getDistance, Landmark } from "@/lib/gestureClassifier";
import { Camera, Activity, Info, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [webcamActive, setWebcamActive] = useState(false);
  const [rawCoordinates, setRawCoordinates] = useState<Landmark[]>([]);

  // Features
  const [fingerAngles, setFingerAngles] = useState({
    thumb: 180, index: 180, middle: 180, ring: 180, pinky: 180
  });
  const [fingertipDists, setFingertipDists] = useState({
    thumbIndex: 0, thumbMiddle: 0, indexMiddle: 0, middleRing: 0, ringPinky: 0
  });
  const [palmDists, setPalmDists] = useState({
    wristIndexBase: 0, wristPinkyBase: 0
  });
  const [handSpread, setHandSpread] = useState(0);
  const [palmDirection, setPalmDirection] = useState("Upright");
  const [handRotation, setHandRotation] = useState({ pitch: 0, roll: 0 });

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

  const calculateJointAngle = (a: Landmark, b: Landmark, c: Landmark): number => {
    if (!a || !b || !c) return 180;
    const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
    const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    if (mag1 * mag2 === 0) return 180;
    const cosTheta = dotProduct / (mag1 * mag2);
    return Math.round((Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180) / Math.PI);
  };

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

            // Flex angles
            setFingerAngles({
              thumb: calculateJointAngle(lm[1], lm[2], lm[4]),
              index: calculateJointAngle(lm[5], lm[6], lm[8]),
              middle: calculateJointAngle(lm[9], lm[10], lm[12]),
              ring: calculateJointAngle(lm[13], lm[14], lm[16]),
              pinky: calculateJointAngle(lm[17], lm[18], lm[20])
            });

            // Tip distances
            setFingertipDists({
              thumbIndex: Math.round(getDistance(lm[4], lm[8]) * 100),
              thumbMiddle: Math.round(getDistance(lm[4], lm[12]) * 100),
              indexMiddle: Math.round(getDistance(lm[8], lm[12]) * 100),
              middleRing: Math.round(getDistance(lm[12], lm[16]) * 100),
              ringPinky: Math.round(getDistance(lm[16], lm[20]) * 100)
            });

            // Palm distances
            setPalmDists({
              wristIndexBase: Math.round(getDistance(lm[0], lm[5]) * 100),
              wristPinkyBase: Math.round(getDistance(lm[0], lm[17]) * 100)
            });

            // Hand spread
            setHandSpread(Math.round(getDistance(lm[4], lm[20]) * 100));

            // Direction & rotation
            const upright = lm[9].y < lm[0].y;
            setPalmDirection(upright ? "Upright / Face Up" : "Downward / Face Down");

            // Simple vector angle relative to vertical axis for pitch/roll approximation
            const roll = Math.round(Math.atan2(lm[17].y - lm[5].y, lm[17].x - lm[5].x) * (180 / Math.PI));
            const pitch = Math.round(Math.atan2(lm[9].z - lm[0].z, lm[9].y - lm[0].y) * (180 / Math.PI));
            setHandRotation({ pitch, roll });
          }
        }
      }
      frameId = requestAnimationFrame(runDetection);
    };

    runDetection();
    return () => cancelAnimationFrame(frameId);
  }, [webcamActive, landmarker]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#2F241F] pb-4 gap-4">
        <div>
          <span className="font-mono text-xs text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
            FEATURE ENGINEERING AUDITOR
          </span>
          <h1 className="text-3xl font-black text-[#2F241F] font-display">
            📂 Real-time Feature Inspector
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Inspect raw coordinates, flex angles, Euclidean joint distances, and hand orientation metrics
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
        {/* WEBCAM FEED */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="relative aspect-video w-full lab-monitor overflow-hidden bg-[#22252A]">
            {!webcamActive && (
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-20">
                <Camera className="h-10 w-10 text-slate-500 mb-3" />
                <button
                  onClick={startCamera}
                  disabled={modelLoading}
                  className="lab-button py-2 px-4 uppercase text-[10px] tracking-wider font-mono"
                >
                  {modelLoading ? "Loading MediaPipe..." : "Start Webcam"}
                </button>
              </div>
            )}
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
            <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-10 pointer-events-none" />
          </div>

          {/* RAW COORDINATES VECTOR */}
          <div className="lab-card p-4">
            <h4 className="text-xs font-mono font-bold text-[#2F241F] border-b border-[#2F241F]/10 pb-2 mb-3">
              [Raw Coordinates] 63 Features (X, Y, Z)
            </h4>
            <div className="max-h-[140px] overflow-y-auto font-mono text-[9px] text-slate-600 grid grid-cols-3 gap-2 pr-2">
              {rawCoordinates.length > 0 ? (
                rawCoordinates.map((pt, idx) => (
                  <div key={idx} className="border-b border-[#2F241F]/5 py-0.5">
                    <span className="font-bold">Point {idx}:</span> {pt.x.toFixed(3)}, {pt.y.toFixed(3)}, {pt.z.toFixed(3)}
                  </div>
                ))
              ) : (
                <span className="col-span-full text-slate-500 text-center py-4">Waiting for hand fitting stream...</span>
              )}
            </div>
          </div>
        </div>

        {/* ENGINEERED FEATURE SETS */}
        <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FINGER FLEX ANGLES */}
          <div className="lab-card p-6">
            <h3 className="font-bold text-sm text-[#2F241F] mb-4 font-mono border-b border-[#2F241F]/15 pb-1 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#556B2F]" />
              Finger Joint Angles
            </h3>
            <div className="space-y-3 font-mono text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Thumb Angle:</span>
                <strong>{fingerAngles.thumb}°</strong>
              </div>
              <div className="flex justify-between">
                <span>Index Angle:</span>
                <strong>{fingerAngles.index}°</strong>
              </div>
              <div className="flex justify-between">
                <span>Middle Angle:</span>
                <strong>{fingerAngles.middle}°</strong>
              </div>
              <div className="flex justify-between">
                <span>Ring Angle:</span>
                <strong>{fingerAngles.ring}°</strong>
              </div>
              <div className="flex justify-between">
                <span>Pinky Angle:</span>
                <strong>{fingerAngles.pinky}°</strong>
              </div>
            </div>
          </div>

          {/* DISTANCE FEATURES */}
          <div className="lab-card p-6">
            <h3 className="font-bold text-sm text-[#2F241F] mb-4 font-mono border-b border-[#2F241F]/15 pb-1 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-[#3D4F73]" />
              Joint Distances (Euclidean)
            </h3>
            <div className="space-y-2.5 font-mono text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Thumb Tip to Index Tip:</span>
                <strong>{fingertipDists.thumbIndex} units</strong>
              </div>
              <div className="flex justify-between">
                <span>Thumb Tip to Middle Tip:</span>
                <strong>{fingertipDists.thumbMiddle} units</strong>
              </div>
              <div className="flex justify-between">
                <span>Index Tip to Middle Tip:</span>
                <strong>{fingertipDists.indexMiddle} units</strong>
              </div>
              <div className="flex justify-between">
                <span>Wrist to Index Knuckle:</span>
                <strong>{palmDists.wristIndexBase} units</strong>
              </div>
              <div className="flex justify-between">
                <span>Wrist to Pinky Knuckle:</span>
                <strong>{palmDists.wristPinkyBase} units</strong>
              </div>
            </div>
          </div>

          {/* ORIENTATION FEATURES */}
          <div className="lab-card p-6 md:col-span-2">
            <h3 className="font-bold text-sm text-[#2F241F] mb-4 font-mono border-b border-[#2F241F]/15 pb-1 uppercase tracking-wider flex items-center gap-2">
              <Info className="h-4 w-4 text-[#B5651D]" />
              Hand Orientation & Spread
            </h3>
            <div className="grid grid-cols-3 gap-4 font-mono text-xs text-slate-700 text-center">
              <div className="bg-[#E8DCC4] p-3 rounded border border-[#2F241F]/10">
                <span className="block text-slate-500 mb-1">Hand Rotation (Pitch/Roll)</span>
                <strong>{handRotation.pitch}° / {handRotation.roll}°</strong>
              </div>
              <div className="bg-[#E8DCC4] p-3 rounded border border-[#2F241F]/10">
                <span className="block text-slate-500 mb-1">Palm Direction</span>
                <strong>{palmDirection}</strong>
              </div>
              <div className="bg-[#E8DCC4] p-3 rounded border border-[#2F241F]/10">
                <span className="block text-slate-500 mb-1">Hand Spread Rating</span>
                <strong>{handSpread} units</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
