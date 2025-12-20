[🇰🇷 한국어](README.md) | 🇺🇸 English

# 2025 Year-End Recap

Upload your photos and we'll turn a year into a single image ₍ᐢ..ᐢ₎⊹

## Project Overview

A web application designed for users who want to reflect on their year as it comes to an end. Upload photos from 12 months of memories, and we'll create a beautiful year-end recap image for you.

## User Experience (UX) Goals

This project was designed not as a simple image generation tool, but as an **experience that captures the emotions of this special year-end moment**.

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
