import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { UploadedImage } from '../types';
import { nanoid } from 'nanoid';
import { ThumbnailGrid } from './ThumbnailGrid';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { autoAssignMonths } from '../utils/imageUtils';

interface UploadSectionProps {
  images: UploadedImage[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
}

export function UploadSection({ images, setImages }: UploadSectionProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const promises = acceptedFiles.map(file => {
      return new Promise<UploadedImage>((resolve) => {
        const previewUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          resolve({
            id: nanoid(),
            file,
            previewUrl,
            month: null,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.src = previewUrl;
      });
    });

    const newImages = await Promise.all(promises);
    setImages(prev => autoAssignMonths([...prev, ...newImages]));
  }, [setImages]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/png': [],
      'image/jpeg': [],
      'image/jpg': [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Handle errors
  React.useEffect(() => {
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach(err => {
          if (err.code === 'file-too-large') {
             toast.error(`File ${file.name} is too large. Max 10MB.`);
          } else if (err.code === 'file-invalid-type') {
             toast.error(`File ${file.name} has invalid type. PNG or JPG only.`);
          } else {
             toast.error(`Error uploading ${file.name}: ${err.message}`);
          }
        });
      });
    }
  }, [fileRejections]);

  return (
    <section className="py-8 space-y-8">
      <div
        {...getRootProps()}
        className={clsx(
          "border-2 border-dashed rounded-2xl p-4 sm:p-8 lg:p-12 text-center transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px] sm:min-h-[250px] lg:min-h-[300px]",
          isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-slate-400 bg-slate-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="bg-white p-3 sm:p-4 rounded-full shadow-sm mb-3 sm:mb-4">
          <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
        </div>
        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">
          {isDragActive ? "Drop the artworks here" : "Drag & drop your images here"}
        </h3>
        <p className="text-xs sm:text-sm lg:text-base text-slate-500 mb-4 sm:mb-6">
          Upload from library • PNG or JPG • Max 10MB per image
        </p>
        <button className="px-6 py-3 sm:px-8 sm:py-3.5 lg:px-6 lg:py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors min-h-[44px] text-sm sm:text-base">
          Select Files
        </button>
      </div>

      <ThumbnailGrid images={images} setImages={setImages} />
    </section>
  );
}
