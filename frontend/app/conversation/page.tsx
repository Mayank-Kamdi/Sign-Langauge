"use client";

import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { evaluateGesture, Landmark } from "@/lib/gestureClassifier";
import { MessageSquare, Camera, Sparkles, Send, ChevronRight } from "lucide-react";
import { useLabStore } from "@/lib/store";
import AITutorGuide from "@/components/AITutorGuide";

interface Step {
  question: string;
  answer: string;
  hint: string;
}

interface Scenario {
  id: string;
  title: string;
  icon: string;
  description: string;
  steps: Step[];
}

interface ChatMessage {
  sender: "ai" | "user";
  text: string;
  status?: "pending" | "correct" | "incorrect";
}

export default function ConversationPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { selectedRegion } = useLabStore();

  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [webcamActive, setWebcamActive] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [feedback, setFeedback] = useState("Position your camera.");
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Fetch scenarios on load
  useEffect(() => {
    async function loadScenarios() {
      try {
        const res = await fetch("http://localhost:8000/api/conversation/scenarios");
        if (res.ok) {
          const data = await res.json();
          setScenarios(data);
        } else {
          throw new Error("Failed to fetch scenarios");
        }
      } catch (err) {
        // Fallback local scenarios if API is not running
        setScenarios([
          {
            id: "school",
            title: "At School",
            icon: "🎒",
            description: "Practice communication in a classroom setting.",
            steps: [
              { question: "How do you greet your teacher in sign language?", answer: "Hello", hint: "Salute gesture near your forehead." },
              { question: "How do you ask for assistance?", answer: "Help", hint: "Place flat dominant hand under closed non-dominant hand and lift up." },
              { question: "How do you say goodbye to classmates?", answer: "Goodbye", hint: "Wave hand with open palm." }
            ]
          },
          {
            id: "emergency",
            title: "Emergency Situation",
            icon: "🚨",
            description: "Key phrases needed during urgent help requests.",
            steps: [
              { question: "What is the first gesture to request emergency support?", answer: "Help", hint: "Use dominant hand to lift your other fist." },
              { question: "How do you express regret or apologize during the incident?", answer: "Sorry", hint: "Make a fist and rotate it over your chest." },
              { question: "How do you confirm understanding or say yes to help?", answer: "Yes", hint: "Nod your fist up and down." }
            ]
          }
        ]);
      }
    }
    loadScenarios();

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
      } catch (err) {
        console.error("Failed to load MediaPipe HandLandmarker:", err);
      }
    }
    initMediaPipe();
    setToken(localStorage.getItem("token"));
  }, []);

  // Set up chat when scenario is chosen
  const selectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setCurrentStepIdx(0);
    setIsSuccess(false);
    setAccuracy(0);
    setChatHistory([
      { sender: "ai", text: `Welcome to the "${scenario.title}" practice session! Let's start.` },
      { sender: "ai", text: scenario.steps[0].question }
    ]);
  };

  // Handle Webcam Start
  const startWebcam = async () => {
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
      console.error("Camera access blocked", err);
    }
  };

  // Webcam Track Cleanup Effect
  useEffect(() => {
    return () => {
      // Stop webcam tracks on component unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      setWebcamActive(false);
    };
  }, []);

  useEffect(() => {
    if (!webcamActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [webcamActive]);

  const exitSession = () => {
    setSelectedScenario(null);
    setWebcamActive(false);
  };

  // Detection loop for current sign step
  useEffect(() => {
    if (!webcamActive || !landmarker || !videoRef.current || !canvasRef.current || !selectedScenario) return;

    let animationFrameId: number;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const targetSign = selectedScenario.steps[currentStepIdx]?.answer;

    if (!targetSign) return;

    const runDetection = () => {
      if (video.readyState >= 2) {
        const timestamp = performance.now();
        const results = landmarker.detectForVideo(video, timestamp);

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.landmarks && results.landmarks.length > 0) {
            const handsData = results.landmarks.map((landmarksList, index) => {
              const label = results.handednesses?.[index]?.[0]?.categoryName || "Right";
              return {
                landmarks: landmarksList as Landmark[],
                handedness: (label === "Left" ? "Left" : "Right") as "Left" | "Right",
              };
            });

            const evaluation = evaluateGesture(targetSign, handsData);
            setFeedback(evaluation.feedback);
            setAccuracy(evaluation.score);

            if (evaluation.isMatch && evaluation.score >= 0.85) {
              setIsSuccess(true);
            }

            // Draw Skeletal overlays
            results.landmarks.forEach((landmarks) => {
              ctx.strokeStyle = "#a78bfa";
              ctx.lineWidth = 2.5;
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
            });
          } else {
            setAccuracy(0);
            setFeedback("Please show your hand in front of the camera.");
          }
        }
      }
      animationFrameId = requestAnimationFrame(runDetection);
    };

    runDetection();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [webcamActive, landmarker, selectedScenario, currentStepIdx]);

  // Handle Response submit / progression
  const handleNextStep = async () => {
    if (!selectedScenario) return;

    const currentStep = selectedScenario.steps[currentStepIdx];
    
    // Add user response to chat
    const newUserMsg: ChatMessage = { sender: "user", text: `[Performs sign: ${currentStep.answer}]`, status: "correct" };
    
    // Set next step
    const nextIdx = currentStepIdx + 1;
    let nextAiMsg: ChatMessage;

    // Sync progress to backend if logged in
    if (token) {
      try {
        await fetch("http://localhost:8000/api/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sign_name: currentStep.answer,
            accuracy_score: accuracy,
            status: "practiced",
            region: selectedRegion
          }),
        });
      } catch (err) {
        console.error(err);
      }
    }

    if (nextIdx < selectedScenario.steps.length) {
      nextAiMsg = { sender: "ai", text: `Correct! ${selectedScenario.steps[nextIdx].question}` };
      setChatHistory((prev) => [...prev, newUserMsg, nextAiMsg]);
      setCurrentStepIdx(nextIdx);
      setIsSuccess(false);
      setAccuracy(0);
    } else {
      nextAiMsg = { sender: "ai", text: `Awesome! You have successfully completed the "${selectedScenario.title}" conversational dialogue scenario.` };
      setChatHistory((prev) => [...prev, newUserMsg, nextAiMsg]);
      setIsSuccess(false);
      setAccuracy(0);
      setCurrentStepIdx(-1); // Marked as done
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[calc(100vh-6rem)]">
      {/* Left panel: Scenario Selection or Live camera */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {!selectedScenario ? (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#2F241F] mb-2 font-display">💬 AI Conversation Mode</h1>
              <p className="text-slate-600">Select a real-world scenario to practice conversational Sign Language.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => selectScenario(scenario)}
                  className="bg-[#DCC9A3] border-4 border-[#2F241F] hover:bg-[#F5EBD7] p-6 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-[4px_4px_0px_#2F241F] hover:translate-y-[-2px]"
                >
                  <div>
                    <span className="text-4xl block mb-4">{scenario.icon}</span>
                    <h3 className="text-xl font-bold text-[#2F241F] mb-2">{scenario.title}</h3>
                    <p className="text-slate-700 text-sm leading-relaxed mb-6">{scenario.description}</p>
                  </div>
                  <span className="text-xs font-bold text-[#3D4F73] flex items-center gap-1">
                    Start Dialogue <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-center">
              <button
                onClick={exitSession}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DCC9A3] hover:bg-[#F5EBD7] text-[#2F241F] border-2 border-[#2F241F] font-bold text-xs rounded transition-all shadow-[2px_2px_0px_#2F241F]"
              >
                ← Exit Session
              </button>
              <span className="text-xs font-bold text-[#3D4F73] font-mono bg-[#DCC9A3] px-2.5 py-1 border-2 border-[#2F241F] rounded">
                Scenario: {selectedScenario.title}
              </span>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#22252A] border-4 border-[#2F241F] shadow-[4px_4px_0px_#2F241F] flex-1 min-h-[300px]">
              {!webcamActive && (
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-20">
                  <Camera className="h-12 w-12 text-slate-500 mb-3 animate-pulse" />
                  <h3 className="text-[#F5EBD7] font-bold text-lg mb-2">Enable Webcam for Dialogue</h3>
                  <button
                    onClick={startWebcam}
                    className="lab-button px-5 py-2.5 font-bold uppercase text-xs tracking-wider"
                  >
                    Start Camera
                  </button>
                </div>
              )}

              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-10 pointer-events-none" />
            </div>

            {/* Smart Coaching feedback banner */}
            <div className="bg-[#DCC9A3] border-4 border-[#2F241F] rounded-2xl p-4 shadow-[4px_4px_0px_#2F241F]">
              <span className="text-[10px] font-bold text-[#B5651D] uppercase tracking-wider block">Live Feedback</span>
              <p className="text-sm font-bold text-[#2F241F]">{feedback}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right panel: Conversational Chat UI */}
      <div className="lg:col-span-5 flex flex-col bg-[#E8DCC4] rounded-3xl overflow-hidden border-4 border-[#2F241F] h-full max-h-[850px] shadow-[4px_4px_0px_#2F241F]">
        {/* Chat Header */}
        <div className="border-b-4 border-[#2F241F] bg-[#DCC9A3] p-5 flex items-center gap-3">
          <div className="rounded-xl bg-[#556B2F] p-2 text-white border-2 border-[#2F241F] shadow-[2px_2px_0px_#2F241F]">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#2F241F]">Conversation Companion</h3>
            <span className="text-xs text-slate-700">Interactive Sign Guide</span>
          </div>
        </div>

        {selectedScenario && currentStepIdx !== -1 && (
          <div className="p-4 border-b-2 border-[#2F241F] bg-[#F5EBD7]">
            <AITutorGuide
              signName={selectedScenario.steps[currentStepIdx].answer}
              accuracyScore={accuracy}
              feedbackText={feedback}
              isActive={webcamActive}
            />
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {chatHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600 gap-2">
              <Sparkles className="h-8 w-8 text-slate-400" />
              <p className="text-sm font-bold">Choose a scenario on the left to start your conversational practice.</p>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm border-2 border-[#2F241F] ${
                    msg.sender === "user"
                      ? "bg-[#556B2F] text-white rounded-tr-none font-bold"
                      : "bg-[#DCC9A3] text-[#2F241F] rounded-tl-none leading-relaxed font-bold"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action input/Next trigger */}
        {selectedScenario && currentStepIdx !== -1 && (
          <div className="border-t-4 border-[#2F241F] bg-[#DCC9A3] p-5">
            <div className="bg-[#F5EBD7] rounded-xl p-3.5 border-2 border-[#2F241F] mb-4">
              <div className="flex justify-between items-center text-xs font-bold text-[#2F241F] mb-1">
                <span>Task: Sign "{selectedScenario.steps[currentStepIdx].answer}"</span>
                <span className="text-[#3D4F73]">Match: {Math.round(accuracy * 100)}%</span>
              </div>
              <p className="text-xs text-slate-600 italic">Hint: {selectedScenario.steps[currentStepIdx].hint}</p>
            </div>

            {isSuccess ? (
              <button
                onClick={handleNextStep}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#556B2F] hover:bg-[#6B8E23] py-3.5 font-bold text-white border-2 border-[#2F241F] shadow-[2px_2px_0px_#2F241F] transition-all"
              >
                Send Verified Sign
                <Send className="h-4 w-4" />
              </button>
            ) : (
              <div className="w-full text-center text-xs font-bold text-slate-600 border-2 border-dashed border-[#2F241F]/40 rounded-xl py-3.5 bg-[#F5EBD7]">
                Hold correct sign posture to send response...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
