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
        className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-start gap-4">
          <div className="bg-amber-100 p-2 rounded-full text-amber-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Missing Months</h3>
            <p className="mt-2 text-slate-600">
              Some months don't have any artworks assigned. How would you like to proceed?
            </p>
            
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => onConfirm(false)}
                className="w-full py-2.5 px-4 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Leave empty
              </button>
              <button
                onClick={() => onConfirm(true)}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Fill with default image
              </button>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          Close
        </button>
      </motion.div>
    </div>
  );
}
