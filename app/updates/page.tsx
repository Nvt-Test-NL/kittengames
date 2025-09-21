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
    // Early history milestones (approximate months)
    { date: "2023-03-01", items: ["CodingKittenGames — first page with 5 tiny games shared with friends"] },
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
  ];

  // Derive a 24-month timeline window ending current month
  const timelineMonths = useMemo(() => {
    const months: { key: string; label: string; year: number; month: number }[] = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString(undefined, { month: "short" });
      months.push({ key, label, year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return months;
  }, []);

  // Map updates by YYYY-MM for quick lookup
  const updatesByMonth = useMemo(() => {
    const map = new Map<string, UpdateEntry[]>();
    for (const u of updates) {
      const d = new Date(u.date);
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
          <h2 className="text-xl font-semibold text-white mb-3">Timeline (last 24 months)</h2>
          <div className="text-xs text-gray-500 mb-2">Scroll →</div>
          <div className="relative bg-gray-900/60 border border-gray-800 rounded-xl p-5 overflow-hidden">
            {/* Animated gradient sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[pulse_3s_ease-in-out_infinite]" />

            {/* Horizontal line */}
            <div className="relative">
              <div className="h-1 bg-gray-800 rounded-full" />
              {/* Only show months that have updates; evenly spaced and scrollable */}
              <div className="mt-4 overflow-x-auto">
                <div className="min-w-full flex items-start gap-8 px-1">
                  {activeMonths.map((m: { key: string; label: string; year: number; month: number }, idx: number) => {
                    const key = m.key;
                    return (
                      <div key={key} className="flex flex-col items-center shrink-0 group">
                        <button
                          type="button"
                          onClick={() => setActiveKey(key)}
                          className="mt-[-14px] w-3.5 h-3.5 rounded-full border bg-purple-500 border-purple-400 hover:scale-110 focus:scale-110 transition-transform shadow-[0_0_0_3px_rgba(168,85,247,0.25)]"
                          aria-label={`Open ${key} updates`}
                        />
                        <div className="mt-2 text-[10px] text-gray-300 group-hover:text-white transition-colors">
                          {m.label}
                        </div>
                        <div className="text-[10px] text-gray-500">{m.year}</div>
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
