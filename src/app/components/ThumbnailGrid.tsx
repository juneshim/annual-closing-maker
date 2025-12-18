import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { UploadedImage } from '../types';
import { X, Calendar } from 'lucide-react';

const ItemType = 'IMAGE_THUMBNAIL';

interface ThumbnailProps {
  image: UploadedImage;
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  updateImageMonth: (id: string, month: number | null) => void;
  removeImage: (id: string) => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function Thumbnail({ image, index, moveImage, updateImageMonth, removeImage }: ThumbnailProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`relative group bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      }`}
    >
      <div className="aspect-square relative">
        <img
          src={image.previewUrl}
          alt="thumbnail"
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => removeImage(image.id)}
          className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      </div>
      
      <div className="p-2 bg-slate-50">
        <div className="relative">
          <select
            value={image.month || ''}
            onChange={(e) => updateImageMonth(image.id, e.target.value ? Number(e.target.value) : null)}
            className="w-full pl-7 pr-2 py-1 text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">Unassigned</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {i + 1} - {m}
              </option>
            ))}
          </select>
          <Calendar className="absolute left-2 top-1.5 text-slate-400 pointer-events-none" size={14} />
        </div>
      </div>
      
      {image.month && (
        <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
          {MONTHS[image.month - 1]}
        </div>
      )}
    </div>
  );
}

interface ThumbnailGridProps {
  images: UploadedImage[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
}

export function ThumbnailGrid({ images, setImages }: ThumbnailGridProps) {
  const moveImage = (dragIndex: number, hoverIndex: number) => {
    const dragImage = images[dragIndex];
    const newImages = [...images];
    newImages.splice(dragIndex, 1);
    newImages.splice(hoverIndex, 0, dragImage);
    setImages(newImages);
  };

  const updateImageMonth = (id: string, month: number | null) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, month } : img));
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  if (images.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center justify-between">
        <span>Uploaded Artworks ({images.length})</span>
        <button 
           onClick={() => {
             // Auto assign sequential months
             setImages(prev => prev.map((img, i) => ({ ...img, month: (i % 12) + 1 })));
           }}
           className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Auto-assign Months
        </button>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images.map((image, index) => (
          <Thumbnail
            key={image.id}
            index={index}
            image={image}
            moveImage={moveImage}
            updateImageMonth={updateImageMonth}
            removeImage={removeImage}
          />
        ))}
      </div>
    </div>
  );
}
