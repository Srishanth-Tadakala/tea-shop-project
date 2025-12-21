import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import TeaCup from './TeaCup';

/**
 * TeaScene - 3D canvas wrapper for tea cup visualization
 * 
 * Optimizations:
 * - Responsive canvas sizing (100% of container)
 * - Performance mode for lower-end devices
 * - HDRI environment lighting for realism
 * - Camera positioned for optimal viewing angle
 * - OrbitControls for optional user interaction
 */
const TeaScene = ({ 
  enableControls = false,
  performanceMode = false,
  className = ''
}) => {
  const [dpr, setDpr] = useState(1);

  /**
   * Detect device capabilities for performance optimization
   * Lower pixel ratio on mobile devices to improve performance
   */
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency <= 4;
    
    if (performanceMode || isMobile || isLowEnd) {
      setDpr(Math.min(window.devicePixelRatio, 1.5)); // Cap at 1.5x
    } else {
      setDpr(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for retina
    }
  }, [performanceMode]);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        dpr={dpr}
        gl={{
          antialias: !performanceMode,
          alpha: true,
          powerPreference: performanceMode ? 'low-power' : 'high-performance',
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent' 
        }}
      >
        {/* Camera Setup - positioned for optimal tea cup viewing */}
        <PerspectiveCamera
          makeDefault
          position={[0, 1, 4]}
          fov={50}
        />

        {/* Lighting Setup */}
        {/* Ambient light for overall illumination */}
        <ambientLight intensity={0.3} />
        
        {/* Directional light for highlights */}
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow={!performanceMode}
        />
        
        {/* HDRI Environment for realistic reflections on glass */}
        <Environment
          preset="sunset"
          background={false}
          blur={0.8}
        />

        {/* 3D Tea Cup Component */}
        <Suspense fallback={null}>
          <TeaCup position={[0, 0, 0]} />
        </Suspense>

        {/* Optional orbit controls for user interaction */}
        {enableControls && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            autoRotate={false}
            autoRotateSpeed={0.5}
          />
        )}
      </Canvas>
    </div>
  );
};

export default TeaScene;
