import { useAppStore } from '../../store/useAppStore';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="glass-panel text-white p-4 rounded-brand border-brand flex items-start gap-3 shadow-2xl relative overflow-hidden"
          style={{
            borderColor:
              toast.type === 'error'
                ? '#ef4444'
                : toast.type === 'success'
                ? 'var(--app-primary)'
                : 'rgba(255,255,255,0.2)',
          }}
        >
          {/* Ambient left feedback border line */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{
              backgroundColor:
                toast.type === 'error'
                  ? '#ef4444'
                  : toast.type === 'success'
                  ? 'var(--app-primary)'
                  : '#3b82f6',
            }}
          />

          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-brand-primary" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          </div>

          <div className="flex-grow text-sm font-medium pr-6 text-slate-200">
            {toast.message}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
export default ToastContainer;
