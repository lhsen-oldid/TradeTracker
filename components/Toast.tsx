import React, { useEffect } from 'react';
import { XMarkIcon } from './Icons';

export type ToastType = 'success' | 'error' | 'info';

interface Props {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<Props> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-emerald-600',
    error: 'bg-brand-red',
    info: 'bg-blue-600'
  };

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${bgColors[type]} animate-in fade-in slide-in-from-top-4 duration-300`}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};