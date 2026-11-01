import { Router } from "express";
import { Readable } from "node:stream";
import { optimizeImage } from "../services/image.service.js";
import { drive } from "../config/googleDrive.js";
import { getCachedGallery } from "../services/gallery-cache.service.js";

import {
  getAlbumTree,
  flattenAlbums,
  flattenPhotos
} from "../services/drive.service.js";

const router = Router();

const rootFolderId =
  process.env.GOOGLE_DRIVE_FOLDER_ID;

if (!rootFolderId) {
  throw new Error("Google Drive folder ID missing");
}

// GET /api/gallery/albums
router.get("/albums", async (_req, res, next) => {
  try {
    const tree = await getCachedGallery();

    const albums = flattenAlbums(tree).map(album => ({
      id: album.id,
      name: album.name,
      photoCount: flattenPhotos(album).length,
      coverImage: album.photos[0]?.id ??
        album.children.find(child =>
          flattenPhotos(child).length > 0
        )?.photos[0]?.id ?? null
    }));

    res.json({ albums });
  } catch (error) {
    next(error);
  }
});

// GET /api/gallery/photos
router.get("/photos", async (req, res, next) => {
  try {
    // 1. Get cached gallery
    const tree = await getCachedGallery();

    // 2. Get all photos from cached folder tree
    let photos = flattenPhotos(tree);

    // 3. Filter by album if albumId is provided
    const albumId = req.query.albumId as string | undefined;

    if (albumId) {
      photos = photos.filter(
        (photo) => photo.albumId === albumId
      );
    }

    // 4. Read pagination parameters
    const page = Math.max(
      1,
      Number.parseInt(req.query.page as string, 10) || 1
    );

    const requestedLimit = Number.parseInt(
      req.query.limit as string,
      10
    );

    const limit = Math.min(
      100,
      Math.max(1, requestedLimit || 30)
    );

    // 5. Calculate pagination
    const totalPhotos = photos.length;
    const totalPages = Math.ceil(totalPhotos / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // 6. Get only requested photos
    const paginatedPhotos = photos.slice(
      startIndex,
      endIndex
    );

    // 7. Return response
    res.json({
      photos: paginatedPhotos,

      pagination: {
        page,
        limit,
        totalPhotos,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/gallery/photos/:id/content
router.get("/photos/:id/content", async (req, res, next) => {
  try {
    const fileId = req.params.id;

    // 1. Verify image belongs to Photography folder
    const tree = await getCachedGallery();
    const allowedPhotos = flattenPhotos(tree);

    const requestedPhoto = allowedPhotos.find(
      (photo) => photo.id === fileId
    );

    if (!requestedPhoto) {
      return res.status(404).json({
        message: "Image not found",
      });
    }

    // 2. Get file metadata
    const metadata = await drive.files.get({
      fileId,
      fields: "id,mimeType,size",
    });

    const mimeType = metadata.data.mimeType?.toLowerCase();

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
      "image/heif",
      "image/heic-sequence",
      "image/heif-sequence",
      "image/avif",
      "image/tiff",
    ];

    if (!mimeType || !allowedMimeTypes.includes(mimeType)) {
      return res.status(415).json({
        message: "Unsupported image type",
      });
    }

    // 3. Protect against excessively large downloads
    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    if (
      metadata.data.size &&
      Number(metadata.data.size) > MAX_FILE_SIZE
    ) {
      return res.status(413).json({
        message: "Image is too large",
      });
    }

    // 4. Download original image
    const { data } = await drive.files.get(
      {
        fileId,
        alt: "media",
      },
      {
        responseType: "arraybuffer",
      }
    );

    const inputBuffer = Buffer.from(data as ArrayBuffer);

    // 5. Optimize image
    const optimized = await optimizeImage(
      inputBuffer,
      mimeType
    );

    // 6. Return optimized image
    res.setHeader(
      "Content-Type",
      optimized.contentType
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=86400"
    );

    res.setHeader(
      "X-Content-Type-Options",
      "nosniff"
    );

    return res.send(optimized.buffer);

  } catch (error) {
    next(error);
  }
});

export default router;