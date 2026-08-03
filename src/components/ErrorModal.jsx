import React from 'react';
import Modal from './Modal';

const ErrorModal = ({ open, title = 'Error', message, onClose }) => {
  return (
    <Modal open={open} title={title} onClose={onClose} maxWidthClassName="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="rounded-full bg-red-950/50 p-3">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm text-slate-300">{message}</p>
      </div>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 active:scale-[0.97] transition-all duration-150"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
};

export default ErrorModal;
