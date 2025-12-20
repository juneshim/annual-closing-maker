import html2canvas from 'html2canvas';
import { Template } from '../types';

/**
 * Calculate image position and size for export
 * CONSTRAINT: Export MUST match web rendering exactly when containerScale = 1
 */
export function calculateImageExportPosition(
  imgNaturalWidth: number,
  imgNaturalHeight: number,
  slotWidth: number,
  slotHeight: number,
  transformX: number,
  transformY: number,
  transformScale: number
): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  // Calculate slot center
  const slotCenterX = slotWidth / 2;
  const slotCenterY = slotHeight / 2;

  // Calculate original image size (before transformScale)
  const imgRatio = imgNaturalWidth / imgNaturalHeight;
  const slotRatio = slotWidth / slotHeight;
  const isWider = imgRatio >= slotRatio;

  let originalWidth: number;
  let originalHeight: number;
  if (isWider) {
    originalHeight = slotHeight;
    originalWidth = originalHeight * imgRatio;
  } else {
    originalWidth = slotWidth;
    originalHeight = originalWidth / imgRatio;
  }

  // Apply transformScale to get final size (width and height only)
  const scaledWidth = originalWidth * transformScale;
  const scaledHeight = originalHeight * transformScale;

  // Calculate image center position
  // transformX/Y are in template pixels, NOT multiplied by transformScale
  const imgCenterX = slotCenterX + transformX;
  const imgCenterY = slotCenterY + transformY;

  // Calculate image left/top position from center
  const imgLeft = imgCenterX - scaledWidth / 2;
  const imgTop = imgCenterY - scaledHeight / 2;

  return {
    left: imgLeft,
    top: imgTop,
    width: scaledWidth,
    height: scaledHeight,
  };
}

/**
 * Prepare cloned document for export by fixing dimensions and positions
 */
