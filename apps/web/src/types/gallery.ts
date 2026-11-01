export interface Photo {
  id: string;
  name: string;
  mimeType: string;
  albumId: string;
  albumName: string;
  width?: number;
  height?: number;
  modifiedTime?: string;
}

export interface Album {
  id: string;
  name: string;
  photoCount: number;
  coverImage: string | null;
}

export interface PaginatedPhotos {
  photos: Photo[];
  pagination: {
    page: number;
    limit: number;
    totalPhotos: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}