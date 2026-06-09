import React from 'react';

const Modal = ({ open, title, onClose, children, footer, maxWidthClassName = 'max-w-md' }) => {
  if (!open) return null;

  return (
    <div
      tabIndex={-1}
      aria-hidden="false"
      className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className={`relative p-4 w-full ${maxWidthClassName} max-h-full`}>
        <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg p-4 md:p-6 flex flex-col max-h-[calc(100vh-2rem)]">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 md:pb-5 shrink-0">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm w-9 h-9 ms-auto inline-flex justify-center items-center"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18 17.94 6M18 18 6.06 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>

          <div className="py-4 md:py-6 overflow-y-auto flex-1">{children}</div>

          {footer ? <div className="flex items-center space-x-4 border-t border-gray-200 pt-4 md:pt-6 shrink-0">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
};

export default Modal;
