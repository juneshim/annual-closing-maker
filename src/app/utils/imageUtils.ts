import { UploadedImage } from '../types';

/**
 * Calculate image dimensions to cover a slot while maintaining aspect ratio
 */
export function calculateImageCoverDimensions(
  imgWidth: number,
  imgHeight: number,
  slotWidth: number,
  slotHeight: number
): { width: number; height: number } {
  const imgRatio = imgWidth / imgHeight;
  const slotRatio = slotWidth / slotHeight;
  const isWider = imgRatio >= slotRatio;

  if (isWider) {
    return {
      width: slotHeight * imgRatio,
      height: slotHeight,
    };
  } else {
    return {
      width: slotWidth,
      height: slotWidth / imgRatio,
    };
  }
}

/**
 * Auto-assign months sequentially to images
 */
export function autoAssignMonths(images: UploadedImage[]): UploadedImage[] {
  return images.map((img, index) => ({
    ...img,
    month: index < 12 ? index + 1 : img.month,
  }));
}

/**
 * Get missing months from uploaded images
 */
export function getMissingMonths(images: UploadedImage[]): number[] {
  const usedMonths = new Set(images.map(img => img.month).filter(Boolean));
  const missingMonths: number[] = [];
  for (let m = 1; m <= 12; m++) {
    if (!usedMonths.has(m)) {
      missingMonths.push(m);
    }
  }
  return missingMonths;
}

