import React from 'react';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fillDefault: boolean) => void;
}

export function ConfirmModal({ isOpen, onClose, onConfirm }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-xl shadow-2xl p-5 sm:p-6 max-w-md w-full mx-4"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0"
        >
          <span className="text-sm sm:text-base">Close</span>
        </button>
        
        <div className="flex items-start gap-3 sm:gap-4 pr-8 sm:pr-0">
          <div className="flex-shrink-0 bg-amber-100 p-2.5 sm:p-2 rounded-full text-amber-600">
            <AlertCircle size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-2.5">Missing Months</h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Some months don't have any artworks assigned. How would you like to proceed?
            </p>
            
            <div className="mt-5 sm:mt-6 flex flex-col gap-3">
              <button
                onClick={() => onConfirm(false)}
                className="w-full py-3 sm:py-2.5 px-4 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 active:bg-slate-100 transition-colors min-h-[44px] text-sm sm:text-base"
              >
                Leave empty
              </button>
              <button
                onClick={() => onConfirm(true)}
                className="w-full py-3 sm:py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors min-h-[44px] text-sm sm:text-base"
              >
                Fill with default image
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
