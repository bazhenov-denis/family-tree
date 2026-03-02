import { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/ui/ToastContainer.jsx';

const ToastContext = createContext(null);

let _nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback(id => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);

  const show = useCallback((type, message) => {
    const id = _nextId++;
    setToasts(ts => [...ts, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const toast = {
    success: msg => show('success', msg),
    error:   msg => show('error',   msg),
    info:    msg => show('info',    msg),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
