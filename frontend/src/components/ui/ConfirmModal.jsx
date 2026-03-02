import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { X } from 'lucide-react';

export default function ConfirmModal({ title, message, confirmLabel = 'Удалить', cancelLabel = 'Отмена', danger = true, onConfirm, onCancel, loading = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="icon-btn" onClick={onCancel}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="confirm-modal-body">
            <div className={`confirm-modal-icon ${danger ? 'danger' : ''}`}>
              <AlertTriangle size={22} />
            </div>
            <p className="confirm-modal-msg">{message}</p>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </button>
            <button
              className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
              disabled={loading}
              autoFocus
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
