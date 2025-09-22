"use client";

import React, { useState, useEffect, Fragment } from "react";
import Header from "../../components/Header";
import dynamic from "next/dynamic";
const MovieCard = dynamic(() => import("../../components/MovieCard"), { ssr: false });
import { Movie, TVShow, TMDBResponse } from "../../types/tmdb";
import {
  getPopularMovies,
  getPopularTVShows,
  getTrendingAll,
  getBackdropUrl,
} from "../../utils/tmdb";
import { getMovieDetails, getTVDetails, getSimilarMovies, getSimilarTV } from "../../utils/tmdb";
import { getHistory, type WatchProgress } from "../../utils/history";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Film, Tv, Flame, Loader2 } from "lucide-react";
import AdInFeed from "../../components/ads/AdInFeed";

export default function Movies() {
  const [trendingItems, setTrendingItems] = useState<(Movie | TVShow)[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<TVShow[]>([]);
  const [featuredItem, setFeaturedItem] = useState<Movie | TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("trending");
  const [continueWatching, setContinueWatching] = useState<(Movie | TVShow)[]>([]);
  const [aiRecommended, setAiRecommended] = useState<(Movie | TVShow)[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch trending content
        const trendingResponse: TMDBResponse = await getTrendingAll("week");
        const trending = trendingResponse.results.slice(0, 20);
        setTrendingItems(trending);

        // Set featured item (first trending item)
        if (trending.length > 0) {
          setFeaturedItem(trending[0]);
        }

        // Fetch popular movies
        const moviesResponse: TMDBResponse = await getPopularMovies();
        setPopularMovies(moviesResponse.results as Movie[]);

        // Fetch popular TV shows
        const tvResponse: TMDBResponse = await getPopularTVShows();
        setPopularTVShows(tvResponse.results as TVShow[]);
      } catch (error) {
        console.error("Error fetching TMDB data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load Continue Watching from localStorage and AI recommendations
  useEffect(() => {
    const loadPersonalized = async () => {
      try {
        const history: WatchProgress[] = getHistory();
        // Continue Watching: not finished, use most recent first, limit 10
        const cw = history.filter(h => !h.finished).sort((a,b)=>b.updatedAt - a.updatedAt).slice(0, 10);
        const cwDetails: (Movie | TVShow)[] = [];
        for (const h of cw) {
          try {
            const item = h.type === 'movie' ? await getMovieDetails(h.tmdbId) : await getTVDetails(h.tmdbId);
            cwDetails.push(item);
          } catch {}
          if (cwDetails.length >= 10) break;
        }
        setContinueWatching(cwDetails);

        // AI recommendations via OpenRouter -> returns ids; if empty, fallback to TMDB similar from last item
        let recItems: (Movie | TVShow)[] = [];
        try {
          const res = await fetch('/api/ai/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: history.map(h => ({ tmdbId: h.tmdbId, type: h.type })) })
          });
          const data = await res.json();
          const ids: Array<{ tmdbId: number, type: 'movie'|'tv' }> = Array.isArray(data?.ids) ? data.ids : [];
          for (const id of ids) {
            try {
              const item = id.type === 'movie' ? await getMovieDetails(id.tmdbId) : await getTVDetails(id.tmdbId);
              recItems.push(item);
              if (recItems.length >= 6) break;
            } catch {}
          }
        } catch {}

        if (recItems.length === 0) {
          // Fallback: take last watched and fetch similar
          const last = history[0];
          if (last) {
            try {
              const similar = last.type === 'movie' ? await getSimilarMovies(last.tmdbId) : await getSimilarTV(last.tmdbId);
              recItems = (similar.results as any[]).slice(0, 12);
            } catch {}
          }
        }
        setAiRecommended(recItems.slice(0,6));
      } catch (e) {
        // ignore personalization failure
      }
    };
    // Delay slightly to allow client hydration
    setTimeout(loadPersonalized, 0);
  }, []);

  const isMovie = (item: Movie | TVShow): item is Movie => {
    return "title" in item;
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header currentPage="movies" />
        <main className="container mx-auto px-4 py-8 pt-24">
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Continue Watching</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {continueWatching.map((item: Movie | TVShow) => (
                <MovieCard key={`cw-${('id' in item)? item.id : Math.random()}`} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* AI Recommends */}
        {aiRecommended.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">AI raadt aan</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {aiRecommended.map((item: Movie | TVShow, idx: number) => (
                <Fragment key={`ai-${idx}-${('id' in item)? item.id : idx}`}>
                  <MovieCard item={item} />
                </Fragment>
              ))}
            </div>
          </section>
        )}
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
              <p className="text-gray-400">Loading movies and shows...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header currentPage="movies" />

      {/* Featured Banner */}
      {featuredItem && (
        <section className="relative h-[70vh] overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center">
            <img
              src={getBackdropUrl(featuredItem.backdrop_path, "w1280") || ''}
              alt="Backdrop"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
            <div className="max-w-2xl text-white pt-20">
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                {isMovie(featuredItem) ? featuredItem.title : featuredItem.name}
              </h1>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-lg">
                    {formatRating(featuredItem.vote_average)}
                  </span>
                </div>
                <span className="text-gray-300">•</span>
                <span className="text-lg">
                  {isMovie(featuredItem)
                    ? new Date(featuredItem.release_date).getFullYear()
                    : new Date(featuredItem.first_air_date).getFullYear()}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-lg capitalize">
                  {isMovie(featuredItem) ? "Movie" : "TV Show"}
                </span>
              </div>
              <p className="text-lg text-gray-300 leading-relaxed mb-8 line-clamp-3">
                {featuredItem.overview}
              </p>
            </div>
          </div>
        </section>
      )}

      <main className="container mx-auto px-4 py-8 pt-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger
                value="trending"
                className="flex items-center space-x-2"
              >
                <Flame className="w-4 h-4" />
                <span>Trending</span>
              </TabsTrigger>
              <TabsTrigger
                value="movies"
                className="flex items-center space-x-2"
              >
                <Film className="w-4 h-4" />
                <span>Movies</span>
              </TabsTrigger>
              <TabsTrigger
                value="tv"
                className="flex items-center space-x-2"
              >
                <Tv className="w-4 h-4" />
                <span>TV Shows</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="trending" className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Trending This Week
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {trendingItems.map((item: Movie | TVShow, idx: number) => (
                <Fragment key={`trending-${idx}-${item.id}`}>
                  <MovieCard item={item} />
                  {((idx + 1) % 3 === 0) && (
                    <AdInFeed adSlot="5154592782" />
                  )}
                </Fragment>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="movies" className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Popular Movies
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {popularMovies.map((movie: Movie) => (
                <MovieCard
                  key={movie.id}
                  item={movie}
                  onClick={() => console.log("Movie clicked:", movie)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tv" className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Popular TV Shows
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {popularTVShows.map((show: TVShow) => (
                <MovieCard
                  key={show.id}
                  item={show}
                  onClick={() => console.log("TV Show clicked:", show)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
