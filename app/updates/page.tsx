"use client";
import React, { useMemo, useState } from "react";
import Header from "../../components/Header";

type UpdateEntry = {
  date: string;
  items: string[];
};

export default function UpdatesPage() {
  // Canonical updates list (extend as you release)
  const updates: UpdateEntry[] = [
    // 2022 — start
    { date: "2022-01-01", items: ["CodingKittenGames — first page with 5 tiny games shared with friends"] },
    // Early history milestones (approximate months)
    { date: "2023-06-01", items: ["KittenSchool — Google Site with subpages, more games, a few movies"] },
    { date: "2024-02-01", items: ["KittenGames V1 — first real site release"] },
    { date: "2024-06-01", items: ["KittenGames V2 — more games, cleaner design"] },
    { date: "2024-11-01", items: ["KittenGames V3 — first Next.js build on Vercel"] },
    // Shutdown and rebirth
    { date: "2025-08-10", items: [
      "Shutdown notice — KittenGames goes offline; this page would stay up until 01-01-2026",
      "Traffic growth led to school blocking; moved to VPS; lost the spark and bigger 'why'",
    ] },
    { date: "2025-09-21", items: [
      "Reborn: KittenGames → KittenMovies-Reborn",
      "New co-owner/funder: Pjotters-Company and CodingKitten",
      "Added Pjotter-AI (via OpenRouter)",
      "Added About and Updates pages",
      "Improved movie/TV players with soft timeouts and source switching",
    ] },
    // 2026 — planned
    { date: "Coming Soon: 2026-01-01 or earlier", items: [
      "KittenGames Reborn - 2025-10-31",
      "Markdown answers in Pjotter‑AI - 2025-10-31",
      "Threaded chats (multiple sessions) - 2026-01-01",
      "Custom timeline filters - 2026-01-01",
      "Mobile offline mode - 2026-03-01",
      "Mirror priority editor for TV - 2026-01-01",
      "AI feedback - Witch Movie Next - 2025-12-01",
      "Continue watching - 2025-11-01",
      "More glass‑morphism polish - 2026-01-01",
    ] },
  ];

  // Helper: safe date parsing (supports labels like "Coming Soon: 2026-01-01 or earlier")
  const parseDate = (raw: string) => {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
    const m = raw.match(/(20\d{2})-(\d{2})-(\d{2})/);
    if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}`);
    // Fallback to first day of current year if still invalid
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1);
  };

  // Derive unique months directly from updates (ensures 2022..2026 coverage)
  const timelineMonths = useMemo(() => {
    const map = new Map<string, { key: string; label: string; year: number; month: number }>();
    for (const u of updates) {
      const d = parseDate(u.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: d.toLocaleString(undefined, { month: "short" }),
          year: d.getFullYear(),
          month: d.getMonth() + 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
  }, [updates]);

  // Map updates by YYYY-MM for quick lookup
  const updatesByMonth = useMemo(() => {
    const map = new Map<string, UpdateEntry[]>();
    for (const u of updates) {
      const d = parseDate(u.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const arr = map.get(key) || [];
      arr.push(u);
      map.set(key, arr);
    }
    return map;
  }, [updates]);

  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Only render months that actually have updates, maintain chronological order within the last 24 months
  const activeMonths = useMemo(() => {
    return timelineMonths.filter((m) => updatesByMonth.has(m.key));
  }, [timelineMonths, updatesByMonth]);

  // Release notes newest -> oldest
  const sortedUpdates = useMemo(() => {
    return [...updates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [updates]);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header currentPage="updates" />
      <main className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold text-white mb-6">Updates</h1>

        {/* Timeline Section */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-3">Timeline 2022–2026</h2>
          <div className="text-xs text-gray-500 mb-2">Scroll →</div>
          <div className="relative bg-gray-900/60 border border-gray-800 rounded-xl p-6 overflow-visible min-h-[14rem]">
            {/* Animated gradient sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[pulse_3s_ease-in-out_infinite]" />

            {/* Line with alternating up/down capsules */}
            <div className="relative mt-2 overflow-x-auto">
              <div className="relative min-w-full px-2">
                {/* center line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #a855f7 0%, #f97316 25%, #ec4899 50%, #22d3ee 75%, #22c55e 100%)" }} />
                {/* points */}
                <div className="relative flex items-stretch gap-16 py-10">
                  {timelineMonths.map((m: { key: string; label: string; year: number; month: number }, idx: number) => {
                    const key = m.key;
                    const isUp = idx % 2 === 0; // alternate
                    const colorClasses = [
                      "bg-purple-500 border-purple-400",
                      "bg-orange-500 border-orange-400",
                      "bg-pink-500 border-pink-400",
                      "bg-cyan-400 border-cyan-300",
                      "bg-green-500 border-green-400",
                    ];
                    const color = colorClasses[idx % colorClasses.length];
                    const monthUpdates = updatesByMonth.get(key) || [];
                    const title = `${m.label} ${m.year}`;
                    return (
                      <div key={key} className="relative shrink-0 w-40">
                        {/* connector */}
                        <div className={`absolute left-1/2 -translate-x-1/2 ${isUp ? 'top-0 h-1/2' : 'bottom-0 h-1/2'} w-px bg-gray-700`} />
                        {/* dot on line */}
                        <button
                          type="button"
                          onClick={() => setActiveKey(key)}
                          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-3.5 h-3.5 rounded-full border shadow-[0_0_0_3px_rgba(255,255,255,0.06)] transition-transform hover:scale-110 focus:scale-110 ${color}`}
                          aria-label={`Open ${key} updates`}
                          title={`${title} • ${monthUpdates.length} update${monthUpdates.length===1?'':'s'}`}
                        />
                        {/* capsule */}
                        <div className={`absolute left-1/2 -translate-x-1/2 ${isUp ? 'top-0 -translate-y-2' : 'bottom-0 translate-y-2'} w-40`}>
                          <div className="mx-auto rounded-2xl border border-gray-800 bg-gray-900/70 backdrop-blur p-3 text-center">
                            <div className="text-xs text-white font-semibold">{m.year}</div>
                            <div className="text-[10px] text-gray-400">{m.label}</div>
                            <div className="mt-1 text-[10px] text-gray-500">{monthUpdates.length} update{monthUpdates.length===1?'':'s'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Popup for active month */}
          {activeKey && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setActiveKey(null)} />
              <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl animate-[fadeIn_200ms_ease-out]">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="text-white font-semibold">{activeKey} Updates</h3>
                    <button
                      onClick={() => setActiveKey(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {(updatesByMonth.get(activeKey) || []).map((u: UpdateEntry, idx: number) => (
                      <div key={`${activeKey}-${idx}`} className="rounded-lg bg-gray-800/60 p-3 border border-gray-700">
                        <div className="text-xs text-gray-400 mb-1">{u.date}</div>
                        <ul className="list-disc list-inside text-gray-200 space-y-1">
                          {u.items.map((it: string, i: number) => (
                            <li key={`${u.date}-${i}`}>{it}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-right">
                    <button
                      onClick={() => setActiveKey(null)}
                      className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Classic list */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-3">Release Notes</h2>
          <div className="space-y-6">
            {sortedUpdates.map((u: UpdateEntry, idx: number) => (
              <div
                key={`${u.date}-${idx}`}
                className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-purple-500/40 transition-colors"
              >
                <div className="text-sm text-gray-400 mb-2">{u.date}</div>
                <ul className="list-disc list-inside text-gray-200 space-y-1">
                  {u.items.map((it: string, i: number) => (
                    <li key={`${u.date}-${i}`}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Coming Soon */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Coming Soon…</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {["KittenGames Reborn","Markdown answers in Pjotter‑AI", "Threaded chats (multiple sessions)", "Custom timeline filters", "Mobile offline mode", "Mirror priority editor for TV", "AI feedback - Witch Movie Next", "Continue watching", "More glass‑morphism polish"].map((t, i) => (
              <div
                key={`soon-${i}`}
                className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-gray-200">{t}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
