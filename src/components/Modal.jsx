import React from 'react';

const Modal = ({ open, title, onClose, children, footer, maxWidthClassName = 'max-w-md' }) => {
  if (!open) return null;

  return (
    <div
      tabIndex={-1}
      aria-hidden="false"
      className="overflow-y-auto overflow-x-hidden fixed inset-0 z-50 flex justify-center items-center w-full p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      <div className={`relative w-full ${maxWidthClassName} max-h-full`}>
        <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[calc(100vh-2rem)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
            <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg p-1.5 transition-colors duration-150"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
          
          {footer ? (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50 rounded-b-2xl shrink-0">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Modal;
