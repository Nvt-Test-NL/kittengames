"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Header from "../../../../components/Header";
import StreamingErrorHelper from "../../../../components/StreamingErrorHelper";
import { Movie } from "../../../../types/tmdb";
import { getPosterUrl, getBackdropUrl } from "../../../../utils/tmdb";
import { getStreamingUrl, getStreamingSettings, getNextDomainId, setStreamingSettings } from "../../../../components/StreamingSettingsPanel";
import { Loader2, Star, Calendar, Clock, ChevronLeft, Play } from "lucide-react";
import axios from "axios";

interface MovieDetails extends Movie {
  runtime?: number;
  budget?: number;
  revenue?: number;
  genres?: Array<{ id: number; name: string }>;
  production_companies?: Array<{ id: number; name: string }>;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages?: Array<{ iso_639_1: string; name: string }>;
}

export default function MovieDetail() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showError, setShowError] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backGuardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/tmdb/movie/${slug}`);
        setMovie(response.data);
      } catch (error) {
        console.error("Error fetching movie details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMovieDetails();
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      const url = getStreamingUrl('movie', slug);
      setEmbedUrl(url);
    }
  }, [slug]);

  // Clear any pending load timeout on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (backGuardTimeoutRef.current) {
        clearTimeout(backGuardTimeoutRef.current);
        backGuardTimeoutRef.current = null;
      }
      if (typeof window !== 'undefined') {
        window.onpopstate = null as any;
      }
    };
  }, []);

  const installBackGuard = (durationMs = 8000) => {
    if (typeof window === 'undefined') return;
    try {
      // Push a dummy state and prevent immediate back navigation
      history.pushState(null, '', location.href);
      const handler = () => {
        history.go(1);
      };
      window.onpopstate = handler as any;
      if (backGuardTimeoutRef.current) clearTimeout(backGuardTimeoutRef.current);
      backGuardTimeoutRef.current = setTimeout(() => {
        if (window.onpopstate === handler) {
          window.onpopstate = null as any;
        }
        backGuardTimeoutRef.current = null;
      }, durationMs);
    } catch {}
  };

  const handleBackClick = () => {
    router.push("/movies");
  };

  const handlePlayClick = () => {
    setShowError(false);
    // Safari often framebusts or clears history when certain providers try to navigate top.
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isSafari = /safari/i.test(ua) && !/chrome|crios|android/i.test(ua);
    if (isSafari) {
      // Open directly in a new tab for a reliable experience
      try { window.open(embedUrl, '_blank', 'noopener,noreferrer'); } catch {}
      setShowPlayer(false);
      setShowError(false);
      installBackGuard(6000);
      return;
    }
    setShowPlayer(true);
    installBackGuard(6000);
    // Start timeout in case the iframe never fires onLoad due to X-Frame-Options/CSP
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = setTimeout(() => {
      handleIframeError();
    }, 5000);
  };

  const handleIframeError = () => {
    // Try automatic domain switch if enabled
    try {
      const settings = getStreamingSettings();
      if (settings.autoSwitch) {
        setIsSwitching(true);
        setShowPlayer(false);
        const nextId = getNextDomainId(settings.selectedDomain);
        const nextSettings = { ...settings, selectedDomain: nextId };
        setStreamingSettings(nextSettings);
        const url = getStreamingUrl('movie', slug);
        setEmbedUrl(url);
        setShowError(false);
        // allow iframe to mount after URL update
        setTimeout(() => setShowPlayer(true), 50);
        // restart load timeout
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = setTimeout(() => {
          handleIframeError();
        }, 5000);
        setTimeout(() => setIsSwitching(false), 400);
        return;
      }
    } catch (e) {
      // fall through to show helper
    }
    setShowError(true);
  };

  const handleRetry = () => {
    setShowError(false);
    setShowPlayer(false);
    setTimeout(() => {
      const url = getStreamingUrl('movie', slug);
      setEmbedUrl(url);
      setShowPlayer(true);
    }, 100);
  };

  const handleDomainSwitch = () => {
    const url = getStreamingUrl('movie', slug);
    setEmbedUrl(url);
    setShowError(false);
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header currentPage="movies" />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-gray-400">Loading movie details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header currentPage="movies" />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
            <button
              onClick={() => router.push("/movies")}
              className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
            >
              Back to Movies
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* Full-screen backdrop image */}
      {movie.backdrop_path && (
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-center bg-no-repeat bg-cover"
            style={{
              backgroundImage: `url(${getBackdropUrl(movie.backdrop_path, "original")})`,
              backgroundPosition: "center 15%",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />
          </div>
        </div>
      )}

      {/* Content positioned above backdrop */}
      <div className="relative z-10">
        <Header currentPage="movies" />

        {/* Back Button */}
        <div className="container mx-auto px-4 pt-24 pb-4">
          <button
            onClick={handleBackClick}
            className="flex items-center space-x-2 text-white hover:text-purple-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Movies</span>
          </button>
        </div>

        {/* Main content section */}
        <section className="container mx-auto px-4 py-8 min-h-[calc(100vh-12rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Movie Info - Left Column */}
            <div className="lg:col-span-5 text-white">
              <div className="flex flex-col md:flex-row lg:flex-col gap-6 items-start">
                {/* Poster - Only visible on medium screens */}
                <div className="w-48 h-72 rounded-xl overflow-hidden shadow-2xl hidden md:block lg:hidden">
                  <Image
                    src={getPosterUrl(movie.poster_path, "w500") || ""}
                    alt={movie.title}
                    width={192}
                    height={288}
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Movie Info */}
                <div className="max-w-xl">
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    {movie.title}
                  </h1>
                  
                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-lg font-medium">
                        {movie.vote_average.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-400">
                        ({movie.vote_count.toLocaleString()} votes)
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-lg">
                        {new Date(movie.release_date).getFullYear()}
                      </span>
                    </div>
                    {movie.runtime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-lg">{formatRuntime(movie.runtime)}</span>
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  {movie.genres && movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {movie.genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="px-3 py-1 bg-gray-800/60 border border-gray-700/50 rounded-full text-sm text-gray-300"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Overview */}
                  <p className="text-base text-gray-300 leading-relaxed mb-6">
                    {movie.overview}
                  </p>

                  {/* Play Button */}
                  {!showPlayer && (
                    <button
                      onClick={handlePlayClick}
                      className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors mb-6 transform hover:scale-105"
                    >
                      <Play className="w-5 h-5" />
                      <span>Watch Movie</span>
                    </button>
                  )}

                  {/* Movie Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex">
                      <span className="w-32 text-gray-400">Original Title</span>
                      <span>{movie.original_title}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-gray-400">Release Date</span>
                      <span>{new Date(movie.release_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-gray-400">Language</span>
                      <span>{movie.original_language.toUpperCase()}</span>
                    </div>
                    {movie.budget && movie.budget > 0 && (
                      <div className="flex">
                        <span className="w-32 text-gray-400">Budget</span>
                        <span>{formatMoney(movie.budget)}</span>
                      </div>
                    )}
                    {movie.revenue && movie.revenue > 0 && (
                      <div className="flex">
                        <span className="w-32 text-gray-400">Revenue</span>
                        <span>{formatMoney(movie.revenue)}</span>
                      </div>
                    )}
                    {movie.production_countries && movie.production_countries.length > 0 && (
                      <div className="flex">
                        <span className="w-32 text-gray-400">Countries</span>
                        <span>{movie.production_countries.map(c => c.name).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Video Player - Right Column */}
            <div className="lg:col-span-7">
              {showPlayer && (
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-400">
                    If the player is blocked on this device, try opening the source directly.
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={embedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-sm text-white border border-gray-700"
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              )}
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                {showPlayer ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    // Prevent framebusting/top navigation from the embed (not granting allow-top-navigation)
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
                    referrerPolicy="no-referrer"
                    allowFullScreen
                    title={movie.title}
                    onError={handleIframeError}
                    onLoad={() => {
                      setShowError(false);
                      setIsSwitching(false);
                      if (loadTimeoutRef.current) {
                        clearTimeout(loadTimeoutRef.current);
                        loadTimeoutRef.current = null;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 relative">
                    {/* Background poster with overlay */}
                    {movie.backdrop_path && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{
                          backgroundImage: `url(${getBackdropUrl(movie.backdrop_path, "w1280")})`,
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/80" />
                    
                    {/* Play Button Content */}
                    <div className="relative z-10 text-center text-white">
                      {isSwitching && (
                        <div className="mb-4 inline-flex items-center px-3 py-1.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs">
                          Switching source...
                        </div>
                      )}
                      <div className="w-20 h-20 mx-auto mb-4 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors cursor-pointer transform hover:scale-110">
                        <Play className="w-8 h-8 ml-1" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Ready to Watch</h3>
                      <p className="text-gray-300 mb-1">{movie.title}</p>
                      {movie.runtime && (
                        <p className="text-gray-400 text-sm mb-4">{formatRuntime(movie.runtime)}</p>
                      )}
                      <button
                        onClick={handlePlayClick}
                        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors transform hover:scale-105"
                      >
                        Start Movie
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Error Helper */}
              {showError && (
                <StreamingErrorHelper
                  type="movie"
                  onRetry={handleRetry}
                  onDomainSwitch={handleDomainSwitch}
                />
              )}
              
              {/* Player Controls */}
              {showPlayer && !showError && (
                <div className="flex justify-between items-center mt-4 text-gray-400 text-sm">
                  <div>
                    <p>Now playing: <span className="text-white">{movie.title}</span></p>
                    {movie.runtime && (
                      <p>{formatRuntime(movie.runtime)} • {new Date(movie.release_date).getFullYear()}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowPlayer(false)}
                    className="text-gray-400 hover:text-white transition-colors px-3 py-1 rounded bg-gray-800/50 hover:bg-gray-700/50"
                  >
                    Exit Player
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
