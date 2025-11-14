'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Info, X } from 'lucide-react';

export function InfoModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      {/* Info Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-white/80 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 transition-all"
        aria-label="App Information"
      >
        <Info className="w-6 h-6 text-gray-700" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-50 animate-modal-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div
              className="bg-blue-50 rounded-2xl shadow-2xl w-[90%] max-w-4xl px-8 py-12 pointer-events-auto animate-modal-slide-from-bottom-right relative"
              style={{
                transformOrigin: 'bottom right',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              {/* Content */}
              <div className="flex gap-8 items-center">
                {/* Flower Image */}
                <div className="flex-shrink-0 overflow-hidden">
                  <Image
                    src="/special_flower.png"
                    alt="Special Flower"
                    width={400}
                    height={400}
                    className="w-[300px] h-[300px] object-contain scale-110"
                    style={{ outline: 'none', border: 'none' }}
                    unoptimized
                  />
                </div>

                {/* Description */}
                <div className="flex-1 space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">DigiGarden</h2>

                  <p className="text-gray-700 leading-relaxed">
                    Welcome to DigiGarden, a digital sanctuary of peace and positivity! Our goal is to spread happiness and kindness throughout the world.
                  </p>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">How to Use:</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Click anywhere on the garden to plant a flower</li>
                      <li>Choose a flower type and write a positive message</li>
                      <li>Click on any flower to read its message</li>
                      <li>Share flowers with friends via the share buttons</li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Built for the Web Dev Challenge by{' '}
                      <a
                        href="https://www.youtube.com/@codetv-dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        Code TV
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
