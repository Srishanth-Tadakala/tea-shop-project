import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import useCartStore from '../context/useCartStore';
import CartModal from './CartModal';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getItemCount, toggleCart } = useCartStore();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/menu', label: 'Menu' },
    { path: '/ingredients', label: 'Ingredients' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
    { path: '/location', label: 'Location' },
    { path: '/status', label: 'Status' },
  ];

  return (
    <>
      <CartModal />
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-gradient-to-r from-wood-700 via-wood-600 to-wood-700 shadow-soft-lg sticky top-0 z-50 border-b-2 border-primary-400"
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="text-2xl font-bold text-amber-100 flex items-center gap-2"
            >
              <span className="text-3xl drop-shadow-lg">🍵</span>
              <span className="drop-shadow-md">Tea Shop</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-amber-100 hover:text-primary-300 transition-colors duration-300 font-medium relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-400 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
            <motion.button
              onClick={toggleCart}
              whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(217, 119, 6, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-primary-500 to-chai-dark text-white px-4 py-2 rounded-xl hover:from-primary-600 hover:to-chai-dark transition-all duration-300 shadow-soft font-semibold"
            >
              Cart ({getItemCount()})
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-amber-100 hover:text-primary-300 focus:outline-none transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:hidden py-4 border-t border-primary-400/30"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-amber-100 hover:text-primary-300 transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
            <button 
              onClick={toggleCart}
              className="w-full mt-4 bg-gradient-to-r from-primary-500 to-chai-dark text-white px-4 py-2 rounded-xl hover:from-primary-600 hover:to-chai-dark transition-all duration-300 shadow-soft font-semibold"
            >
              Cart ({getItemCount()})
            </button>
          </motion.div>
        )}
      </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
