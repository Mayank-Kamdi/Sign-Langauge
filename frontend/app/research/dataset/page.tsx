"use client";

import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { Camera, Save, Download, Trash2, Database, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function DatasetCollectorPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [webcamActive, setWebcamActive] = useState(false);
  
  // Forms & Captures
  const [signName, setSignName] = useState("Hello");
  const [userId, setUserId] = useState("Researcher_1");
  const [sessionNum, setSessionNum] = useState(1);
  const [handedness, setHandedness] = useState<"Right" | "Left">("Right");
  
  const [activeLandmarks, setActiveLandmarks] = useState<any[]>([]);
  const [samplesCount, setSamplesCount] = useState<number>(0);
  const [recentSamples, setRecentSamples] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>("Collector ready.");

  // Fetch count of current samples
  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/research/dataset/stats");
      if (res.ok) {
        const stats = await res.json();
        setSamplesCount(stats.total_samples);
      }
      const dataRes = await fetch("http://localhost:8000/api/research/dataset");
      if (dataRes.ok) {
        const samples = await dataRes.json();
        setRecentSamples(samples.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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
        console.error("Dataset collector MediaPipe failed:", err);
      }
    }
    initMediaPipe();
  }, []);

  // Start Camera
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

  // Detection loop
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
            const firstHand = results.landmarks[0];
            setActiveLandmarks(firstHand);

            const label = results.handednesses?.[0]?.[0]?.categoryName || "Right";
            setHandedness(label === "Left" ? "Left" : "Right");

            // Draw skeleton lines
            ctx.strokeStyle = "#556B2F";
            ctx.lineWidth = 3;
            const drawLine = (pt1: number, pt2: number) => {
              ctx.beginPath();
              ctx.moveTo(firstHand[pt1].x * canvas.width, firstHand[pt1].y * canvas.height);
              ctx.lineTo(firstHand[pt2].x * canvas.width, firstHand[pt2].y * canvas.height);
              ctx.stroke();
            };
            for (let i = 0; i < 4; i++) drawLine(i, i + 1);
            for (let i = 5; i < 8; i++) drawLine(i, i + 1);
            for (let i = 9; i < 12; i++) drawLine(i, i + 1);
            for (let i = 13; i < 16; i++) drawLine(i, i + 1);
            for (let i = 17; i < 20; i++) drawLine(i, i + 1);
            drawLine(0, 5); drawLine(5, 9); drawLine(9, 13); drawLine(13, 17); drawLine(0, 17);

            firstHand.forEach((pt) => {
              ctx.beginPath();
              ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 5, 0, 2 * Math.PI);
              ctx.fillStyle = "#B5651D";
              ctx.fill();
            });
          }
        }
      }
      frameId = requestAnimationFrame(runDetection);
    };

    runDetection();
    return () => cancelAnimationFrame(frameId);
  }, [webcamActive, landmarker]);

  // Save sample to SQLite database
  const saveSample = async () => {
    if (activeLandmarks.length === 0) {
      setSaveStatus("Error: No hand detected to capture.");
      return;
    }

    try {
      setSaveStatus("Syncing sample with DB...");
      const response = await fetch("http://localhost:8000/api/research/dataset/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sign_name: signName,
          user_id: userId,
          handedness: handedness,
          landmarks: activeLandmarks,
          session_number: sessionNum
        })
      });

      if (response.ok) {
        setSaveStatus(`✓ Landmark sample for "${signName}" successfully saved to database!`);
        fetchStats();
      } else {
        setSaveStatus("Error: Failed to save to database.");
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("Error: Network failure syncing database.");
    }
  };

  // Export to CSV
  const exportCSV = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/research/dataset");
      if (!res.ok) return;
      const data = await res.json();
      
      let csvContent = "data:text/csv;charset=utf-8,";
      // Headers: ID, Sign, User, Handedness, Session, Timestamp, x0, y0, z0, ... x20, y20, z20
      let headers = ["ID", "SignName", "UserID", "Handedness", "Session", "Timestamp"];
      for (let i = 0; i < 21; i++) {
        headers.push(`x${i}`, `y${i}`, `z${i}`);
      }
      csvContent += headers.join(",") + "\n";

      data.forEach((row: any) => {
        const landmarksList = JSON.parse(row.landmarks);
        let rowData = [
          row.id,
          `"${row.sign_name}"`,
          `"${row.user_id}"`,
          `"${row.handedness}"`,
          row.session_number,
          `"${row.timestamp}"`
        ];
        landmarksList.forEach((pt: any) => {
          rowData.push(pt.x, pt.y, pt.z);
        });
        csvContent += rowData.join(",") + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sign_language_landmarks_dataset_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export CSV dataset.");
    }
  };

  // Export to JSON
  const exportJSON = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/research/dataset");
      if (!res.ok) return;
      const data = await res.json();
      
      // Parse coordinates out of string layout for cleaner JSON
      const parsedData = data.map((row: any) => ({
        id: row.id,
        sign_name: row.sign_name,
        user_id: row.user_id,
        timestamp: row.timestamp,
        handedness: row.handedness,
        session_number: row.session_number,
        landmarks: JSON.parse(row.landmarks)
      }));

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(parsedData, null, 2)
      )}`;
      const link = document.createElement("a");
      link.setAttribute("href", jsonString);
      link.setAttribute("download", `sign_language_landmarks_dataset_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export JSON dataset.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#2F241F] pb-4 gap-4">
        <div>
          <span className="font-mono text-xs text-[#B5651D] font-bold uppercase tracking-wider block mb-1">
            DATASET RECORDER
          </span>
          <h1 className="text-3xl font-black text-[#2F241F] font-display">
            💾 Landmark Dataset Generator
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Build clean 63-feature vectors directly from MediaPipe WASM coordinates
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DCC9A3] hover:bg-[#F5EBD7] text-[#2F241F] border-2 border-[#2F241F] font-bold text-xs rounded transition-all shadow-[2px_2px_0px_#2F241F]"
        >
          ← Back to Workstation
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* WEBCAM CAPTURE PANEL */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="relative aspect-video w-full lab-monitor overflow-hidden bg-[#22252A]">
            {!webcamActive && (
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-20">
                <Camera className="h-12 w-12 text-slate-500 mb-3" />
                <button
                  onClick={startCamera}
                  disabled={modelLoading}
                  className="lab-button py-2 px-4 uppercase text-[10px] tracking-wider font-mono"
                >
                  {modelLoading ? "Loading MediaPipe..." : "Activate Camera Feed"}
                </button>
              </div>
            )}
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
            <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-10 pointer-events-none" />
          </div>

          {/* TELEMETRY TELEMETRY */}
          <div className="lab-card p-4">
            <h4 className="text-xs font-mono font-bold text-[#2F241F] border-b border-[#2F241F]/10 pb-2 mb-3">
              [Active Frame Landmark Vector] 63 Coordinate Matrix
            </h4>
            <div className="max-h-[120px] overflow-y-auto font-mono text-[9px] text-slate-600 grid grid-cols-3 gap-2 pr-2">
              {activeLandmarks.length > 0 ? (
                activeLandmarks.map((pt, idx) => (
                  <div key={idx} className="border-b border-[#2F241F]/5 py-0.5">
                    <span className="font-bold">#{idx}:</span> {pt.x.toFixed(3)},{pt.y.toFixed(3)},{pt.z.toFixed(3)}
                  </div>
                ))
              ) : (
                <span className="col-span-full text-slate-500 text-center py-4">
                  Stream coordinates to visualize numerical features...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* METADATA FORM & EXPORTS */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="lab-card p-6">
            <h3 className="font-bold text-base text-[#2F241F] mb-4 border-b border-[#2F241F]/10 pb-2">Capture Configurations</h3>
            
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Sign Label Name:</label>
                  <select
                    value={signName}
                    onChange={(e) => setSignName(e.target.value)}
                    className="w-full bg-[#E8DCC4] border-2 border-[#2F241F] rounded p-2 font-bold outline-none"
                  >
                    <option value="Hello">Hello</option>
                    <option value="Thank You">Thank You</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Please">Please</option>
                    <option value="Sorry">Sorry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">User Identifier:</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full bg-[#E8DCC4] border-2 border-[#2F241F] rounded p-2 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Session Number:</label>
                  <input
                    type="number"
                    value={sessionNum}
                    onChange={(e) => setSessionNum(Number(e.target.value))}
                    className="w-full bg-[#E8DCC4] border-2 border-[#2F241F] rounded p-2 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Handedness:</label>
                  <div className="w-full bg-[#DCC9A3] border-2 border-[#2F241F] rounded p-2 text-[#2F241F] font-bold text-center">
                    {activeLandmarks.length > 0 ? `${handedness} Hand` : "No Hand Detected"}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={saveSample}
                  disabled={activeLandmarks.length === 0}
                  className="w-full lab-button py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  Commit Sample to SQLite DB
                </button>
              </div>

              <div className="text-[10px] font-bold text-center text-slate-700 bg-[#E8DCC4] p-2 rounded border border-[#2F241F]/10">
                Status: {saveStatus}
              </div>
            </div>
          </div>

          {/* EXPORTS & DATASET STATS */}
          <div className="lab-card p-6">
            <div className="flex justify-between items-center mb-4 border-b border-[#2F241F]/10 pb-2">
              <h3 className="font-bold text-base text-[#2F241F]">Data Registry & Export</h3>
              <div className="bg-[#556B2F] text-[#F5EBD7] font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-[#2F241F]">
                {samplesCount} Samples
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={exportCSV}
                disabled={samplesCount === 0}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#DCC9A3] hover:bg-[#F5EBD7] text-[#2F241F] border-2 border-[#2F241F] font-bold text-xs rounded transition-all shadow-[2px_2px_0px_#2F241F] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Export CSV Dataset
              </button>
              <button
                onClick={exportJSON}
                disabled={samplesCount === 0}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#DCC9A3] hover:bg-[#F5EBD7] text-[#2F241F] border-2 border-[#2F241F] font-bold text-xs rounded transition-all shadow-[2px_2px_0px_#2F241F] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Export JSON Dataset
              </button>
            </div>

            <span className="font-mono text-[10px] text-slate-500 uppercase font-bold block mb-2">Recent Database Inserts</span>
            <div className="space-y-1.5 font-mono text-[10px] text-slate-700">
              {recentSamples.length > 0 ? (
                recentSamples.map((s) => (
                  <div key={s.id} className="flex justify-between border-b border-[#2F241F]/5 py-1">
                    <span>Sign: <strong>{s.sign_name}</strong></span>
                    <span>Session: #{s.session_number}</span>
                    <span className="text-slate-500">{s.handedness} Hand</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-slate-500">No samples found in DB.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
