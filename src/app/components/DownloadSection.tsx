import React from 'react';
import { Download } from 'lucide-react';

interface DownloadSectionProps {
  onDownload: () => void;
}

export function DownloadSection({ onDownload }: DownloadSectionProps) {
  return (
    <section className="py-8 text-center border-t border-slate-200 mt-8">
      <button
        onClick={onDownload}
        className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-bold shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all active:scale-95"
      >
        <Download size={24} />
        Download PNG
      </button>
      <p className="mt-4 text-slate-500">Perfect for sharing on Twitter(X)</p>
    </section>
  );
}
