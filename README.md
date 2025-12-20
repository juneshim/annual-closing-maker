# 2025 Year-End Recap

Upload your photos and we'll turn a year into a single image ₍ᐢ..ᐢ₎⊹

## Project Overview

A web application designed for users who want to reflect on their year as it comes to an end. Upload photos from 12 months of memories, and we'll create a beautiful year-end recap image for you.

## User Experience (UX) Goals

This project was designed not as a simple image generation tool, but as an **experience that captures the emotions of this special year-end moment**.

### 1. Emotional Year-End Experience

- **Warm-toned microcopy**: Messages that acknowledge and encourage users' efforts, such as "Upload your photos and we'll turn a year into a single image ₍ᐢ..ᐢ₎⊹" and "You've worked so hard this year ✨"
- **Year-end sentiment**: An interface that creates meaningful moments of reflection, not just a list of features
- **Visual feedback**: A rainbow cat Lottie animation during loading to make waiting time enjoyable

### 2. UX Microcopy Improvements

All text was written with consideration for users' emotions and context:

- **Error messages**: Friendly and easy-to-understand expressions like "This file is too large" and "This format isn't supported" that don't blame users for mistakes
- **Guidance text**: Natural prompts for next actions, such as "Drag to adjust position" and "Click a photo to change its size and position"
- **Status messages**: Clear and warm progress updates like "Creating your year-end recap image..."

### 3. Error and Empty State Handling

Designed so users never feel lost, even when they make mistakes or encounter unexpected situations:

- **Empty state guidance**: 
  - Clear indicators like "No photos yet" in empty slots during editing
  - A modal explaining "Some months are empty" with options provided when months are missing
- **Error recovery**: 
  - Friendly messages with specific file names when uploads fail ("{fileName} is too large")
  - Clear guidance for each situation (unsupported formats, size limits, etc.)
- **Freedom of choice**: 
  - Options to "Leave empty" or "Fill with default image" when months are missing
  - Flexibility to complete the year-end recap image as users prefer

### 4. User-Centered Interactions

- **Intuitive drag and drop**: Reorder images in the thumbnail grid, adjust positions in the editor
- **Automatic month assignment**: Automatically assign uploaded photos to months sequentially, minimizing manual work
- **Real-time editing**: Instantly see changes when selecting images, adjusting size, or moving positions
- **Responsive design**: Natural user experience across all devices from mobile to desktop

## Key Features

- Drag and drop image upload
- Automatic and manual month assignment
- Multiple template options
- Real-time image editing (position adjustment, resizing)
- High-quality PNG download (1920x1080)

## Tech Stack

### Core Technologies
- **React 18.3.1**: Component-based UI development
- **TypeScript**: Type safety and improved developer experience
- **Vite 6.3.5**: Fast development server and build tool
- **Tailwind CSS 4.1.12**: Utility-first styling

### Key Libraries
- **html2canvas**: Convert DOM to Canvas for high-quality image generation
- **react-dnd**: Drag and drop interaction implementation
- **react-dropzone**: File upload functionality
- **motion**: Smooth animation effects
- **lottie-react**: Loading animations
- **sonner**: User-friendly toast notifications
- **Radix UI**: Accessibility-focused UI components

### Key Technical Implementations

#### 1. WYSIWYG Image Rendering
- Precise coordinate system calculations to ensure web preview matches final output
- Consistent transformation logic based on template pixel coordinates
- Separation of `transformScale` and position coordinates (`transformX/Y`) for accurate image placement

#### 2. Real-time Image Editing
- Drag-based position adjustment (mouse event-driven)
- Size adjustment via slider and buttons (0.5x ~ 3x)
- Immediate visual feedback for selected images

#### 3. Responsive Design
- Mobile-first approach
- Responsive rendering through container scaling
- Touch-friendly minimum touch target (44px) compliance

#### 4. State Management
- Local state management using React Hooks
- Efficient synchronization of image upload, template selection, and editing states
- Clear separation of error and loading states
