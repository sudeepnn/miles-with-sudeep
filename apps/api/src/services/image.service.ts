import convert from "heic-convert";
import sharp from "sharp";

interface OptimizedImage {
  buffer: Buffer;
  contentType: string;
}

export async function optimizeImage(
  inputBuffer: Buffer,
  mimeType: string
): Promise<OptimizedImage> {

  let buffer = inputBuffer;

  // Convert HEIC/HEIF into JPEG first
  if (
    mimeType === "image/heic" ||
    mimeType === "image/heif" ||
    mimeType === "image/heic-sequence" ||
    mimeType === "image/heif-sequence"
  ) {
    const converted = await convert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.90,
    });

    buffer = Buffer.from(converted);
  }

  // Preserve animated GIFs instead of flattening their animation
  if (mimeType === "image/gif") {
    return {
      buffer,
      contentType: "image/gif",
    };
  }

  // Resize and compress
  const optimizedBuffer = await sharp(buffer, {
    limitInputPixels: 100_000_000,
  })
    .rotate()
    .resize({
      width: 2000,
      height: 2000,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 82,
      effort: 4,
    })
    .toBuffer();

  return {
    buffer: optimizedBuffer,
    contentType: "image/webp",
  };
}