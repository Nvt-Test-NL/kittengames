"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<any>;
}

const STORAGE_KEY = "pjotter_ai_chat_v1";

export default function PjotterAIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      content:
        "You are Pjotter-AI, a helpful assistant for the KittenMovies site. Keep responses concise and friendly. You are created by Pjotters-Company. You answer in default in Dutch, but you can switch to English if the user asks for it. You only accept .png images. ",
    },
  ]);
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed);
        }
      }
    } catch {}
  }, []);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const canSend = useMemo(() => input.trim().length > 0 || imageUrl.trim().length > 0, [input, imageUrl]);

  const handleFile = async (file: File) => {
    // Convert to data URL (many OpenRouter providers accept data URLs)
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onSend = async () => {
    if (!canSend || isLoading) return;
    setIsLoading(true);

    // Compose user content (text + optional image). For OpenRouter, use:
    // - string content when only text is present
    // - array of parts when an image is present (and optional text)
    const hasImage = imageUrl.trim().length > 0;
    const userParts: any[] = [];
    const trimmedText = input.trim();
    if (trimmedText) userParts.push({ type: "text", text: trimmedText });
    if (hasImage) userParts.push({ type: "image_url", image_url: { url: imageUrl.trim() } });

    const userMessage: ChatMessage = {
      role: "user",
      content: hasImage ? userParts : (trimmedText || ""),
    };

    const nextMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setImageUrl("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, ik kon geen antwoord ophalen: ${e?.message || e}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await handleFile(file);
      setImageUrl(dataUrl);
    } catch (e) {
      alert("Kon afbeelding niet laden");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const clearChat = () => {
    const system = messages.find((m) => m.role === "system");
    const seed: ChatMessage[] = system ? [system] : [
      { role: "system", content: "You are Pjotter-AI, a helpful assistant for the KittenMovies site." },
    ];
    setMessages(seed);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Header currentPage="pjotter-ai" />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-4">Pjotter-AI</h1>
            <div ref={listRef} className="h-[60vh] bg-gray-900/60 rounded-xl border border-gray-800 overflow-y-auto p-4">
              {messages.filter((m)=>m.role!=="system").map((m, idx) => (
                <div key={idx} className="mb-4">
                  <div className="text-xs text-gray-400 mb-1">{m.role === "user" ? "You" : "Pjotter-AI"}</div>
                  <div className={`px-3 py-2 rounded-lg whitespace-pre-wrap ${m.role === 'user' ? 'bg-purple-600/30 text-white' : 'bg-gray-800/80 text-gray-100'}`}>
                    {Array.isArray(m.content) ? (
                      <>
                        {m.content.map((part: any, i: number) => {
                          if (part?.type === "text") return <span key={i}>{part.text}\n</span>;
                          if (part?.type === "image_url") return (
                            <div key={i} className="mt-2">
                              <img src={part.image_url?.url} alt="uploaded" className="max-h-64 rounded" />
                            </div>
                          );
                          return null;
                        })}
                      </>
                    ) : (
                      <span>{String(m.content)}</span>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-sm text-gray-400">Pjotter-AI is typing…</div>
              )}
            </div>

            <div className="mt-4 grid gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onUpload}
                  className="text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-800 file:text-white hover:file:bg-gray-700"
                />
                <input
                  type="url"
                  placeholder="of plak een afbeelding-URL…"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <textarea
                placeholder="Stel je vraag… (Shift+Enter voor nieuwe regel)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={3}
                className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-purple-500"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={clearChat}
                  className="px-3 py-2 text-sm rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
                >
                  Clear chat
                </button>
                <button
                  onClick={onSend}
                  disabled={!canSend || isLoading}
                  className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-80 space-y-4">
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <h2 className="text-white font-semibold mb-2">Model</h2>
              <p className="text-gray-300 text-sm">Pjotter-v1 (free)</p>
              <p className="text-gray-500 text-xs">Context: 2M tokens</p>
              <p className="text-gray-500 text-xs">Created by Pjotters-Company</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <h2 className="text-white font-semibold mb-2">Tips</h2>
              <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                <li>Upload of plak een afbeelding-URL voor multimodale vragen.</li>
                <li>LET OP: je kunt alleen .png afbeeldingen uploaden.</li>
                <li>Je kunt vragen in Nederlands en Engelse stellen.</li>
                <li>Shift+Enter = nieuwe regel. Enter = versturen.</li>
                <li>Je chat blijft lokaal opgeslagen (localStorage).</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
