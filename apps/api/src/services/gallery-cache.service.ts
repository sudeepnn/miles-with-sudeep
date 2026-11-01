import {
  getAlbumTree,
  type DriveAlbum,
} from "./drive.service.js";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let cachedTree: DriveAlbum | null = null;
let cacheExpiresAt = 0;
let pendingRequest: Promise<DriveAlbum> | null = null;

export async function getCachedGallery(): Promise<DriveAlbum> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedTree && now < cacheExpiresAt) {
    return cachedTree;
  }

  // Avoid duplicate Google Drive scans for simultaneous requests
  if (pendingRequest) {
    return pendingRequest;
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error("Google Drive folder ID is missing");
  }

  pendingRequest = getAlbumTree(folderId)
    .then((tree) => {
      cachedTree = tree;
      cacheExpiresAt = Date.now() + CACHE_DURATION;

      return tree;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}

// Optional: manually clear the cache
export function clearGalleryCache(): void {
  cachedTree = null;
  cacheExpiresAt = 0;
}