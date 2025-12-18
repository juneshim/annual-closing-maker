import { Template, TemplateSlot } from '../types';

// Template dimensions (assuming 1920x1080 based on JSON coordinates)
const WIDTH = 1920;
const HEIGHT = 1080;

// Interface for JSON config file structure
interface RectangleConfig {
  id: number;
  position: { left: number; top: number };
  size: { width: number; height: number };
  style: { background: string; borderRadius: number };
}

interface FrameConfig {
  rectangles: RectangleConfig[];
}

// Helper function to convert JSON config to TemplateSlots
export function convertConfigToSlots(config: FrameConfig): TemplateSlot[] {
  return config.rectangles
    .sort((a, b) => a.id - b.id) // Ensure months are in order
    .map((rect) => ({
      month: rect.id,
      x: rect.position.left,
      y: rect.position.top,
      width: rect.size.width,
      height: rect.size.height,
    }));
}

// Helper function to load JSON config
export async function loadTemplateConfig(configUrl: string): Promise<TemplateSlot[]> {
  try {
    const response = await fetch(configUrl);
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    const config: FrameConfig = await response.json();
    return convertConfigToSlots(config);
  } catch (error) {
    console.error(`Error loading template config from ${configUrl}:`, error);
    throw error;
  }
}

export const TEMPLATES: Template[] = [
  {
    id: 'frame-1',
    name: '기본',
    imageUrl: '/assets/frame-1.PNG',
    thumbnailUrl: '/assets/frame-1.PNG',
    configUrl: '/assets/frame-1.json',
    width: WIDTH,
    height: HEIGHT,
    slots: [], // Will be loaded dynamically
  },
  {
    id: 'frame-2',
    name: '가나디 - 흰색',
    imageUrl: '/assets/frame-2.PNG',
    thumbnailUrl: '/assets/frame-2.PNG',
    configUrl: '/assets/frame-2.json',
    width: WIDTH,
    height: HEIGHT,
    slots: [], // Will be loaded dynamically
  },
  {
    id: 'frame-3',
    name: '가나디 - 검정',
    imageUrl: '/assets/frame-3.PNG',
    thumbnailUrl: '/assets/frame-3.PNG',
    configUrl: '/assets/frame-3.json',
    width: WIDTH,
    height: HEIGHT,
    slots: [], // Will be loaded dynamically
  },
];
