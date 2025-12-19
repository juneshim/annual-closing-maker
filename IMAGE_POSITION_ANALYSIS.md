# 이미지 위치 계산식 분석

## 1. 웹 화면에서의 이미지 위치 계산 (Editor.tsx)

### 구조:
```
containerRef (100% x 100%, 반응형)
  └─ Slot Container (%, 템플릿 좌표를 %로 변환)
      └─ Image (absolute, transform 적용)
```

### Slot Container 위치/크기:
- `left = (slot.x / template.width) * 100%`
- `top = (slot.y / template.height) * 100%`
- `width = (slot.width / template.width) * 100%`
- `height = (slot.height / template.height) * 100%`

**실제 픽셀 좌표** (containerRef가 실제 렌더링된 크기):
- `containerScale = containerRef.actualWidth / template.width`
- `slotContainer.left (px) = slot.x * containerScale`
- `slotContainer.top (px) = slot.y * containerScale`
- `slotContainer.width (px) = slot.width * containerScale`
- `slotContainer.height (px) = slot.height * containerScale`

### 이미지 크기 (transform 적용 전):
- 이미지가 slot을 채우도록 설정:
  - `width: isWider ? 'auto' : '100%'`
  - `height: isWider ? '100%' : 'auto'`
- 실제 픽셀 크기:
  - `isWider`: `imgWidth = slotContainer.height * imgRatio`, `imgHeight = slotContainer.height`
  - `!isWider`: `imgWidth = slotContainer.width`, `imgHeight = slotContainer.width / imgRatio`

**템플릿 픽셀 기준으로 정규화하면:**
- `originalImgWidth = slot.width * imgRatio` (if isWider) or `slot.width` (if !isWider)
- `originalImgHeight = slot.height` (if isWider) or `slot.width / imgRatio` (if !isWider)

### 이미지 Transform:
```css
transform: translate(transformX, transformY) scale(transformScale)
transform-origin: 50% 50%
```

**CSS transform 적용 순서** (오른쪽 → 왼쪽):
1. `scale(transformScale)` 적용 → 이미지 크기 변경
2. `translate(transformX, transformY)` 적용 → 이동

### Transform 값의 의미:
- `transformX`, `transformY`: 드래그로 저장된 값
- 드래그 계산 (라인 74-75):
  ```javascript
  dx = (e.clientX - dragStart.current.x) / containerScale
  dy = (e.clientY - dragStart.current.y) / containerScale
  ```
- 즉, `transformX/Y`는 **템플릿 픽셀 기준** 값

### 실제 이미지 위치 (웹 화면):
이미지는 slot container 내부에서:
1. **초기 위치**: slot container의 center (transform-origin: 50% 50%)
2. **크기 변경**: `scale(transformScale)` 적용
   - 스케일 후 크기: `scaledImgWidth = originalImgWidth * transformScale * containerScale`
   - 스케일 후 크기: `scaledImgHeight = originalImgHeight * transformScale * containerScale`
3. **이동**: `translate(transformX, transformY)` 적용
   - translate 값: `transformX * containerScale` (px), `transformY * containerScale` (px)

**최종 이미지 center 위치** (slot container 기준):
- `imgCenterX = slotContainer.width/2 + transformX * containerScale`
- `imgCenterY = slotContainer.height/2 + transformY * containerScale`

**템플릿 픽셀 기준으로 정규화:**
- `imgCenterX (template px) = slot.width/2 + transformX`
- `imgCenterY (template px) = slot.height/2 + transformY`

---

## 2. Export 시 이미지 위치 계산 (App.tsx onclone)

### Slot Container 위치/크기:
```javascript
slotEl.style.left = `${slotX}px`;      // slot.x
slotEl.style.top = `${slotY}px`;       // slot.y
slotEl.style.width = `${slotWidth}px`;  // slot.width
slotEl.style.height = `${slotHeight}px`; // slot.height
```
✅ 정확함: 템플릿 픽셀 좌표 직접 사용

### 이미지 크기 계산:
```javascript
// originalWidth/Height 계산 (슬롯을 채우는 크기)
if (isWider) {
  originalHeight = slotHeight;  // slot.height
  originalWidth = originalHeight * imgRatio;
} else {
  originalWidth = slotWidth;    // slot.width
  originalHeight = originalWidth / imgRatio;
}

// scale 적용
scaledWidth = originalWidth * transformScale;
scaledHeight = originalHeight * transformScale;
```
✅ 정확함: 웹과 동일한 로직

### 이미지 위치 계산:
```javascript
slotCenterX = slotWidth / 2;   // slot.width / 2
slotCenterY = slotHeight / 2;  // slot.height / 2

imgLeft = slotCenterX - scaledWidth / 2 + (transformX * transformScale);
imgTop = slotCenterY - scaledHeight / 2 + (transformY * transformScale);
```

**❌ 문제 발견!**

웹에서는:
- 이미지 center = slot center + transform offset
- `imgCenterX = slot.width/2 + transformX`

Export에서는:
- 이미지 center = slot center + (transform offset * scale)
- `imgCenterX = slot.width/2 + transformX * transformScale`

**차이점**: Export에서 `transformX * transformScale`을 사용하지만, 웹에서는 `transformX`만 사용합니다!

---

## 문제 원인 분석

CSS transform `translate(x, y) scale(s)`의 실제 의미:
- `transform-origin: 50% 50%` (center)
- 적용 순서: scale → translate
- **translate 값은 scale된 좌표계를 기준으로 적용됨**

하지만, 우리의 transformX/Y는 **템플릿 픽셀 기준**으로 저장되어 있습니다.

웹에서의 실제 동작:
1. 이미지가 original 크기로 렌더링됨
2. transform-origin (center) 기준으로 scale 적용
3. scale된 이미지의 center 기준으로 translate 적용
4. **translate 값은 원본 이미지 크기에 대한 오프셋**

따라서:
- 웹: `imgCenterX = slot.width/2 + transformX` (translate 값이 원본 크기 기준)
- Export: `imgCenterX = slot.width/2 + transformX * transformScale` (잘못된 계산)

**정답**: Export도 웹과 동일하게 `transformX`만 사용해야 합니다!


