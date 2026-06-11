import { create } from "zustand";

export interface PracticeAttempt {
  id: string;
  signName: string;
  timestamp: string;
  score: number;
}

export interface SignLesson {
  name: string;
  description: string;
  guide: string;
}

interface LabState {
  currentSignIndex: number;
  webcamActive: boolean;
  attempts: PracticeAttempt[];
  lessons: SignLesson[];
  
  // Actions
  selectSign: (index: number) => void;
  setWebcamActive: (active: boolean) => void;
  logAttempt: (signName: string, score: number) => void;
  clearHistory: () => void;
  initializeStore: () => void;
}

export const useLabStore = create<LabState>((set) => ({
  currentSignIndex: 0,
  webcamActive: false,
  attempts: [],
  lessons: [
    { name: "Hello", description: "Standard salutary greeting gesture.", guide: "Place your dominant hand near your forehead in a salute-like posture, then extend fingers outward." },
    { name: "Thank You", description: "Expression of appreciation or gratitude.", guide: "Touch your fingertips to your chin, then wave your hand down and forward toward the camera." },
    { name: "Yes", description: "Affirmative confirmation response.", guide: "Make a loose fist with your dominant hand and rock/nod it up and down from the wrist." },
    { name: "No", description: "Negative disagreement response.", guide: "Bring your index finger, middle finger, and thumb together, snapping them closed." },
    { name: "Please", description: "Polite request sign.", guide: "Place your dominant hand flat on the center of your chest and rotate it in a circular motion." },
    { name: "Sorry", description: "Expression of apology or regret.", guide: "Form a fist and rub it in a circular motion over your chest." },
  ],

  selectSign: (index) => set({ currentSignIndex: index }),
  
  setWebcamActive: (active) => set({ webcamActive: active }),
  
  logAttempt: (signName, score) => set((state) => {
    const newAttempt: PracticeAttempt = {
      id: Math.random().toString(36).substring(2, 9),
      signName,
      timestamp: new Date().toLocaleString(),
      score,
    };
    const updatedAttempts = [newAttempt, ...state.attempts];
    if (typeof window !== "undefined") {
      localStorage.setItem("signverse_attempts", JSON.stringify(updatedAttempts));
    }
    return { attempts: updatedAttempts };
  }),

  clearHistory: () => set(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("signverse_attempts");
    }
    return { attempts: [] };
  }),

  initializeStore: () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("signverse_attempts");
      if (saved) {
        try {
          set({ attempts: JSON.parse(saved) });
        } catch (e) {
          console.error("Failed to parse attempts log", e);
        }
      }
    }
  }
}));
