"use client";
import React from "react";
import Header from "../../components/Header";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header currentPage="about" />
      <main className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold text-white mb-4">About us</h1>
        <p className="text-gray-300 max-w-2xl">
        KittenGames didn’t even start with that name. It began as CodingKittenGames — just one page with five tiny games I shared with a few friends. That turned into KittenSchool: still a Google Site, but with subpages, more games, and even a few movies. From there came KittenGames V1 (the first real site), then V2 (more games, cleaner design), then V3 (my first Next.js build on Vercel). It was a little messy, but it was going somewhere — and that “somewhere” became V4.
        </p>
          <h1 className="text-3xl font-bold text-white mb-4">Reborn Time</h1>
        <p className="text-gray-300 max-w-2xl">Later mee informatie....
          </p>
      </main>
    </div>
  );
}