export function prepareDocumentForExport(
  clonedDoc: Document,
  width: number,
  height: number
): void {
  const clonedWindow = clonedDoc.defaultView || (clonedDoc as any).parentWindow;
  if (!clonedWindow) return;

  // Find the cloned container and set it to exact pixel dimensions
  const clonedContainer = clonedDoc.querySelector('[data-editor-container]') as HTMLElement;
  if (!clonedContainer) return;

  // Set exact pixel dimensions to avoid any scaling/whitespace
  clonedContainer.style.width = `${width}px`;
  clonedContainer.style.height = `${height}px`;
  clonedContainer.style.position = 'absolute';
  clonedContainer.style.top = '0';
  clonedContainer.style.left = '0';
  clonedContainer.style.margin = '0';
  clonedContainer.style.padding = '0';

  // Also set parent containers to exact size
  const parent = clonedContainer.parentElement;
  if (parent) {
    parent.style.width = `${width}px`;
    parent.style.height = `${height}px`;
    parent.style.paddingBottom = '0';
    parent.style.position = 'relative';
    parent.style.margin = '0';
    parent.style.padding = '0';
  }

  const grandParent = parent?.parentElement;
  if (grandParent) {
    grandParent.style.width = `${width}px`;
    grandParent.style.height = `${height}px`;
    grandParent.style.margin = '0';
    grandParent.style.padding = '0';
  }

  // Ensure body and html don't add extra space
  const body = clonedDoc.body;
  if (body) {
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.width = `${width}px`;
    body.style.height = `${height}px`;
    body.style.overflow = 'hidden';
  }

  const html = clonedDoc.documentElement;
  if (html) {
    html.style.margin = '0';
    html.style.padding = '0';
    html.style.width = `${width}px`;
    html.style.height = `${height}px`;
    html.style.overflow = 'hidden';
  }

  // Fix all slot containers to exact pixel positions
  const slotContainers = clonedContainer.querySelectorAll('[data-slot-container]');
  slotContainers.forEach((slotContainer) => {
    const slotEl = slotContainer as HTMLElement;
    const slotX = parseFloat(slotEl.dataset.slotX || '0');
    const slotY = parseFloat(slotEl.dataset.slotY || '0');
    const slotWidth = parseFloat(slotEl.dataset.slotWidth || '0');
    const slotHeight = parseFloat(slotEl.dataset.slotHeight || '0');

    slotEl.style.position = 'absolute';
    slotEl.style.left = `${slotX}px`;
    slotEl.style.top = `${slotY}px`;
    slotEl.style.width = `${slotWidth}px`;
    slotEl.style.height = `${slotHeight}px`;
    slotEl.style.overflow = 'hidden';
    slotEl.style.visibility = 'visible';
    slotEl.style.display = 'block';
  });

  // Ensure template overlay image is visible
  const templateOverlay = clonedContainer.querySelector('img[alt="Year recap frame"]') as HTMLImageElement;
  if (templateOverlay) {
    templateOverlay.style.position = 'absolute';
    templateOverlay.style.top = '0';
    templateOverlay.style.left = '0';
    templateOverlay.style.width = `${width}px`;
    templateOverlay.style.height = `${height}px`;
    templateOverlay.style.objectFit = 'fill';
    templateOverlay.style.visibility = 'visible';
    templateOverlay.style.display = 'block';
    templateOverlay.style.zIndex = '100';
  }

  // Fix all images to exact pixel positions
  const images = clonedContainer.querySelectorAll('img[data-slot-month]');
  images.forEach((imgEl) => {
    const img = imgEl as HTMLImageElement;
    const month = parseInt(img.dataset.slotMonth || '0');
    const transformX = parseFloat(img.dataset.transformX || '0');
    const transformY = parseFloat(img.dataset.transformY || '0');
    const transformScale = parseFloat(img.dataset.transformScale || '1');

    // Find the slot container parent
    const slotContainer = img.closest('[data-slot-container]') as HTMLElement;
    if (!slotContainer) return;

    // Get slot dimensions from container
    const slotWidth = parseFloat(slotContainer.dataset.slotWidth || '0');
    const slotHeight = parseFloat(slotContainer.dataset.slotHeight || '0');

    // Get image natural dimensions - prefer data attributes (original image size)
    // These are set from the UploadedImage object which has the actual image dimensions
    let imgNaturalWidth = parseFloat(img.dataset.imgWidth || '0');
    let imgNaturalHeight = parseFloat(img.dataset.imgHeight || '0');
    
    // Fallback to naturalWidth/naturalHeight if data attributes are not available
    if (!imgNaturalWidth || !imgNaturalHeight || imgNaturalWidth === 0 || imgNaturalHeight === 0) {
      imgNaturalWidth = img.naturalWidth || img.width || slotWidth;
      imgNaturalHeight = img.naturalHeight || img.height || slotHeight;
    }
    
    // Final fallback to slot dimensions if still not available
    if (!imgNaturalWidth || !imgNaturalHeight || imgNaturalWidth === 0 || imgNaturalHeight === 0) {
      imgNaturalWidth = slotWidth;
      imgNaturalHeight = slotHeight;
    }

    const exportTransformX = transformX * 8;
    const exportTransformY = transformY * 8;

    // Calculate position and size
    const position = calculateImageExportPosition(
      imgNaturalWidth,
      imgNaturalHeight,
      slotWidth,
      slotHeight,
      exportTransformX,
      exportTransformY,
      transformScale
    );

    // Log export positions for debugging (only when transform is non-default)
    if (transformX !== 0 || transformY !== 0 || transformScale !== 1) {
      console.log(`[Export Final Position Month ${month}]`, {
        slotCenterX: slotWidth / 2,
        slotCenterY: slotHeight / 2,
        originalTransformX: transformX,
        originalTransformY: transformY,
        exportTransformX: exportTransformX,
        exportTransformY: exportTransformY,
        transformScale,
        imgCenterX: position.left + position.width / 2,
        imgCenterY: position.top + position.height / 2,
        imgLeft: position.left,
        imgTop: position.top,
        verified: true,
      });
    }

    // Ensure image is visible and properly positioned
    img.style.position = 'absolute';
    img.style.left = `${position.left}px`;
    img.style.top = `${position.top}px`;
    img.style.width = `${position.width}px`;
    img.style.height = `${position.height}px`;
    img.style.transform = 'none';
    img.style.transformOrigin = '50% 50%';
    img.style.margin = '0';
    img.style.padding = '0';
    img.style.border = 'none';
    img.style.outline = 'none';
    img.style.objectFit = 'cover';
    img.style.objectPosition = 'center center';
    img.style.imageRendering = 'auto'; // Use auto for better browser compatibility
    img.style.display = 'block';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
    // Ensure image is loaded and displayed at full quality
    img.loading = 'eager';
    img.decoding = 'sync';
    
    // Force image to reload if needed
    if (img.complete && img.naturalWidth === 0) {
      const src = img.src;
      img.src = '';
      img.src = src;
    }
  });
}

/**
 * Replace OKLCH colors with RGB in cloned document
 */
