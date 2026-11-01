import { drive } from "../config/googleDrive.js";

const FOLDER_MIME =
  "application/vnd.google-apps.folder";

export interface DrivePhoto {
  id: string;
  name: string;
  mimeType: string;
  size?: string | null;
  width?: number;
  height?: number;
  modifiedTime?: string | null;
}

export interface DriveAlbum {
  id: string;
  name: string;
  photos: DrivePhoto[];
  children: DriveAlbum[];
}

async function listChildren(folderId: string) {
  const files = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: 1000,
      pageToken,
      orderBy: "name",
      fields: [
        "nextPageToken",
        "files(id,name,mimeType,size,modifiedTime,imageMediaMetadata)"
      ].join(","),
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    files.push(...(response.data.files ?? []));
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

export async function getAlbumTree(
  folderId: string,
  name = "Photography"
): Promise<DriveAlbum> {

  const children = await listChildren(folderId);

  const album: DriveAlbum = {
    id: folderId,
    name,
    photos: [],
    children: []
  };

  for (const file of children) {
    if (!file.id || !file.name) continue;

    if (file.mimeType === FOLDER_MIME) {
      album.children.push(
        await getAlbumTree(file.id, file.name)
      );
    } else if (file.mimeType?.startsWith("image/")) {
      album.photos.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        width: file.imageMediaMetadata?.width,
        height: file.imageMediaMetadata?.height,
        modifiedTime: file.modifiedTime
      });
    }
  }

  return album;
}

export function flattenPhotos(
  album: DriveAlbum
): (DrivePhoto & { albumId: string; albumName: string })[] {
  const current = album.photos.map(photo => ({
    ...photo,
    albumId: album.id,
    albumName: album.name
  }));

  return [
    ...current,
    ...album.children.flatMap(flattenPhotos)
  ];
}

export function flattenAlbums(
  album: DriveAlbum
): DriveAlbum[] {
  return [
    album,
    ...album.children.flatMap(flattenAlbums)
  ];
}