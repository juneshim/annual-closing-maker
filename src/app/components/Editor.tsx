import React, { useState, useEffect, useRef } from 'react';
import { Template, UploadedImage } from '../types';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import { calculateImageCoverDimensions } from '../utils/imageUtils';
import { strings } from '../utils/strings';

/**
 * CONSTRAINT: Coordinate System Rules
 * 
 * 1. All transformX/Y values are in TEMPLATE PIXEL coordinates
 * 2. transformScale is ONLY for width/height, NEVER for position
 * 3. containerScale is ONLY for display, NEVER in transform calculations
 * 4. Web rendering: imgCenter = slotCenter + (transformX, transformY)
 * 5. Export MUST use identical formula (WYSIWYG principle)
 * 
 * FORBIDDEN PATTERNS:
 * - transformX * transformScale
 * - transformY * transformScale
 * - Any position calculation using scale
 */

interface EditorProps {
  template: Template;
  images: UploadedImage[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface ImageTransform {
  scale: number;  // ONLY for width/height, NEVER for position
  x: number;      // Template pixel offset (center-based)
  y: number;      // Template pixel offset (center-based)
}

export function Editor({ template, images, containerRef }: EditorProps) {
  const [transforms, setTransforms] = useState<Record<number, ImageTransform>>({});
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

  // CONSTRAINT: containerScale is ONLY for display/responsive rendering
  // It is NEVER used in transform calculations - transformX/Y are ALWAYS in template pixels
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

  // ============================================================================
  // Drag Logic: Image Repositioning
  // ============================================================================
  // CONSTRAINT: 드래그 중 누적 오차 방지
  // - dragStartRef는 드래그 시작 시점의 기준값만 저장
  // - mousemove 중에는 절대 갱신하지 않음
  // - 항상 드래그 시작 시점 기준으로만 계산하여 순수 template px 유지
  const dragStartRef = useRef<{
    mouseX: number;  // 드래그 시작 시점의 마우스 X (screen px)
    mouseY: number;  // 드래그 시작 시점의 마우스 Y (screen px)
    baseX: number;   // 드래그 시작 시점의 transformX (template px)
    baseY: number;   // 드래그 시작 시점의 transformY (template px)
  } | null>(null);
  const activeMonthRef = useRef<number | null>(null);

  /**
   * Start dragging an image
   * - 드래그 시작 시점의 기준값을 고정 저장
   * - 이후 mousemove에서는 이 기준값만 사용 (누적 오차 방지)
   */
  const handleDragStart = (e: React.MouseEvent, month: number) => {
    e.preventDefault();
    setSelectedMonth(month);
    activeMonthRef.current = month;

    // 현재 transform 값을 기준값으로 저장 (드래그 시작 시점 기준)
    const current = transforms[month] || { scale: 1, x: 0, y: 0 };

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      baseX: current.x,
      baseY: current.y,
    };
  };

  /**
   * Handle mouse move during drag
   * - CONSTRAINT: 누적 방식 금지, 항상 드래그 시작 시점 기준으로만 계산
   * - baseX + dx, baseY + dy 방식으로 순수 template px 유지
   * - mousemove 중 dragStartRef는 절대 갱신하지 않음
   */
  const handleDragMove = (e: React.MouseEvent) => {
    if (activeMonthRef.current === null || !dragStartRef.current) return;

    const { mouseX, mouseY, baseX, baseY } = dragStartRef.current;
    const containerScale = containerScaleRef.current || 1;
    const month = activeMonthRef.current;

    // 드래그 시작 시점부터의 총 이동량 계산 (screen px)
    const screenDx = e.clientX - mouseX;
    const screenDy = e.clientY - mouseY;

    // CONSTRAINT: Convert screen pixels to template pixels
    // containerScale is ONLY for display, transformX/Y are ALWAYS in template pixels
    const templateDx = screenDx / containerScale;
    const templateDy = screenDy / containerScale;

    // CONSTRAINT: 누적 금지 - 항상 드래그 시작 시점 기준으로만 계산
    // baseX + dx 방식으로 순수 template px 유지 (오차 누적 방지)
    setTransforms((prev) => ({
      ...prev,
      [month]: {
        ...(prev[month] || { scale: 1 }),
        x: baseX + templateDx,
        y: baseY + templateDy,
      },
    }));
  };

  /**
   * End dragging
   * - Clears drag state
   * - Called on mouse up or mouse leave
   */
  const handleDragEnd = () => {
    activeMonthRef.current = null;
    dragStartRef.current = null;
  };

  // CONSTRAINT: transformScale is ONLY for image size (width/height)
  // It NEVER affects position calculations
  const updateScale = (month: number, delta: number) => {
    setTransforms(prev => {
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
      <div className="h-16 sm:h-16 flex items-center justify-center gap-2 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl w-full max-w-xl" style={{ boxShadow: 'none' }}>
        {selectedMonth ? (
          <>
            <span className="font-medium text-sm sm:text-base text-slate-700">{strings.editor.month} {selectedMonth}</span>
            <div className="h-6 sm:h-8 w-px bg-slate-200 mx-1 sm:mx-2" />
            <button 
              onClick={() => updateScale(selectedMonth, -0.1)}
              className="p-2.5 sm:p-2 hover:bg-slate-100 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0"
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
                setTransforms(prev => ({
                  ...prev,
                  [selectedMonth]: { ...(prev[selectedMonth] || { x: 0, y: 0 }), scale: val }
                }));
              }}
              className="w-24 sm:w-32 accent-indigo-600"
            />
            <button 
              onClick={() => updateScale(selectedMonth, 0.1)}
              className="p-2.5 sm:p-2 hover:bg-slate-100 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0"
            >
              <ZoomIn size={20} />
            </button>
            <div className="ml-auto text-xs text-slate-400 flex items-center gap-1 hidden sm:flex">
              <Move size={14} /> {strings.editor.dragToPan}
            </div>
          </>
        ) : (
          <span className="text-xs sm:text-sm text-slate-400" style={{ color: 'var(--sidebar-ring)' }}>{strings.editor.clickToEdit}</span>
        )}
      </div>

      {/* Canvas Area */}
      <div className="relative w-full overflow-hidden shadow-2xl rounded-sm border border-slate-200 bg-white">
        {/* We use a wrapper to maintain aspect ratio and fit in screen */}
        <div style={{ paddingBottom: `${(template.height / template.width) * 100}%` }} className="relative w-full">
            {/* CONSTRAINT: All coordinates are in template pixel coordinate system
                - containerScale is ONLY for responsive display
                - transformX/Y are ALWAYS in template pixels (converted from screen via /containerScale)
                - Export uses identical formulas when containerScale = 1
            */}
            
              <div 
                ref={containerRef as any}
                data-editor-container
                className="absolute inset-0"
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
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

                  // Calculate image dimensions to cover the slot
                  const { width: coverWidth, height: coverHeight } = calculateImageCoverDimensions(
                    img?.width || 1,
                    img?.height || 1,
                    slot.width,
                    slot.height
                  );
                  const isWider = coverWidth >= slot.width;

                  return (
                    <div
                      key={slot.month}
                      className="absolute overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => img && handleDragStart(e, slot.month)}
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
                             // CONSTRAINT: Transform values are in template pixel coordinates
                             // transformX/Y: center offset in template pixels (NOT multiplied by scale)
                             // transformScale: size multiplier (ONLY affects width/height, never position)
                             // CSS transform: translate(transformX, transformY) scale(transformScale)
                             // transform-origin: 50% 50% (center-based)
                             // Result: imgCenter = slotCenter + (transformX, transformY) in template pixels
                             transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                             transformOrigin: '50% 50%',
                          }}
                          draggable={false}
                          onLoad={(e) => {
                            // Verification: Log web rendering values for debugging
                            // Only log when containerScale = 1 to verify WYSIWYG
                            if (transform.x !== 0 || transform.y !== 0 || transform.scale !== 1) {
                              const imgEl = e.currentTarget;
                              const slotContainer = imgEl.parentElement;
                              if (slotContainer && containerRef.current) {
                                const containerScale = containerScaleRef.current || 1;
                                // Only verify when containerScale = 1 (exact template size)
                                if (Math.abs(containerScale - 1) < 0.01) {
                                  const imgRect = imgEl.getBoundingClientRect();
                                  const containerRect = containerRef.current.getBoundingClientRect();
                                  const slotCenterX = slot.x + slot.width / 2;
                                  const slotCenterY = slot.y + slot.height / 2;
                                  const expectedImgCenterX = slotCenterX + transform.x;
                                  const expectedImgCenterY = slotCenterY + transform.y;
                                  const actualImgCenterX = (imgRect.left + imgRect.width / 2 - containerRect.left);
                                  const actualImgCenterY = (imgRect.top + imgRect.height / 2 - containerRect.top);
                                  const diffX = Math.abs(expectedImgCenterX - actualImgCenterX);
                                  const diffY = Math.abs(expectedImgCenterY - actualImgCenterY);
                                  
                                  console.log(`[Web Verification Month ${slot.month}]`, {
                                    slotCenterX,
                                    slotCenterY,
                                    transformX: transform.x,
                                    transformY: transform.y,
                                    transformScale: transform.scale,
                                    expectedImgCenterX,
                                    expectedImgCenterY,
                                    actualImgCenterX,
                                    actualImgCenterY,
                                    diffX,
                                    diffY,
                                    match: diffX < 1 && diffY < 1,
                                  });
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-xs"
                          style={{ backgroundColor: '#f1f5f9', color: '#cbd5e1' }}
                        >
                          {strings.editor.empty}
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
