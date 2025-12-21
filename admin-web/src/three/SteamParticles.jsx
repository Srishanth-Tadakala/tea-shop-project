import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * SteamParticles Component - Animated steam rising from tea
 * 
 * Particle System Logic:
 * 1. Each particle starts at the liquid surface (y=0)
 * 2. Rises upward with sinusoidal drift (realistic steam movement)
 * 3. Fades out as it rises (alpha decreases with height)
 * 4. Resets to bottom when reaching top (continuous loop)
 * 5. Burst effect on click: temporary particle count/speed increase
 */
const SteamParticles = forwardRef(({ position = [0, 0, 0], intensity = 1 }, ref) => {
  const particlesRef = useRef();
  const burstTime = useRef(0);
  const isBursting = useRef(false);

  // Particle configuration
  const PARTICLE_COUNT = 100;
  const MAX_HEIGHT = 3; // How high steam rises
  const BASE_SPEED = 0.3; // Base upward velocity

  /**
   * Initialize particle positions and velocities
   * Creates random starting positions in a circular area
   */
  const { positions, velocities, offsets } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT);
    const offsets = new Float32Array(PARTICLE_COUNT * 2); // For drift animation

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const i2 = i * 2;

      // Random circular distribution on liquid surface
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.6; // Within cup radius

      positions[i3] = Math.cos(angle) * radius; // X
      positions[i3 + 1] = Math.random() * MAX_HEIGHT; // Y (staggered start)
      positions[i3 + 2] = Math.sin(angle) * radius; // Z

      // Random upward velocity for variation
      velocities[i] = BASE_SPEED + Math.random() * 0.2;

      // Random phase offsets for sinusoidal drift
      offsets[i2] = Math.random() * Math.PI * 2; // X drift phase
      offsets[i2 + 1] = Math.random() * Math.PI * 2; // Z drift phase
    }

    return { positions, velocities, offsets };
  }, []);

  /**
   * Expose burst method to parent via ref
   * Allows TeaCup to trigger steam burst on click
   */
  useImperativeHandle(ref, () => ({
    burst: () => {
      isBursting.current = true;
      burstTime.current = 0;
    }
  }));

  /**
   * Animation loop - updates particle positions every frame
   */
  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array;
    const time = state.clock.getElapsedTime();

    // Calculate burst multiplier (exponential decay)
    const burstMultiplier = isBursting.current
      ? 1 + Math.exp(-burstTime.current * 3) * 2 // Up to 3x speed/intensity
      : 1;

    if (isBursting.current) {
      burstTime.current += delta;
      // End burst after 1 second
      if (burstTime.current > 1) {
        isBursting.current = false;
      }
    }

    // Update each particle
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const i2 = i * 2;

      // === UPWARD MOVEMENT ===
      // Apply velocity with intensity and burst modifiers
      positions[i3 + 1] += velocities[i] * delta * intensity * burstMultiplier;

      // === HORIZONTAL DRIFT ===
      // Sinusoidal movement for realistic steam swirl
      const driftSpeed = 0.5;
      const driftAmount = 0.15 * intensity;

      positions[i3] += 
        Math.sin(time * driftSpeed + offsets[i2]) * driftAmount * delta;
      positions[i3 + 2] += 
        Math.cos(time * driftSpeed + offsets[i2 + 1]) * driftAmount * delta;

      // === PARTICLE RECYCLING ===
      // Reset particle to bottom when it reaches the top
      if (positions[i3 + 1] > MAX_HEIGHT) {
        // Randomize new starting position on liquid surface
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.6;

        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = 0; // Reset to bottom
        positions[i3 + 2] = Math.sin(angle) * radius;

        // Randomize velocity for next cycle
        velocities[i] = BASE_SPEED + Math.random() * 0.2;
      }
    }

    // Mark geometry as needing update
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  /**
   * Custom shader material for particle appearance
   * - Fades out with height
   * - Size decreases with height (perspective)
   * - Soft, cloud-like appearance
   */
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // Glow effect
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        
        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Size decreases with height (y position)
          float size = (1.0 - position.y / 3.0) * 20.0 + 10.0;
          gl_PointSize = size;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        
        void main() {
          // Circular particle shape with soft edges
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) discard; // Circular cutoff
          
          // Soft falloff from center
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= vAlpha * 0.4; // Combine with height fade
          
          // White/light gray steam color
          gl_FragColor = vec4(0.9, 0.9, 0.95, alpha);
        }
      `
    });
  }, []);

  /**
   * Calculate alpha values based on particle height
   * Particles fade out as they rise (more realistic)
   */
  const alphas = useMemo(() => {
    const alphas = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const height = positions[i * 3 + 1];
      alphas[i] = 1.0 - (height / MAX_HEIGHT); // Fade with height
    }
    return alphas;
  }, [positions]);

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-alpha"
          count={PARTICLE_COUNT}
          array={alphas}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive object={particleMaterial} attach="material" />
    </points>
  );
});

SteamParticles.displayName = 'SteamParticles';

export default SteamParticles;
