import React, { useState, useRef, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { TemplateSelector } from './components/TemplateSelector';
import { Editor } from './components/Editor';
import { LoadingOverlay } from './components/LoadingOverlay';
import { DownloadSection } from './components/DownloadSection';
import { ConfirmModal } from './components/ConfirmModal';
import { TEMPLATES, loadTemplateConfig } from './data/templates';
import { UploadedImage, Template } from './types';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import html2canvas from 'html2canvas';
import { nanoid } from 'nanoid';

function App() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);

  // Load template slots from JSON config when template is selected
  useEffect(() => {
    const loadTemplate = async () => {
      const template = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
      if (!template) {
        return;
      }

      setIsLoadingTemplate(true);
      try {
        const slots = await loadTemplateConfig(template.configUrl);
        const loadedTemplate: Template = {
          ...template,
          slots,
        };
        setSelectedTemplate(loadedTemplate);
      } catch (error) {
        console.error('Failed to load template config:', error);
        toast.error('Failed to load template configuration. Please try again.');
        // Set template without slots as fallback
        setSelectedTemplate(template);
      } finally {
        setIsLoadingTemplate(false);
      }
    };

    loadTemplate();
  }, [selectedTemplateId]);

  const hasImages = images.length > 0;

  const proceedToGenerate = async (fillDefault: boolean) => {
    if (fillDefault) {
      // Find missing months
      const usedMonths = new Set(images.map(img => img.month).filter(Boolean));
      const missingMonths: number[] = [];
      for (let m = 1; m <= 12; m++) {
        if (!(usedMonths as Set<number>).has(m)) missingMonths.push(m);
      }

      // Create default images
      const url = '/assets/default-image.PNG';


      const defaultImages: UploadedImage[] = missingMonths.map(m => ({
        id: nanoid(),
        file: new File([], 'default'),
        previewUrl: url,
        month: m,
        width: 300,
        height: 200,
      }));
      
      setImages(prev => [...prev, ...defaultImages]);
    }

    setIsGenerating(true);
    // Fake delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setIsGenerated(true);
  };

  const handleGenerateClick = () => {
    if (!hasImages) {
      toast.error("Please upload at least one image.");
      return;
    }
    
    const usedMonths = new Set(images.map(img => img.month).filter(Boolean));
    if (usedMonths.size < 12) {
      setShowMissingModal(true);
    } else {
      proceedToGenerate(false);
    }
  };

  const handleDownload = async () => {
    if (!editorRef.current) {
      toast.error("Editor not ready. Please wait a moment.");
      return;
    }
    
    // Wait for all images to load before capturing
    const images = editorRef.current.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Image load timeout')), 10000);
      });
    });

    try {
      // Wait for all images to load
      await Promise.all(imagePromises);
      
      // Additional small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get actual dimensions from the container
      const container = editorRef.current;
      
      // Use template dimensions for the canvas
      const width = selectedTemplate.width;
      const height = selectedTemplate.height;
      
      const canvas = await html2canvas(container, {
        width: width,
        height: height,
        scale: 1, // Use 1:1 scale for exact 1920x1080 output
        x: 0,
        y: 0,
        backgroundColor: '#ffffff',
        logging: true, // Enable logging for debugging
        useCORS: true, // Allow cross-origin images (for blob URLs this helps)
        allowTaint: false, // Must be false when useCORS is true
        imageTimeout: 15000, // 15 second timeout for images
        removeContainer: false, // Don't remove container during capture
        foreignObjectRendering: false, // Better compatibility
        windowWidth: width,
        windowHeight: height,
        onclone: (clonedDoc) => {
          // Replace OKLCH colors with RGB before export
          const clonedWindow = clonedDoc.defaultView || (clonedDoc as any).parentWindow;
          if (!clonedWindow) return;

          // Find the cloned container and set it to exact 1920x1080 pixels
          const clonedContainer = clonedDoc.querySelector('[data-editor-container]') as HTMLElement;
          if (clonedContainer) {
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
              slotEl.style.overflow = 'hidden'; // Ensure images don't overflow slot
            });

            // Fix all images to exact pixel positions based on slot center + transform
            // Images are inside slot containers, so position relative to slot container center
            const images = clonedContainer.querySelectorAll('img[data-slot-month]');
            images.forEach((imgEl) => {
              const img = imgEl as HTMLImageElement;
              const month = parseInt(img.dataset.slotMonth || '0');
              const transformX = parseFloat(img.dataset.transformX || '0');
              const transformY = parseFloat(img.dataset.transformY || '0');
              const transformScale = parseFloat(img.dataset.transformScale || '1');
              
              // Debug logging for problematic images
              if (transformX !== 0 || transformY !== 0 || transformScale !== 1) {
                console.log(`[Export Debug Month ${month}]`, {
                  transformX,
                  transformY,
                  transformScale,
                });
              }
              
              // Find the slot container parent
              const slotContainer = img.closest('[data-slot-container]') as HTMLElement;
              if (!slotContainer) return;
              
              // Get slot dimensions from container
              const slotWidth = parseFloat(slotContainer.dataset.slotWidth || '0');
              const slotHeight = parseFloat(slotContainer.dataset.slotHeight || '0');
              
              // Get image natural dimensions
              const imgNaturalWidth = img.naturalWidth || slotWidth;
              const imgNaturalHeight = img.naturalHeight || slotHeight;
              
              // Calculate image display size (cover slot, maintain aspect ratio)
              // This is the ORIGINAL size before scale
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
              
              // Apply scale to get final size (CSS transform: scale(s) applies AFTER size)
              // Transform order: scale → translate (right to left in CSS)
              const scaledWidth = originalWidth * transformScale;
              const scaledHeight = originalHeight * transformScale;
              
              // Position image relative to slot container center
              // Slot container center is at (slotWidth/2, slotHeight/2)
              // TransformX/Y is in template pixel coordinates (slot center relative)
              // 
              // CSS transform: translate(x, y) scale(s) with transform-origin: 50% 50%
              // CSS applies transforms right-to-left: scale first, then translate
              // BUT: translate values are NOT scaled - they are absolute pixel offsets
              // 
              // Web behavior:
              // 1. Image is rendered at original size, centered in slot
              // 2. Scale is applied (image size changes, but center stays same)
              // 3. Translate is applied (image center moves by transformX/Y pixels)
              // 
              // Therefore: imgCenter = slotCenter + transformX/Y (NOT multiplied by scale)
              const slotCenterX = slotWidth / 2;
              const slotCenterY = slotHeight / 2;
              
              // Calculate image center position (same as web)
              const imgCenterX = slotCenterX + transformX;
              const imgCenterY = slotCenterY + transformY;
              
              // Calculate image left/top position (image center minus half scaled size)
              const imgLeft = imgCenterX - scaledWidth / 2;
              const imgTop = imgCenterY - scaledHeight / 2;
              
              // Debug logging for problematic images
              if (transformX !== 0 || transformY !== 0 || transformScale !== 1) {
                console.log(`[Export Debug Month ${month} - Calculated]`, {
                  slotCenterX,
                  slotCenterY,
                  originalWidth,
                  originalHeight,
                  scaledWidth,
                  scaledHeight,
                  transformX,
                  transformY,
                  transformScale,
                  imgCenterX,
                  imgCenterY,
                  imgLeft,
                  imgTop,
                });
              }
              
              img.style.position = 'absolute';
              // Use exact pixel values - DO NOT round here, let browser handle sub-pixel rendering
              img.style.left = `${imgLeft}px`;
              img.style.top = `${imgTop}px`;
              img.style.width = `${scaledWidth}px`;
              img.style.height = `${scaledHeight}px`;
              img.style.transform = 'none'; // Remove transform, use absolute positioning instead
              img.style.transformOrigin = '50% 50%'; // Explicitly set center origin
              img.style.margin = '0';
              img.style.padding = '0';
            });
          }

          // Color-related properties that might contain OKLCH
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

          // Function to replace OKLCH with RGB for a single element
          // Based on the user's provided pattern
          const replaceOklchWithRgb = (el: HTMLElement) => {
            try {
              const styles = clonedWindow.getComputedStyle(el);
              
              // Iterate through all CSS properties
              for (let i = 0; i < styles.length; i++) {
                const prop = styles[i];
                try {
                  const value = styles.getPropertyValue(prop);
                  
                  // Check if value contains OKLCH or if it's a color property
                  if (value && (value.includes('oklch') || colorProps.includes(prop))) {
                    // Get the computed RGB value (browser automatically converts OKLCH to RGB)
                    const computedValue = styles.getPropertyValue(prop);
                    
                    // If the computed value doesn't contain OKLCH, use it
                    // This ensures we get RGB values even from OKLCH sources
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

          // Function to walk through all elements recursively
          const processElement = (element: HTMLElement) => {
            replaceOklchWithRgb(element);
            
            // Process children
            Array.from(element.children).forEach(child => {
              processElement(child as HTMLElement);
            });
          };
          
          // Process all elements in the cloned document
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
                // Replace OKLCH with a placeholder that won't cause parsing errors
                // We'll rely on inline styles we set above
                cssText = cssText.replace(/oklch\([^)]+\)/gi, 'rgb(0, 0, 0)');
                styleTag.textContent = cssText;
              }
            } catch (e) {
              // Ignore errors
            }
          });

          // Disable external stylesheets that might contain OKLCH
          // Since we've already copied computed styles as inline styles
          const linkTags = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
          linkTags.forEach((linkTag) => {
            try {
              (linkTag as HTMLLinkElement).disabled = true;
            } catch (e) {
              // If disabling doesn't work, remove the link
              try {
                linkTag.remove();
              } catch (e2) {
                // Ignore
              }
            }
          });
        },
      });
      
      const link = document.createElement('a');
      link.download = `2025-연말결산.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Download started!");
    } catch (err) {
      console.error("Download error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to generate image: ${errorMessage}. Please try again.`);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-white text-slate-900 font-sans pb-20">
        <Toaster position="top-center" richColors />
        
        {(isGenerating || isLoadingTemplate) && <LoadingOverlay />}
        
        <ConfirmModal 
          isOpen={showMissingModal}
          onClose={() => setShowMissingModal(false)}
          onConfirm={(fill) => {
            setShowMissingModal(false);
            proceedToGenerate(fill);
          }}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Header />

          {!isGenerated ? (
            <main className="space-y-12">
              <UploadSection images={images} setImages={setImages} />
              
              <TemplateSelector 
                selectedTemplateId={selectedTemplateId} 
                onSelect={setSelectedTemplateId} 
              />

              <div className="flex justify-center py-8">
                <button
                  onClick={handleGenerateClick}
                  disabled={!hasImages}
                  className="px-12 py-4 bg-slate-900 text-white rounded-full text-xl font-bold shadow-lg hover:bg-slate-800 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                >
                  Generate Recap
                </button>
              </div>
            </main>
          ) : (
            <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Customize & Download</h2>
                <button 
                  onClick={() => setIsGenerated(false)}
                  className="text-slate-500 hover:text-slate-900 underline font-medium"
                >
                  Back to editing
                </button>
              </div>

              <Editor 
                template={selectedTemplate} 
                images={images} 
                containerRef={editorRef}
              />

              <DownloadSection onDownload={handleDownload} />
            </main>
          )}
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
