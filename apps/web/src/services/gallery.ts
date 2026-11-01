import type {
  Album,
  PaginatedPhotos
} from "../types/gallery";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? ""
).replace(/\/$/, "");

const API = `${API_BASE_URL}/api/gallery`;



export async function getAlbums(): Promise<Album[]> {
  const response = await fetch(`${API}/albums`);

  if (!response.ok) {
    throw new Error("Unable to fetch albums");
  }

  const data = await response.json();
  return data.albums;
}

export async function getPhotos(
  page = 1,
  limit = 30,
  albumId?: string
): Promise<PaginatedPhotos> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (albumId) {
    params.set("albumId", albumId);
  }

  const response = await fetch(
    `${API}/photos?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Unable to fetch photos");
  }

  return response.json();
}

export function getImageUrl(id: string) {
  return `${API}/photos/${encodeURIComponent(id)}/content`;
}