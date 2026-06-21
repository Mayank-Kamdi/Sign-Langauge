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
  isStatic: boolean;
  handImageUrl?: string;
  gestureSteps?: string[];
  referenceVideoUrl?: string;
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
  selectedRegion: "ASL",
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
      const prevSignName = get().lessons[get().currentSignIndex]?.name;

      const res = await fetch(`http://localhost:8000/api/dictionary?region=${region}`);
      if (!res.ok) throw new Error("Failed to fetch lessons");
      const data = await res.json();
      
      // Map API SignResponse schema to SignLesson schema
      const mappedLessons = data.map((item: any) => ({
        name: item.name,
        description: item.description || "",
        guide: item.visual_guide || "",
        category: item.category,
        isStatic: item.is_static,
        handImageUrl: item.hand_image_url || "",
        gestureSteps: item.gesture_steps ? JSON.parse(item.gesture_steps) : [],
        referenceVideoUrl: item.reference_video_url || ""
      }));
      
      let newIndex = 0;
      if (prevSignName) {
        const foundIndex = mappedLessons.findIndex((l: any) => l.name === prevSignName);
        if (foundIndex !== -1) {
          newIndex = foundIndex;
        }
      }

      set({ lessons: mappedLessons, currentSignIndex: newIndex });
    } catch (err) {
      console.error("Failed to load lessons", err);
      // Fallback local lessons if backend is offline
      const fallbackLessons = [
        { name: "Hello", description: "Standard salutary greeting gesture.", guide: "Place your dominant hand near your forehead in a salute-like posture, then extend fingers outward.", category: "phrases", isStatic: false, handImageUrl: "/assets/signs/asl/hello.svg", gestureSteps: ["Bring dominant hand to temple.", "Move hand outward in salute.", "Palm facing out."], referenceVideoUrl: "https://www.youtube.com/embed/demo_asl_hello" },
        { name: "Thank You", description: "Expression of appreciation or gratitude.", guide: "Touch your fingertips to your chin, then wave your hand down and forward toward the camera.", category: "phrases", isStatic: false, handImageUrl: "/assets/signs/asl/thank_you.svg", gestureSteps: ["Touch fingertips to chin.", "Bring hand down and outward.", "Palm facing up."], referenceVideoUrl: "https://www.youtube.com/embed/demo_asl_thank_you" },
        { name: "Yes", description: "Affirmative confirmation response.", guide: "Make a loose fist with your dominant hand and rock/nod it up and down from the wrist.", category: "phrases", isStatic: false, handImageUrl: "/assets/signs/asl/yes.svg", gestureSteps: ["Form a loose fist.", "Nod fist up and down from wrist.", "Forearm remains still."], referenceVideoUrl: "https://www.youtube.com/embed/demo_asl_yes" },
        { name: "No", description: "Negative disagreement response.", guide: "Bring your index finger, middle finger, and thumb together, snapping them closed.", category: "phrases", isStatic: false, handImageUrl: "/assets/signs/asl/no.svg", gestureSteps: ["Extend index/middle fingers.", "Tuck other fingers.", "Quickly tap them down to thumb."], referenceVideoUrl: "https://www.youtube.com/embed/demo_asl_no" },
      ];
      const prevSignName = get().lessons[get().currentSignIndex]?.name;
      let newIndex = 0;
      if (prevSignName) {
        const foundIndex = fallbackLessons.findIndex((l: any) => l.name === prevSignName);
        if (foundIndex !== -1) {
          newIndex = foundIndex;
        }
      }
      set({
        lessons: fallbackLessons,
        currentSignIndex: newIndex
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
