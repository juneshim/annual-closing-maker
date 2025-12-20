import React from 'react';
import { strings } from '../utils/strings';

export function Footer() {
  return (
    <footer className="pt-8 sm:pt-12 lg:pt-16 pb-6 sm:pb-8 lg:pb-10 mt-12 sm:mt-16 lg:mt-20 border-t border-slate-200">
      <div className="text-center space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-6">
          <a
            href="https://spin-spin.com/developer_js"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm sm:text-base text-slate-700 hover:text-slate-900 font-medium transition-colors min-h-[44px] sm:min-h-0 flex items-center"
          >
            {strings.footer.contact}
          </a>
          
          <span className="hidden sm:inline text-slate-300">|</span>
          
          <a
            href="https://spin-spin.com/developer_js"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm sm:text-base text-slate-700 hover:text-slate-900 font-medium transition-colors min-h-[44px] sm:min-h-0 flex items-center"
          >
            {strings.footer.suggest}
          </a>
          
          <span className="hidden sm:inline text-slate-300">|</span>
          
          <a
            href="https://x.com/Hello_ganadi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm sm:text-base text-slate-700 hover:text-slate-900 font-medium transition-colors min-h-[44px] sm:min-h-0 flex items-center"
          >
            {strings.footer.twitter}
          </a>
        </div>
      </div>
    </footer>
  );
}

