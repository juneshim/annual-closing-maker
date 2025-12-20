import React, { useState, useRef, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ArrowLeft } from 'lucide-react';
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
import { nanoid } from 'nanoid';
import { exportCanvasToPNG } from './utils/exportUtils';
import { getMissingMonths, autoAssignMonths } from './utils/imageUtils';
import { strings, replacePlaceholders } from './utils/strings';

/**
 * CONSTRAINT: Export Calculation Rules
 * 
 * Export MUST produce pixel-perfect identical results to web rendering when containerScale = 1
 * 
 * Formula: imgCenter = slotCenter + transformX/Y (template pixels)
 * - transformX/Y are NEVER multiplied by transformScale
 * - transformScale is ONLY used for: scaledWidth = originalWidth * transformScale
 * - Position is ALWAYS: imgLeft = imgCenterX - scaledWidth / 2
 * 
 * This ensures WYSIWYG (What You See Is What You Get)
 */

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
        toast.error(strings.app.toast.templateLoadError);
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
      const missingMonths = getMissingMonths(images);
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
    // Scroll to top when entering Customize & Download screen
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateClick = () => {
    if (!hasImages) {
      toast.error(strings.app.toast.uploadError);
      return;
    }
    
    const missingMonths = getMissingMonths(images);
    if (missingMonths.length > 0) {
      setShowMissingModal(true);
    } else {
      proceedToGenerate(false);
    }
  };

  const handleDownload = async () => {
    if (!editorRef.current) {
      toast.error(strings.app.toast.editorNotReady);
      return;
    }

    try {
      await exportCanvasToPNG(editorRef.current, selectedTemplate);
      toast.success(strings.app.toast.downloadStarted);
    } catch (err) {
      console.error("Download error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(replacePlaceholders(strings.app.toast.downloadError, { message: errorMessage }));
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-white text-slate-900 font-sans pb-16 sm:pb-20">
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
            <main className="space-y-6 sm:space-y-8 lg:space-y-12">
              <UploadSection images={images} setImages={setImages} />
              
              <TemplateSelector 
                selectedTemplateId={selectedTemplateId} 
                onSelect={setSelectedTemplateId} 
              />

              {!showMissingModal && !isGenerating && !isLoadingTemplate && (
                <div className="sticky bottom-0 left-0 right-0 py-3 sm:py-4 px-4 sm:px-6 z-50 sm:static sm:py-6 sm:py-8 flex justify-center">
                  <button
                    onClick={handleGenerateClick}
                    disabled={!hasImages}
                    className="w-full sm:w-auto sm:min-w-[300px] sm:px-12 py-3.5 sm:py-4 bg-slate-900 text-white rounded-full text-base sm:text-lg lg:text-xl font-bold shadow-lg hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px]"
                  >
                    {strings.app.generateRecap}
                  </button>
                </div>
              )}
            </main>
          ) : (
            <main className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <h2 className="text-lg sm:text-2xl font-normal text-slate-900">{strings.app.customizeDownload}</h2>
                <button 
                  onClick={() => setIsGenerated(false)}
                  className="inline-flex items-center gap-1 text-sm sm:text-base text-slate-500 hover:text-slate-900 underline font-medium min-h-[44px] sm:min-h-0 self-start sm:self-auto"
                >
                  <ArrowLeft size={16} />
                  {strings.app.backToEditing}
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
