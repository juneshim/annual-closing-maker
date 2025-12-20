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
  });

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

    // Get image natural dimensions
    const imgNaturalWidth = img.naturalWidth || slotWidth;
    const imgNaturalHeight = img.naturalHeight || slotHeight;

    // Calculate position and size
    const position = calculateImageExportPosition(
      imgNaturalWidth,
      imgNaturalHeight,
      slotWidth,
      slotHeight,
      transformX,
      transformY,
      transformScale
    );

    // Log export positions for debugging (only when transform is non-default)
    if (transformX !== 0 || transformY !== 0 || transformScale !== 1) {
      console.log(`[Export Final Position Month ${month}]`, {
        slotCenterX: slotWidth / 2,
        slotCenterY: slotHeight / 2,
        transformX,
        transformY,
        transformScale,
        imgCenterX: position.left + position.width / 2,
        imgCenterY: position.top + position.height / 2,
        imgLeft: position.left,
        imgTop: position.top,
        verified: true,
      });
    }

    img.style.position = 'absolute';
    img.style.left = `${position.left}px`;
    img.style.top = `${position.top}px`;
    img.style.width = `${position.width}px`;
    img.style.height = `${position.height}px`;
    img.style.transform = 'none';
    img.style.transformOrigin = '50% 50%';
    img.style.margin = '0';
    img.style.padding = '0';
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
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
      setTimeout(() => reject(new Error('Image load timeout')), 10000);
    });
  });

  await Promise.all(imagePromises);
  await new Promise(resolve => setTimeout(resolve, 100));

  const width = template.width;
  const height = template.height;

  const canvas = await html2canvas(container, {
    width,
    height,
    scale: 1,
    x: 0,
    y: 0,
    backgroundColor: '#ffffff',
    logging: true,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15000,
    removeContainer: false,
    foreignObjectRendering: false,
    windowWidth: width,
    windowHeight: height,
    onclone: (clonedDoc) => {
      prepareDocumentForExport(clonedDoc, width, height);
      replaceOklchColors(clonedDoc);
    },
  });

  const link = document.createElement('a');
  link.download = `2025-연말결산.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

