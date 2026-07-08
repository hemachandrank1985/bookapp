import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Modal Dialog component.
 * @param {boolean} isOpen Control visibility
 * @param {function} onClose Triggered on close request
 * @param {string} title Dialog header text
 * @param {React.ReactNode} children Content of the modal
 */
export default function Dialog({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Handle Native Cancel/Esc Event
    const handleCancel = (e) => {
      e.preventDefault();
      onClose();
    };

    // Fallback click handler for light-dismiss (clicking outside the dialog content box)
    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );

      if (!isDialogContent) {
        onClose();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    
    // Feature detect 'closedBy' support. If not supported, use coordinate-based light-dismiss.
    const hasClosedBySupport = 'closedBy' in HTMLDialogElement.prototype;
    if (!hasClosedBySupport) {
      dialog.addEventListener('click', handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      if (!hasClosedBySupport) {
        dialog.removeEventListener('click', handleBackdropClick);
      }
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="custom-dialog"
      closedby="any"
      aria-labelledby="dialog-title"
    >
      <div className="dialog-header">
        <h3 id="dialog-title">{title}</h3>
        <button className="dialog-close-btn" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>
      </div>
      <div className="dialog-body">
        {children}
      </div>
    </dialog>
  );
}
