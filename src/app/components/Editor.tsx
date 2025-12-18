import React, { useState, useEffect, useRef } from 'react';
import { Template, UploadedImage, TemplateSlot } from '../types';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

interface EditorProps {
  template: Template;
  images: UploadedImage[]; // Already assigned to months or sorted?
  // We need a mapping of Month -> Image.
  // The 'images' array contains images with a 'month' property.
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface ImageTransform {
  scale: number;
  x: number;
  y: number;
}

export function Editor({ template, images, containerRef }: EditorProps) {
  const [transforms,HZ] = useState<Record<number, ImageTransform>>({});
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const containerScaleRef = React.useRef<number>(1);
  
  // Prepare a Map for easy lookup
  const imageMap = React.useMemo(() => {
    const map = new Map<number, UploadedImage>();
    images.forEach(img => {
      if (img.month) map.set(img.month, img);
    });
    return map;
  }, [images]);

  // Calculate container scale (actual rendered size vs template size)
  React.useEffect(() => {
    if (!containerRef.current) return;
    
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scale = rect.width / template.width;
      containerScaleRef.current = scale;
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [containerRef, template.width]);

  const handleMouseDown = (e: React.MouseEvent, month: number) => {
    setSelectedMonth(month);
    // Drag logic could go here or use a library, 
    // but for MVP simpler "Click to select, then controls" might be safer.
    // However, prompt says "Drag to reposition".
    // We can implement simple drag.
  };

  // Dragging logic
  const dragStart = useRef<{x: number, y: number} | null>(null);
  const activeMonthRef = useRef<number | null>(null);

  const onMouseDown = (e: React.MouseEvent, month: number) => {
    e.preventDefault();
    setSelectedMonth(month);
    activeMonthRef.current = month;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (activeMonthRef.current === null || !dragStart.current) return;
    
    const month = activeMonthRef.current;
    // Convert screen pixels to template pixels using scale
    const scale = containerScaleRef.current || 1;
    const dx = (e.clientX - dragStart.current.x) / scale;
    const dy = (e.clientY - dragStart.current.y) / scale;
    
    dragStart.current = { x: e.clientX, y: e.clientY };
    
    HZ(prev => {
      const current = prev[month] || { scale: 1, x: 0, y: 0 };
      return {
        ...prev,
        [month]: { ...current, x: current.x + dx, y: current.y + dy }
      };
    });
  };

  const onMouseUp = () => {
    activeMonthRef.current = null;
    dragStart.current = null;
  };

  const updateScale = (month: number, delta: number) => {
    HZ(prev => {
      const current = prev[month] || { scale: 1, x: 0, y: 0 };
      const newScale = Math.max(0.5, Math.min(3, current.scale + delta));
      return {
        ...prev,
        [month]: { ...current, scale: newScale }
      };
    });
  };

  // Scale relative to container
  // We want to render at 1920x1080 internally, but scale down to fit screen.
  // The user sees a scaled down version.
  
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Controls for selected image */}
      <div className="h-16 flex items-center justify-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-full max-w-xl">
        {selectedMonth ? (
          <>
            <span className="font-medium text-slate-700">Month {selectedMonth}</span>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <button 
              onClick={() => updateScale(selectedMonth, -0.1)}
              className="p-2 hover:bg-slate-100 rounded-full"
            >
              <ZoomOut size={20} />
            </button>
            <input 
              type="range" 
              min="0.5" 
              max="3" 
              step="0.1"
              value={transforms[selectedMonth]?.scale || 1}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                HZ(prev => ({
                  ...prev,
                  [selectedMonth]: { ...(prev[selectedMonth] || { x: 0, y: 0 }), scale: val }
                }));
              }}
              className="w-32 accent-indigo-600"
            />
            <button 
              onClick={() => updateScale(selectedMonth, 0.1)}
              className="p-2 hover:bg-slate-100 rounded-full"
            >
              <ZoomIn size={20} />
            </button>
            <div className="ml-auto text-xs text-slate-400 flex items-center gap-1">
              <Move size={14} /> Drag to pan
            </div>
          </>
        ) : (
          <span className="text-slate-400">Click an image to edit position and scale</span>
        )}
      </div>

      {/* Canvas Area */}
      <div className="relative w-full overflow-hidden shadow-2xl rounded-sm border border-slate-200 bg-white">
        {/* We use a wrapper to maintain aspect ratio and fit in screen */}
        <div style={{ paddingBottom: `${(template.height / template.width) * 100}%` }} className="relative w-full">
            {/* The actual content container. We'll scale this with CSS transform if needed, 
                but actually for the Download to work best, we should render it at high res 
                scales OR just use percentages. 
                Using percentages is safer for responsiveness. 
                However, drag deltas (px) need to be adjusted if we are scaled. 
                For simplicity, we will assume 1px drag = 1px movement in the coordinate system of the container. 
            */}
            
              <div 
                ref={containerRef as any}
                data-editor-container
                className="absolute inset-0"
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Render Slots & Images */}
                {template.slots.map((slot) => {
                  const img = imageMap.get(slot.month);
                  const transform = transforms[slot.month] || { scale: 1, x: 0, y: 0 };
                  const isSelected = selectedMonth === slot.month;

                  // Determine aspect ratios to cover the slot initially
                  // Default to 1 if dimensions missing (should not happen with new upload)
                  const imgRatio = (img?.width || 1) / (img?.height || 1);
                  const slotRatio = slot.width / slot.height;
                  const isWider = imgRatio >= slotRatio;

                  return (
                    <div
                      key={slot.month}
                      className="absolute overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => img && onMouseDown(e, slot.month)}
                      data-slot-container
                      data-slot-x={slot.x}
                      data-slot-y={slot.y}
                      data-slot-width={slot.width}
                      data-slot-height={slot.height}
                      style={{
                        left: `${(slot.x / template.width) * 100}%`,
                        top: `${(slot.y / template.height) * 100}%`,
                        width: `${(slot.width / template.width) * 100}%`,
                        height: `${(slot.height / template.height) * 100}%`,
                        zIndex: 1, // Below template overlay
                      }}
                    >
                      {img ? (
                        <img
                          src={img.previewUrl}
                          alt={`Month ${slot.month}`}
                          className="pointer-events-none max-w-none max-h-none select-none"
                          data-slot-month={slot.month}
                          data-transform-x={transform.x}
                          data-transform-y={transform.y}
                          data-transform-scale={transform.scale}
                          style={{
                             width: isWider ? 'auto' : '100%',
                             height: isWider ? '100%' : 'auto',
                             // CSS transform: translate(x, y) scale(s) with transform-origin: 50% 50%
                             // CSS applies right-to-left: scale first, then translate
                             // translate values are absolute pixel offsets (NOT scaled)
                             // Final image center = slot center + (transformX, transformY)
                             transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                             transformOrigin: '50% 50%', // Explicitly center origin
                          }}
                          draggable={false}
                          onLoad={(e) => {
                            // Debug: Log web rendering values when image loads
                            if (transform.x !== 0 || transform.y !== 0 || transform.scale !== 1) {
                              const imgEl = e.currentTarget;
                              const slotContainer = imgEl.parentElement;
                              if (slotContainer) {
                                const containerRect = slotContainer.getBoundingClientRect();
                                const imgRect = imgEl.getBoundingClientRect();
                                const containerScale = containerScaleRef.current || 1;
                                console.log(`[Web Debug Month ${slot.month}]`, {
                                  slotCenterX: (slot.x + slot.width / 2) * containerScale,
                                  slotCenterY: (slot.y + slot.height / 2) * containerScale,
                                  transformX: transform.x,
                                  transformY: transform.y,
                                  transformScale: transform.scale,
                                  imgCenterX: imgRect.left + imgRect.width / 2 - containerRef.current!.getBoundingClientRect().left,
                                  imgCenterY: imgRect.top + imgRect.height / 2 - containerRef.current!.getBoundingClientRect().top,
                                  containerScale,
                                });
                              }
                            }
                          }}
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-xs"
                          style={{ backgroundColor: '#f1f5f9', color: '#cbd5e1' }}
                        >
                          Empty
                        </div>
                      )}
                      {isSelected && (
                        <div 
                          className="absolute inset-0 border-2 pointer-events-none" 
                          style={{ borderColor: '#6366f1' }}
                        />
                      )}
                    </div>
                  );
                })}

              {/* Template Overlay */}
              {/* PNG 프레임 이미지를 그대로 위에 덮어씌우는 방식 (frame-1.PNG는 투명 슬롯을 포함한 이미지라고 가정) */}
              <div 
                 className="absolute inset-0 pointer-events-none"
                 style={{ zIndex: 10 }}
              >
                <img
                  src={template.imageUrl}
                  alt="Year recap frame"
                  className="w-full h-full"
                  style={{ objectFit: 'fill' }}
                  draggable={false}
                />
                {/* 연도 텍스트가 필요하면 여기서 추가로 올리기 */}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
