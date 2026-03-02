import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={16} />,
  error:   <AlertCircle size={16} />,
  info:    <Info size={16} />,
};

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{ICONS[t.type]}</span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Закрыть">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
