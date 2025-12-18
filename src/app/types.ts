export interface TemplateSlot {
  month: number; // 1-12
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Template {
  id: string;
  name: string;
  imageUrl: string; // The PNG overlay/background
  thumbnailUrl: string; // Thumbnail image for template selector
  configUrl: string; // Path to JSON config file
  slots: TemplateSlot[]; // Will be loaded from config
  width: number;
  height: number;
}

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  month: number | null; // 1-12 or null
  width: number;
  height: number;
}
