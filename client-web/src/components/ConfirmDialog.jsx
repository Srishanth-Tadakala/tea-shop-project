import { motion, AnimatePresence } from 'framer-motion';

/**
 * Confirmation Dialog Component
 * Displays a modal for confirming destructive actions
 */
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDangerous = false }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-warm p-6 max-w-md w-full border-2 border-primary-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className={`text-3xl ${isDangerous ? 'text-red-600' : 'text-amber-600'}`}>
              {isDangerous ? '⚠️' : '❓'}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-wood-900 mb-2">{title}</h3>
              <p className="text-wood-600">{message}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-wood-100 text-wood-700 rounded-xl hover:bg-wood-200 transition-colors font-semibold border border-wood-300"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl font-semibold transition-all shadow-soft hover:shadow-soft-lg ${
                isDangerous
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gradient-to-r from-primary-500 to-chai-dark hover:from-primary-600 hover:to-chai-dark'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmDialog;
