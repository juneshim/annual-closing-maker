import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Lottie from 'lottie-react';

export function LoadingOverlay() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/assets/lottie-rainbow-cat.json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Failed to load Lottie animation:', error));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24">
          {animationData ? (
            <Lottie 
              animationData={animationData} 
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="w-24 h-24 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <p className="text-xl font-medium text-slate-700">Generating your recap...</p>
      </div>
    </motion.div>
  );
}
