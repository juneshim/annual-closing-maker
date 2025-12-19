import React from 'react';
import { Download } from 'lucide-react';

interface DownloadSectionProps {
  onDownload: () => void;
}

export function DownloadSection({ onDownload }: DownloadSectionProps) {
  return (
    <section className="sticky bottom-0 left-0 right-0 py-4 sm:py-8 text-center mt-6 sm:mt-8 z-50 sm:static">
      <button
        onClick={onDownload}
        className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-indigo-600 text-white rounded-full text-base sm:text-lg font-bold shadow-lg hover:bg-indigo-700 active:scale-95 min-h-[44px] w-full max-w-xs sm:max-w-none sm:w-auto"
      >
        <Download size={20} className="sm:w-6 sm:h-6" />
        Download PNG
      </button>
      <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500 hidden sm:block">Perfect for sharing on Twitter(X)</p>
    </section>
  );
}
