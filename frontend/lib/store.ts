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
  category: string;
}

interface LabState {
  currentSignIndex: number;
  webcamActive: boolean;
  attempts: PracticeAttempt[];
  lessons: SignLesson[];
  selectedRegion: "ISL" | "ASL" | "BSL";
  isLoadingLessons: boolean;
  
  // Actions
  selectSign: (index: number) => void;
  setWebcamActive: (active: boolean) => void;
  logAttempt: (signName: string, score: number) => void;
  clearHistory: () => void;
  initializeStore: () => Promise<void>;
  setRegion: (region: "ISL" | "ASL" | "BSL") => Promise<void>;
  loadLessons: () => Promise<void>;
}

export const useLabStore = create<LabState>((set, get) => ({
  currentSignIndex: 0,
  webcamActive: false,
  attempts: [],
  lessons: [],
  selectedRegion: "ISL",
  isLoadingLessons: false,

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

  loadLessons: async () => {
    set({ isLoadingLessons: true });
    try {
      const region = get().selectedRegion;
      const res = await fetch(`http://localhost:8000/api/dictionary?region=${region}`);
      if (!res.ok) throw new Error("Failed to fetch lessons");
      const data = await res.json();
      
      // Map API SignResponse schema to SignLesson schema
      const mappedLessons = data.map((item: any) => ({
        name: item.name,
        description: item.description || "",
        guide: item.visual_guide || "",
        category: item.category
      }));
      
      set({ lessons: mappedLessons, currentSignIndex: 0 });
    } catch (err) {
      console.error("Failed to load lessons", err);
      // Fallback local lessons if backend is offline
      set({
        lessons: [
          { name: "Hello", description: "Standard salutary greeting gesture.", guide: "Place your dominant hand near your forehead in a salute-like posture, then extend fingers outward.", category: "phrases" },
          { name: "Thank You", description: "Expression of appreciation or gratitude.", guide: "Touch your fingertips to your chin, then wave your hand down and forward toward the camera.", category: "phrases" },
          { name: "Yes", description: "Affirmative confirmation response.", guide: "Make a loose fist with your dominant hand and rock/nod it up and down from the wrist.", category: "phrases" },
          { name: "No", description: "Negative disagreement response.", guide: "Bring your index finger, middle finger, and thumb together, snapping them closed.", category: "phrases" },
          { name: "Please", description: "Polite request sign.", guide: "Place your dominant hand flat on the center of your chest and rotate it in a circular motion.", category: "phrases" },
          { name: "Sorry", description: "Expression of apology or regret.", guide: "Form a fist and rub it in a circular motion over your chest.", category: "phrases" },
        ],
        currentSignIndex: 0
      });
    } finally {
      set({ isLoadingLessons: false });
    }
  },

  setRegion: async (region) => {
    set({ selectedRegion: region });
    if (typeof window !== "undefined") {
      localStorage.setItem("signverse_region", region);
    }
    await get().loadLessons();
  },

  initializeStore: async () => {
    if (typeof window !== "undefined") {
      const savedAttempts = localStorage.getItem("signverse_attempts");
      if (savedAttempts) {
        try {
          set({ attempts: JSON.parse(savedAttempts) });
        } catch (e) {
          console.error("Failed to parse attempts log", e);
        }
      }
      
      const savedRegion = localStorage.getItem("signverse_region");
      if (savedRegion && (savedRegion === "ISL" || savedRegion === "ASL" || savedRegion === "BSL")) {
        set({ selectedRegion: savedRegion as any });
      }
    }
    await get().loadLessons();
  }
}));
