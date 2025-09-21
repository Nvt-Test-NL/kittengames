"use client";
import React from "react";
import Header from "../../components/Header";

type UpdateEntry = {
  date: string;
  items: string[];
};

export default function UpdatesPage() {
  const updates: UpdateEntry[] = [
    {
      date: "2025-09-21",
      items: [
        "Added Pjotter-AI (via OpenRouter)",
        "Added About and Updates pages",
        "Improved movie/TV players with soft timeouts and source switching",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <Header currentPage="updates" />
      <main className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold text-white mb-6">Updates</h1>
        <div className="space-y-6">
          {updates.map((u: UpdateEntry, idx: number) => (
            <div
              key={`${u.date}-${idx}`}
              className="p-4 rounded-xl bg-gray-900/60 border border-gray-800"
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
      </main>
    </div>
  );
}
