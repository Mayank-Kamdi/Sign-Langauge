"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Beaker, Scroll, Binary, Clipboard } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

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
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <Beaker className="h-6 w-6 text-[#556B2F]" />
              <span className="font-bold text-lg tracking-tight font-display text-[#2F241F]">
                SignVerse <span className="text-[#3D4F73] font-mono text-xs border border-[#2F241F] px-1 bg-[#DCC9A3] rounded">PROTOTYPE-1</span>
              </span>
            </Link>
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
          </div>
        </div>
      </div>
    </nav>
  );
}
