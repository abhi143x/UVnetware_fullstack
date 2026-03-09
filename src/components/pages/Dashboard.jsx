import React from "react";
import { useNavigate } from "react-router-dom";
import { useEditorStore, VENUE_TEMPLATES } from "../editor/store/editorStore";

/* ── Mini preview SVGs ────────────────────────────────────────────────────── */

function TemplatePreview({ templateId }) {
  const d = "#5fa7ff";
  const previewMap = {
    "movie-theatre": (
      <svg width="140" height="70" viewBox="0 0 140 70">
        {Array.from({ length: 10 }).map((_, r) => {
          const cnt = 6 + Math.floor(r * 0.4);
          return Array.from({ length: cnt * 2 }).map((_, c) => {
            const side = c < cnt ? -1 : 1;
            const idx = c < cnt ? cnt - c : c - cnt;
            return (
              <circle key={`${r}-${c}`} cx={70 + side * (8 + idx * 6)} cy={6 + r * 6.5} r={2} fill={d} opacity={0.65} />
            );
          });
        })}
        <text x="70" y="5" textAnchor="middle" fill="#7a8a9e" fontSize="5" fontWeight="bold">SCREEN</text>
      </svg>
    ),
    "small-theater": (
      <svg width="140" height="70" viewBox="0 0 140 70">
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 12 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={14 + c * 10} cy={10 + r * 12} r={3} fill={d} opacity={0.7} />
          ))
        )}
        <text x="70" y="6" textAnchor="middle" fill="#7a8a9e" fontSize="5" fontWeight="bold">SCREEN</text>
      </svg>
    ),
    "bus": (
      <svg width="140" height="70" viewBox="0 0 60 75">
        {Array.from({ length: 10 }).map((_, r) => (
          <React.Fragment key={r}>
            <circle cx={15} cy={8 + r * 7} r={2.2} fill={d} opacity={0.7} />
            <circle cx={23} cy={8 + r * 7} r={2.2} fill={d} opacity={0.7} />
            <circle cx={37} cy={8 + r * 7} r={2.2} fill={d} opacity={0.7} />
            <circle cx={45} cy={8 + r * 7} r={2.2} fill={d} opacity={0.7} />
          </React.Fragment>
        ))}
        <text x="30" y="5" textAnchor="middle" fill="#7a8a9e" fontSize="4" fontWeight="bold">DRIVER</text>
      </svg>
    ),
    "train": (
      <svg width="140" height="70" viewBox="0 0 60 85">
        {[0, 45].map((offset, ci) => (
          <React.Fragment key={ci}>
            <text x="30" y={offset + 4} textAnchor="middle" fill="#587cb3" fontSize="3.5" fontWeight="bold">Coach {ci + 1}</text>
            {Array.from({ length: 7 }).map((_, r) => (
              <React.Fragment key={r}>
                <circle cx={15} cy={offset + 8 + r * 5} r={1.8} fill={d} opacity={0.7} />
                <circle cx={23} cy={offset + 8 + r * 5} r={1.8} fill={d} opacity={0.7} />
                <circle cx={37} cy={offset + 8 + r * 5} r={1.8} fill={d} opacity={0.7} />
                <circle cx={45} cy={offset + 8 + r * 5} r={1.8} fill={d} opacity={0.7} />
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </svg>
    ),
    "medium-hall": (
      <svg width="140" height="70" viewBox="0 0 140 70">
        {Array.from({ length: 10 }).map((_, r) =>
          Array.from({ length: 15 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={5 + c * 9} cy={5 + r * 6.5} r={2} fill={d} opacity={0.6} />
          ))
        )}
      </svg>
    ),
    "large-arena": (
      <svg width="140" height="70" viewBox="0 0 140 70">
        {Array.from({ length: 8 }).map((_, r) => {
          const count = 10 + Math.floor(r * 1.5);
          return Array.from({ length: count }).map((_, c) => {
            const angle = Math.PI * 0.25 + (c / (count - 1 || 1)) * Math.PI * 0.5;
            const rad = 20 + r * 6;
            return <circle key={`${r}-${c}`} cx={70 + Math.cos(angle) * rad} cy={5 + rad - Math.sin(angle) * rad * 0.8} r={1.8} fill={d} opacity={0.6} />;
          });
        })}
      </svg>
    ),
    "conference-room": (
      <svg width="140" height="70" viewBox="0 0 140 70">
        {[{ bx: 14, cols: 4 }, { bx: 50, cols: 8 }, { bx: 108, cols: 4 }].map((block, bi) =>
          Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: block.cols }).map((_, c) => (
              <circle key={`${bi}-${r}-${c}`} cx={block.bx + c * 8} cy={18 + r * 12} r={2.5} fill={d} opacity={0.7} />
            ))
          )
        )}
        <text x="70" y="10" textAnchor="middle" fill="#7a8a9e" fontSize="5" fontWeight="bold">PODIUM</text>
      </svg>
    ),
    "amphitheater": (
      <svg width="140" height="70" viewBox="0 0 140 70">
        {Array.from({ length: 7 }).map((_, r) => {
          const count = 8 + r * 2;
          return Array.from({ length: count }).map((_, c) => {
            const angle = Math.PI * 0.1 + (c / (count - 1 || 1)) * Math.PI * 0.8;
            const rad = 14 + r * 7;
            return <circle key={`${r}-${c}`} cx={70 + Math.cos(angle) * rad * 0.9} cy={5 + rad - Math.sin(angle) * rad * 0.65} r={1.8} fill={d} opacity={0.6} />;
          });
        })}
      </svg>
    ),
  };
  return previewMap[templateId] || null;
}

/* ── Per-template accent styling ──────────────────────────────────────────── */

const ACCENTS = {
  "movie-theatre": { gradient: "from-violet-600/20 to-fuchsia-600/10", border: "border-violet-500/20", icon: "🎬" },
  "small-theater": { gradient: "from-blue-600/20 to-cyan-600/10", border: "border-blue-500/20", icon: "🎦" },
  "bus": { gradient: "from-yellow-600/20 to-orange-600/10", border: "border-yellow-500/20", icon: "🚌" },
  "train": { gradient: "from-sky-600/20 to-blue-600/10", border: "border-sky-500/20", icon: "🚆" },
  "medium-hall": { gradient: "from-indigo-600/20 to-purple-600/10", border: "border-indigo-500/20", icon: "🎭" },
  "large-arena": { gradient: "from-emerald-600/20 to-teal-600/10", border: "border-emerald-500/20", icon: "🏟️" },
  "conference-room": { gradient: "from-amber-600/20 to-orange-600/10", border: "border-amber-500/20", icon: "🎤" },
  "amphitheater": { gradient: "from-rose-600/20 to-pink-600/10", border: "border-rose-500/20", icon: "🏛️" },
};

/* ── Dashboard ────────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const navigate = useNavigate();
  const loadTemplate = useEditorStore((state) => state.loadTemplate);

  function handleSelectTemplate(template) {
    const data = template.generator();
    loadTemplate(data);
    navigate("/editor");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0e1520] to-[#0a0e14] overflow-auto">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
            Venue Templates
          </h1>
          <p className="text-sm text-[#6a7a8e] max-w-lg mx-auto">
            Pick a template to jump straight into a pre-built seating layout, or start from scratch.
          </p>
        </div>

        {/* Cards Grid — 4 columns on large screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {VENUE_TEMPLATES.map((tpl) => {
            const accent = ACCENTS[tpl.id] || ACCENTS["small-theater"];
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className={`group relative text-left rounded-2xl border ${accent.border} bg-[#11161c]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/10 hover:border-[#587cb3]/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
              >
                {/* Accent bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${accent.gradient}`} />

                {/* Preview */}
                <div className="px-4 pt-3 pb-1">
                  <div className="rounded-lg bg-[#0a0e14]/80 border border-white/5 p-2 flex items-center justify-center h-[80px] group-hover:border-[#587cb3]/20 transition-colors">
                    <TemplatePreview templateId={tpl.id} />
                  </div>
                </div>

                {/* Info */}
                <div className="px-4 pb-4 pt-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{accent.icon}</span>
                    <h3 className="text-sm font-semibold text-[#e0e8f0] group-hover:text-white transition-colors truncate">
                      {tpl.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#5a6a7e] leading-snug mb-2.5 line-clamp-2">
                    {tpl.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#587cb3] bg-[#587cb3]/10 px-2 py-0.5 rounded-full font-medium">
                      {tpl.seatCount} seats
                    </span>
                    <span className="text-[10px] text-[#5a6a7e] group-hover:text-[#587cb3] transition-colors flex items-center gap-0.5">
                      Open
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="inline-block">
                        <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Start from Scratch */}
          <button
            type="button"
            onClick={() => navigate("/editor")}
            className="group relative text-left rounded-2xl border border-dashed border-white/10 bg-[#11161c]/40 overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:border-[#587cb3]/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] px-4 py-6">
              <div className="w-12 h-12 rounded-xl bg-[#587cb3]/10 border border-[#587cb3]/20 flex items-center justify-center mb-3 group-hover:bg-[#587cb3]/20 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="#587cb3" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-[#c9d6ea] group-hover:text-white transition-colors mb-0.5">
                Start from Scratch
              </h3>
              <p className="text-[11px] text-[#5a6a7e] text-center">
                Blank canvas, full creative freedom
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
