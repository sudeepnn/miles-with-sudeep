
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Images,
  X,
  Camera
} from "lucide-react";

import type { Album, Photo, PaginatedPhotos } from "./types/gallery";

import {
  getAlbums,
  getPhotos,
  getImageUrl
} from "./services/gallery";

function App() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const [activeAlbum, setActiveAlbum] =
    useState<string | null>(null);

  const [selectedPhoto, setSelectedPhoto] =
    useState<Photo | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] =
    useState<PaginatedPhotos["pagination"] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const LIMIT = 30;

  // Load albums
  useEffect(() => {
    getAlbums()
      .then(setAlbums)
      .catch(() => setError("Unable to load albums"));
  }, []);

  // Load paginated photos
  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      setLoading(true);
      setError("");

      try {
        const result = await getPhotos(
          page,
          LIMIT,
          activeAlbum ?? undefined
        );

        if (!cancelled) {
          setPhotos(result.photos);
          setPagination(result.pagination);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load photographs");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPhotos();

    return () => {
      cancelled = true;
    };
  }, [activeAlbum, page]);

  // Change album
  function selectAlbum(albumId: string | null) {
    setActiveAlbum(albumId);
    setPage(1);
    setSelectedPhoto(null);
  }

  // Change page
  function changePage(nextPage: number) {
    if (!pagination) return;

    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages
    ) {
      return;
    }

    setSelectedPhoto(null);
    setPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // Navigate through currently loaded photos
  function navigatePhoto(direction: number) {
    if (!selectedPhoto || photos.length === 0) return;

    const currentIndex = photos.findIndex(
      photo => photo.id === selectedPhoto.id
    );

    if (currentIndex === -1) return;

    const nextIndex =
      (currentIndex + direction + photos.length) %
      photos.length;

    setSelectedPhoto(photos[nextIndex]);
  }

  return (
    <main className="min-h-screen px-5 md:px-12 lg:px-20">

      {/* Navigation */}

      <nav className="flex items-center justify-between py-7">
        <div className="flex items-center gap-2">
          <Camera size={21} />
          <span className="font-semibold tracking-wider">
            LOST IN FRAME
          </span>
        </div>

        <span className="text-sm text-neutral-400">
          A visual journal
        </span>
      </nav>

      {/* Hero */}

      <section className="py-16 md:py-24">
        <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
          Photography · Travel · Memories
        </p>

        <h1 className="max-w-3xl text-5xl font-light leading-tight md:text-7xl">
          Every place has
          <br />
          a story to tell.
        </h1>

        <p className="mt-6 max-w-lg text-neutral-400">
          A collection of moments, places and memories
          captured along the way.
        </p>
      </section>

      {/* Albums */}

      <section className="mb-16">
        <div className="mb-7 flex items-center justify-between">
          <h2 className="text-2xl font-light">
            Explore albums
          </h2>

          <span className="text-sm text-neutral-500">
            {albums.length} collections
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {albums.map(album => (
            <button
              key={album.id}
              onClick={() => selectAlbum(album.id)}
              className="group text-left"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-lg bg-neutral-800">
                {album.coverImage && (
                  <img
                    src={getImageUrl(album.coverImage)}
                    alt={album.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                )}
              </div>

              <h3 className="mt-3 text-sm font-medium">
                {album.name}
              </h3>

              <p className="mt-1 text-xs text-neutral-500">
                {album.photoCount} photographs
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Masonry gallery */}

      <section className="pb-20">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-light">
              {activeAlbum
                ? albums.find(a => a.id === activeAlbum)?.name
                : "All photographs"}
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              {pagination?.totalPhotos ?? 0} photographs
            </p>
          </div>

          {activeAlbum && (
            <button
              onClick={() => selectAlbum(null)}
              className="flex items-center gap-2 text-sm text-neutral-400"
            >
              <ArrowLeft size={16} />
              All photos
            </button>
          )}
        </div>

        {loading ? (
          <p className="py-20 text-center text-neutral-400">
            Loading photographs...
          </p>
        ) : error ? (
          <p className="py-20 text-center text-red-400">
            {error}
          </p>
        ) : photos.length === 0 ? (
          <p className="py-20 text-center text-neutral-400">
            No photographs found.
          </p>
        ) : (
          <>
            {/* Pinterest masonry */}

            <div className="columns-2 gap-3 space-y-3 md:columns-3 lg:columns-4">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group mb-3 block w-full overflow-hidden rounded-lg bg-neutral-900"
                >
                  <img
                    src={getImageUrl(photo.id)}
                    alt={photo.name}
                    loading="lazy"
                    className="h-auto w-full transition duration-500 group-hover:scale-[1.02]"
                  />
                </button>
              ))}
            </div>

            {/* Pagination */}

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-5">

                <button
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => changePage(page - 1)}
                  className="flex items-center gap-2 rounded-full border border-neutral-700 px-5 py-2.5 text-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>

                <span className="text-sm text-neutral-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => changePage(page + 1)}
                  className="flex items-center gap-2 rounded-full border border-neutral-700 px-5 py-2.5 text-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                  <ArrowRight size={16} />
                </button>

              </div>
            )}
          </>
        )}
      </section>

      {/* Lightbox */}

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-5"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute right-6 top-6"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={28} />
          </button>

          <button
            className="absolute left-4 md:left-10"
            onClick={event => {
              event.stopPropagation();
              navigatePhoto(-1);
            }}
          >
            <ArrowLeft size={28} />
          </button>

          <img
            src={getImageUrl(selectedPhoto.id)}
            alt={selectedPhoto.name}
            onClick={event => event.stopPropagation()}
            className="max-h-[85vh] max-w-[85vw] object-contain"
          />

          <button
            className="absolute right-4 md:right-10"
            onClick={event => {
              event.stopPropagation();
              navigatePhoto(1);
            }}
          >
            <ArrowRight size={28} />
          </button>
        </div>
      )}

      {/* Footer */}

      <footer className="border-t border-neutral-800 py-8 text-center text-xs text-neutral-500">
        <Images className="mx-auto mb-3" size={20} />
        Made with memories.
      </footer>

    </main>
  );
}

export default App;
