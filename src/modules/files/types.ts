export interface FileDto {
  id: string;
  originalName: string;
  storageName: string;
  mimeType: string;
  sizeBytes: number;
  folderName: string | null;
  createdAt: Date;
}
