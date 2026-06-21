"use client";

import { useEffect, useState } from "react";
import { Search, BookMarked, Filter, ChevronRight, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLabStore } from "@/lib/store";

interface Sign {
  id: number;
  name: string;
  category: string;
  description: string;
  visual_guide: string;
  difficulty: string;
  region?: string;
}

export default function DictionaryPage() {
  const [signs, setSigns] = useState<Sign[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);
  const { selectedRegion } = useLabStore();

  // Load signs
  useEffect(() => {
    async function fetchSigns() {
      try {
        const res = await fetch(`http://localhost:8000/api/dictionary?region=${selectedRegion}`);
        if (res.ok) {
          const data = await res.json();
          setSigns(data);
          if (data.length > 0) setSelectedSign(data[0]);
        } else {
          throw new Error();
        }
      } catch (err) {
        // Fallback: Populate all 50 signs locally if backend is not running
        const mockSigns: Sign[] = [];
        
        // Alphabets (26)
        for (const char of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
          mockSigns.push({
            id: mockSigns.length + 1,
            name: char,
            category: "alphabets",
            description: `${selectedRegion} Sign Language representation for alphabet letter '${char}'.`,
            visual_guide: `Position your hand or hands to demonstrate the visual layout of '${char}'.`,
            difficulty: "easy",
            region: selectedRegion,
          });
        }
        
        // Numbers (10)
        for (let num = 0; num < 10; num++) {
          mockSigns.push({
            id: mockSigns.length + 1,
            name: String(num),
            category: "numbers",
            description: `${selectedRegion} Sign Language representation for number '${num}'.`,
            visual_guide: `Hold up the corresponding fingers representing '${num}'.`,
            difficulty: "easy",
            region: selectedRegion,
          });
        }
        
        // Phrases (14)
        const phrases = [
          { name: "Hello", guide: "Greeting. Wave hand or bring open hand to forehead in a salute gesture.", diff: "easy" },
          { name: "Thank You", guide: "Place the flat of your dominant hand on your chin, then move it down and forward.", diff: "easy" },
          { name: "Please", guide: "Place open flat hand on chest and rotate in a circle.", diff: "easy" },
          { name: "Sorry", guide: "Make a fist and rotate it in a circle over your chest.", diff: "easy" },
          { name: "Yes", guide: "Make a fist and nod it up and down like a head nodding.", diff: "easy" },
          { name: "No", guide: "Snap index, middle, and thumb fingers together.", diff: "easy" },
          { name: "Help", guide: "Place flat dominant hand under closed non-dominant hand and lift up.", diff: "medium" },
          { name: "Good Morning", guide: "Salute sign followed by index finger pointing upwards to represent rising sun.", diff: "medium" },
          { name: "Goodbye", guide: "Wave hand with open palm moving fingers down and up.", diff: "easy" },
          { name: "Excuse Me", guide: "Rub fingertips of one hand across open palm of other hand.", diff: "medium" },
          { name: "How Are You", guide: "Bring chest height hands out from body pointing to chest then out to user.", diff: "medium" },
          { name: "I Love You", guide: "Extend thumb, index, and pinky fingers while holding down middle and ring fingers.", diff: "easy" },
          { name: "Family", guide: "Touch thumbs and index fingers of both hands in F shape, then draw circle outwards.", diff: "hard" },
          { name: "Friend", guide: "Interlock your index fingers in an alternating hook pattern.", diff: "medium" },
        ];
        
        phrases.forEach((phrase) => {
          mockSigns.push({
            id: mockSigns.length + 1,
            name: phrase.name,
            category: "phrases",
            description: `Common conversation greeting or statement: "${phrase.name}".`,
            visual_guide: phrase.guide,
            difficulty: phrase.diff,
            region: selectedRegion,
          });
        });
        
        setSigns(mockSigns);
        setSelectedSign(mockSigns[0]);
      }
    }
    fetchSigns();
  }, [selectedRegion]);

  const filteredSigns = signs.filter((sign) => {
    const matchesSearch = sign.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || sign.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: List with search/filter */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2F241F] mb-2">{selectedRegion} Sign Dictionary</h1>
          <p className="text-slate-600">Search, explore, and learn {selectedRegion} Sign Language gestures.</p>
        </div>

        {(selectedRegion === "ISL" || selectedRegion === "BSL") && (
          <div className="p-4 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-lg text-xs font-mono text-[#2F241F]">
            ⚠️ <strong>Two-Handed Language Notice:</strong> {selectedRegion} manual alphabets are traditionally two-handed. 
            Because our camera tracker is currently optimized for one-handed signs, we recommend switching the mode in the top menu to <strong>ASL (American Sign Language)</strong> for correct reference signs and real-time detection.
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search sign (e.g. 'A', 'Hello')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            {["all", "alphabets", "numbers", "phrases"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                  category === cat
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                    : "bg-slate-900/40 border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2">
          {filteredSigns.map((sign) => (
            <div
              key={sign.id}
              onClick={() => setSelectedSign(sign)}
              className={`p-4 rounded-2xl cursor-pointer border transition-all text-center flex flex-col justify-center gap-1 ${
                selectedSign?.id === sign.id
                  ? "bg-purple-500/10 border-purple-500/30 shadow-inner"
                  : "bg-slate-900/40 border-white/5 hover:border-white/10"
              }`}
            >
              <span className={`text-xs font-bold uppercase ${
                sign.category === "alphabets" ? "text-blue-400" : sign.category === "numbers" ? "text-amber-400" : "text-emerald-400"
              }`}>
                {sign.category}
              </span>
              <h3 className="text-xl font-black text-white">{sign.name}</h3>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{sign.difficulty}</span>
            </div>
          ))}

          {filteredSigns.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No signs found matches your filters.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Detailed View */}
      <div className="lg:col-span-5">
        {selectedSign ? (
          <div className="glass-panel-glow rounded-3xl p-6 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <BookMarked className="h-32 w-32 text-purple-400" />
            </div>

            <div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase border mb-3 ${
                selectedSign.category === "alphabets"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-300"
                  : selectedSign.category === "numbers"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              }`}>
                {selectedSign.category}
              </span>
              <h2 className="text-5xl font-black text-white">{selectedSign.name}</h2>
              <span className="text-xs text-slate-500 uppercase tracking-wider block mt-1">Difficulty: {selectedSign.difficulty}</span>
            </div>

            <hr className="border-white/5" />

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{selectedSign.description}</p>
            </div>

            <div className="bg-slate-950/40 rounded-2xl p-5 border border-white/5">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Visual Hand Guide</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{selectedSign.visual_guide}</p>
            </div>

            <a
              href={`/learn?sign=${selectedSign.name}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-3.5 font-bold text-white shadow-lg transition-all duration-200"
            >
              Practice Sign Now
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-6 text-center py-20 text-slate-500">
            Select a sign to view details.
          </div>
        )}
      </div>
    </div>
  );
}