export function replaceOklchColors(clonedDoc: Document): void {
  const clonedWindow = clonedDoc.defaultView || (clonedDoc as any).parentWindow;
  if (!clonedWindow) return;

  const colorProps = [
    'color',
    'backgroundColor',
    'background',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'border',
    'borderTop',
    'borderRight',
    'borderBottom',
    'borderLeft',
    'outlineColor',
    'outline',
    'textDecorationColor',
    'columnRuleColor',
    'boxShadow',
    'textShadow',
    'fill',
    'stroke',
  ];

  const replaceOklchWithRgb = (el: HTMLElement) => {
    try {
      const styles = clonedWindow.getComputedStyle(el);

      for (let i = 0; i < styles.length; i++) {
        const prop = styles[i];
        try {
          const value = styles.getPropertyValue(prop);

          if (value && (value.includes('oklch') || colorProps.includes(prop))) {
            const computedValue = styles.getPropertyValue(prop);

            if (computedValue && !computedValue.includes('oklch') && computedValue !== 'none') {
              el.style.setProperty(prop, computedValue, 'important');
            }
          }
        } catch (e) {
          // Ignore errors for individual properties
        }
      }
    } catch (e) {
      // Silently ignore errors for individual elements
    }
  };

  const processElement = (element: HTMLElement) => {
    replaceOklchWithRgb(element);
    Array.from(element.children).forEach(child => {
      processElement(child as HTMLElement);
    });
  };

  const rootElement = clonedDoc.body || clonedDoc.documentElement;
  if (rootElement) {
    processElement(rootElement as HTMLElement);
  }

  // Process all style tags to remove OKLCH
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    try {
      let cssText = styleTag.textContent || '';
      if (cssText.includes('oklch')) {
        cssText = cssText.replace(/oklch\([^)]+\)/gi, 'rgb(0, 0, 0)');
        styleTag.textContent = cssText;
      }
    } catch (e) {
      // Ignore errors
    }
  });

  // Disable external stylesheets that might contain OKLCH
  const linkTags = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
  linkTags.forEach((linkTag) => {
    try {
      (linkTag as HTMLLinkElement).disabled = true;
    } catch (e) {
      try {
        linkTag.remove();
      } catch (e2) {
        // Ignore
      }
    }
  });
}

/**
 * Export editor canvas to PNG
 */
export async function exportCanvasToPNG(
  container: HTMLElement,
  template: Template
): Promise<void> {
  // Wait for all images to load before capturing
  const images = container.querySelectorAll('img');
  const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Image load timeout: ${img.src}`)), 30000);
      img.onload = () => {
        clearTimeout(timeout);
        // Ensure natural dimensions are available
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          resolve();
        } else {
          // Wait a bit more for dimensions to be available
          setTimeout(() => {
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              resolve();
            } else {
              reject(new Error(`Image dimensions not available: ${img.src}`));
            }
          }, 100);
        }
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image: ${img.src}`));
      };
      // Force reload if image is already loaded but dimensions are missing
      if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
        const src = img.src;
        img.src = '';
        img.src = src;
      }
    });
  });

  await Promise.all(imagePromises);
  
  // Additional wait to ensure all images are fully rendered and dimensions are set
  await new Promise(resolve => setTimeout(resolve, 500));

  const width = template.width;
  const height = template.height;

  // Use scale 2 for high quality export
  const scale = 2;

  console.log('Export settings:', {
    templateSize: { width, height },
    scale
  });

  let canvas = await html2canvas(container, {
    width: width,
    height: height,
    scale: scale,
    x: 0,
    y: 0,
    backgroundColor: '#ffffff',
    logging: true, // Enable logging to debug
    useCORS: true,
    allowTaint: false,
    imageTimeout: 30000,
    removeContainer: false,
    foreignObjectRendering: false, // Disable to avoid rendering issues
    windowWidth: width,
    windowHeight: height,
    onclone: (clonedDoc) => {
      prepareDocumentForExport(clonedDoc, width, height);
      replaceOklchColors(clonedDoc);
    },
  });

  // If canvas size doesn't match template, resize it
  let finalCanvas = canvas;
  if (canvas.width !== width || canvas.height !== height) {
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = width;
    resizedCanvas.height = height;
    const ctx = resizedCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, width, height);
      finalCanvas = resizedCanvas;
    }
  }

  // Convert canvas to blob for better quality and file size
  finalCanvas.toBlob((blob) => {
    if (!blob) {
      // Fallback to data URL if blob creation fails
      const link = document.createElement('a');
      link.download = `2025-연말결산.png`;
      link.href = finalCanvas.toDataURL('image/png', 1.0); // Maximum quality
      link.click();
      return;
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `2025-연말결산.png`;
    link.href = url;
    link.click();
    
    // Clean up the object URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, 'image/png', 1.0); // Maximum quality PNG
}

