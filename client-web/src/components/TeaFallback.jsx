import { motion } from 'framer-motion';

/**
 * TeaFallback - 2D animated fallback when WebGL is unavailable
 * 
 * Uses CSS animations and Framer Motion for lightweight animation
 * without requiring WebGL/GPU acceleration
 */
const TeaFallback = () => {
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      {/* Background gradient with animated shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>

      {/* Animated tea cup SVG */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-xl"
        >
          {/* Steam */}
          <motion.g
            animate={{
              opacity: [0.3, 0.7, 0.3],
              y: [0, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <path
              d="M70 40 Q75 20, 80 40"
              stroke="#94a3b8"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d="M90 35 Q95 15, 100 35"
              stroke="#94a3b8"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M110 40 Q115 20, 120 40"
              stroke="#94a3b8"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.5"
            />
          </motion.g>

          {/* Cup body */}
          <motion.path
            d="M60 70 L60 130 Q60 150, 80 150 L120 150 Q140 150, 140 130 L140 70 Z"
            fill="url(#cupGradient)"
            stroke="#78716c"
            strokeWidth="2"
            initial={{ scale: 0.9 }}
            animate={{ 
              scale: [0.98, 1.02, 0.98],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />

          {/* Tea liquid */}
          <motion.ellipse
            cx="100"
            cy="75"
            rx="35"
            ry="8"
            fill="#d97706"
            opacity="0.8"
            animate={{
              ry: [8, 9, 8],
              opacity: [0.7, 0.9, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />

          {/* Handle */}
          <path
            d="M140 80 Q165 80, 165 105 Q165 130, 140 130"
            fill="none"
            stroke="#78716c"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Cup rim highlight */}
          <ellipse
            cx="100"
            cy="70"
            rx="40"
            ry="10"
            fill="none"
            stroke="#a8a29e"
            strokeWidth="2"
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="cupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f5f5f4" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#e7e5e4" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#d6d3d1" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>

        {/* Text message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-primary-700 font-medium"
        >
          Brewing your experience...
        </motion.p>
      </motion.div>

      {/* Floating tea leaves decoration */}
      <motion.div
        className="absolute top-10 left-10 text-4xl opacity-20"
        animate={{
          rotate: [0, 10, 0],
          y: [0, -10, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        🍃
      </motion.div>
      <motion.div
        className="absolute bottom-20 right-20 text-3xl opacity-20"
        animate={{
          rotate: [0, -10, 0],
          y: [0, 10, 0]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1
        }}
      >
        🍃
      </motion.div>
    </div>
  );
};

export default TeaFallback;
