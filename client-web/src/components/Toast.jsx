import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../context/useToastStore';

/**
 * Toast Notification Component
 * Displays success, error, warning, and info messages
 */
const Toast = () => {
  const { toasts, removeToast } = useToastStore();

  const getToastStyles = (type) => {
    const styles = {
      success: 'bg-green-600 border-green-700',
      error: 'bg-red-600 border-red-700',
      warning: 'bg-amber-600 border-amber-700',
      info: 'bg-blue-600 border-blue-700',
    };
    return styles[type] || styles.info;
  };

  const getIcon = (type) => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type] || icons.info;
  };

  return (
    <div className="fixed z-[100] flex flex-col gap-2 max-w-md w-[calc(100vw-2rem)] left-4 right-4 top-4 sm:w-auto sm:left-auto sm:right-4 sm:top-16">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`${getToastStyles(toast.type)} text-white px-4 py-3 rounded-xl shadow-soft-lg border-2 flex items-center gap-3 min-w-[300px]`}
          >
            <div className="text-2xl font-bold">{getIcon(toast.type)}</div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
