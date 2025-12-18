import React from 'react';
import { Template } from '../types';
import { TEMPLATES } from '../data/templates';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onSelect: (id: string) => void;
}

export function TemplateSelector({ selectedTemplateId, onSelect }: TemplateSelectorProps) {
  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Select a Template</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {TEMPLATES.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={clsx(
                "relative flex-shrink-0 w-64 rounded-xl border-2 transition-all overflow-hidden group text-left",
                isSelected ? "border-indigo-600 ring-2 ring-indigo-600 ring-offset-2" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                {/* Thumbnail image */}
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to a placeholder if image fails to load
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23e2e8f0"/%3E%3C/svg%3E';
                  }}
                />
                
                {isSelected && (
                  <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                    <div className="bg-indigo-600 text-white p-2 rounded-full">
                      <Check size={20} />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white">
                <p className="font-medium text-slate-900">{template.name}</p>
                <p className="text-xs text-slate-500">1920 x 1080</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
