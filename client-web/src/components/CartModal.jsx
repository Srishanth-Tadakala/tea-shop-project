import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../context/useCartStore';
import { useToastStore } from '../context/useToastStore';

const CartModal = () => {
  const { items, isOpen, toggleCart, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  const handleCheckout = () => {
    if (items.length === 0) return;
    addToast('Checkout functionality coming soon! Total: $' + getTotal().toFixed(2), 'info');
    // Future: navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleCart}
          className="absolute inset-0 bg-black/50"
        />

        {/* Cart Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-chai-dark text-white p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Cart</h2>
              <button
                onClick={toggleCart}
                className="text-white hover:text-gray-200 text-3xl"
              >
                ×
              </button>
            </div>
            <p className="text-primary-100 text-sm mt-1">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-xl text-gray-500 mb-2">Your cart is empty</p>
                <p className="text-gray-400">Add some delicious tea to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="bg-gray-50 rounded-lg p-4 relative"
                  >
                    <button
                      onClick={() => removeItem(item._id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                    
                    <h3 className="font-bold text-lg mb-2 pr-8">{item.name}</h3>
                    <p className="text-primary-600 font-semibold mb-3">
                      ${item.price.toFixed(2)}
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="w-8 h-8 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-bold"
                      >
                        −
                      </button>
                      <span className="font-semibold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="w-8 h-8 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-bold"
                      >
                        +
                      </button>
                      <span className="ml-auto text-lg font-bold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-primary-600">${getTotal().toFixed(2)}</span>
              </div>
              
              <button 
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-primary-600 to-chai-dark text-white py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
              >
                Checkout
              </button>
              
              <button
                onClick={clearCart}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CartModal;
