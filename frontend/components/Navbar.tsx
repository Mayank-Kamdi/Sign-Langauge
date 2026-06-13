"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Beaker } from "lucide-react";
import { useLabStore } from "@/lib/store";

export default function Navbar() {
  const pathname = usePathname();
  const { selectedRegion, setRegion } = useLabStore();

  const links = [
    { href: "/", label: "🔬 Workstation", match: "/" },
    { href: "/learn", label: "📚 Study Guide", match: "/learn" },
    { href: "/practice", label: "⚙️ Observation Deck", match: "/practice" },
    { href: "/dashboard", label: "📊 Research Logbook", match: "/dashboard" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#E8DCC4] border-b-4 border-[#2F241F] py-2 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Beaker className="h-6 w-6 text-[#556B2F]" />
              <span className="font-bold text-lg tracking-tight font-display text-[#2F241F] hidden sm:inline">
                SignVerse <span className="text-[#3D4F73] font-mono text-xs border border-[#2F241F] px-1 bg-[#DCC9A3] rounded">PROTOTYPE-1</span>
              </span>
            </Link>

            {/* Region Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#2F241F] font-mono hidden md:inline">🌐 MODE:</span>
              <select
                value={selectedRegion}
                onChange={(e) => setRegion(e.target.value as any)}
                className="bg-[#DCC9A3] text-[#2F241F] border-2 border-[#2F241F] font-bold text-xs rounded px-2 py-1 outline-none cursor-pointer hover:bg-[#F5EBD7] transition-all"
              >
                <option value="ISL">🇮🇳 ISL (Indian)</option>
                <option value="ASL">🇺🇸 ASL (American)</option>
                <option value="BSL">🇬🇧 BSL (British)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-t-lg text-xs sm:text-sm font-bold border-2 border-b-0 border-[#2F241F] transition-all ${
                    isActive
                      ? "bg-[#F5EBD7] text-[#2F241F] translate-y-[8px] pb-3"
                      : "bg-[#DCC9A3] text-[#2F241F]/80 hover:bg-[#F5EBD7] hover:text-[#2F241F]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Research Dropdown */}
            <div className="relative group">
              <button className={`px-3 py-1.5 rounded-t-lg text-xs sm:text-sm font-bold border-2 border-b-0 border-[#2F241F] transition-all flex items-center gap-1 ${
                pathname.startsWith("/research")
                  ? "bg-[#F5EBD7] text-[#2F241F]"
                  : "bg-[#DCC9A3] text-[#2F241F]/80 hover:bg-[#F5EBD7]"
              }`}>
                🧪 Research Lab <span className="text-[10px]">▼</span>
              </button>
              <div className="absolute right-0 top-[30px] hidden group-hover:block bg-[#E8DCC4] border-2 border-[#2F241F] rounded shadow-[4px_4px_0px_#2F241F] py-1 min-w-[170px] z-50 font-mono text-xs">
                <Link href="/research/debug-center" className="block px-4 py-2.5 text-[#2F241F] hover:bg-[#DCC9A3] border-b border-[#2F241F]/10 font-bold">
                  🔬 Debug Center
                </Link>
                <Link href="/research/landmark-collector" className="block px-4 py-2.5 text-[#2F241F] hover:bg-[#DCC9A3] border-b border-[#2F241F]/10 font-bold">
                  💾 Landmark Collector
                </Link>
                <Link href="/research/features" className="block px-4 py-2.5 text-[#2F241F] hover:bg-[#DCC9A3] border-b border-[#2F241F]/10 font-bold">
                  📂 Features Inspector
                </Link>
                <Link href="/research/model-training" className="block px-4 py-2.5 text-[#2F241F] hover:bg-[#DCC9A3] border-b border-[#2F241F]/10 font-bold">
                  ⚙️ Model Training
                </Link>
                <Link href="/research/model-comparison" className="block px-4 py-2.5 text-[#2F241F] hover:bg-[#DCC9A3] border-b border-[#2F241F]/10 font-bold">
                  ⚖️ Model Comparison
                </Link>
                <Link href="/research/experiments" className="block px-4 py-2.5 text-[#2F241F] font-bold">
                  📜 Experiments Registry
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
