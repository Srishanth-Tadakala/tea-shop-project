import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import SteamParticles from './SteamParticles';

/**
 * TeaCup Component - 3D interactive tea cup with realistic effects
 * 
 * Animation Logic:
 * 1. Idle State: Gentle breathing animation (scale + rotation)
 * 2. Hover State: Zoom in, increase steam intensity
 * 3. Click State: Ripple effect on liquid surface + steam burst
 */
const TeaCup = ({ position = [0, 0, 0], scale = 1, statusOpen = true }) => {
  const cupRef = useRef();
  const liquidRef = useRef();
  const steamRef = useRef();
  const pointLightRef = useRef();
  const statusTarget = useRef(statusOpen ? 1 : 0);
  const statusBlend = useRef(statusOpen ? 1 : 0);
  const lightColor = useRef(new THREE.Color('#ffb36b'));
  const openColor = useMemo(() => new THREE.Color('#ffb36b'), []);
  const closedColor = useMemo(() => new THREE.Color('#7a5a4a'), []);
  
  // State management
  const [isHovered, setIsHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  // Animation time trackers
  const idleTime = useRef(0);
  const rippleTime = useRef(0);
  const hoverProgress = useRef(0);

  /**
   * Liquid Surface Geometry
   * Creates a circular disc with subdivisions for wave animation
   */
  const liquidGeometry = useMemo(() => {
    const geometry = new THREE.CircleGeometry(0.8, 64);
    // Rotate to face upward
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);

  useEffect(() => {
    statusTarget.current = statusOpen ? 1 : 0;
  }, [statusOpen]);

  /**
   * Main animation loop - runs every frame (60fps)
   */
  useFrame((state, delta) => {
    if (!cupRef.current || !liquidRef.current) return;

    // === STATUS BLEND ===
    statusBlend.current = THREE.MathUtils.lerp(statusBlend.current, statusTarget.current, delta * 2);
    const blend = statusBlend.current;

    // === IDLE BREATHING ANIMATION ===
    // Gentle scale and rotation oscillation when not interacted with
    idleTime.current += delta * 0.5; // Slow time progression
    const breatheScale = Math.sin(idleTime.current) * 0.02; // ±2% scale variation
    const breatheRotation = Math.sin(idleTime.current * 0.7) * 0.05; // Slight rotation

    // === HOVER ANIMATION ===
    // Smooth transition to hovered state using lerp (linear interpolation)
    const targetHover = isHovered ? 1 : 0;
    hoverProgress.current = THREE.MathUtils.lerp(
      hoverProgress.current,
      targetHover,
      delta * 5 // Transition speed
    );

    // Apply hover scale boost (up to 10% larger)
    const hoverScale = 1 + hoverProgress.current * 0.1;

    // === COMBINE IDLE + HOVER ANIMATIONS ===
    cupRef.current.scale.setScalar(scale * (1 + breatheScale) * hoverScale);
    cupRef.current.rotation.y = breatheRotation + hoverProgress.current * 0.2;

    // === LIQUID WAVE ANIMATION ===
    // Animate liquid surface with sine waves
    const positions = liquidRef.current.geometry.attributes.position;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Calculate distance from center for radial waves
      const distance = Math.sqrt(x * x + z * z);
      
      // Create wave pattern: base wave + ripple effect
      let wave = Math.sin(distance * 5 - time * 2) * 0.02; // Base gentle wave
      
      // === CLICK RIPPLE EFFECT ===
      if (clicked && rippleTime.current < 1) {
        rippleTime.current += delta * 2; // Ripple animation speed
        
        // Expanding ripple ring that fades out
        const rippleRadius = rippleTime.current * 2; // Expands outward
        const rippleStrength = Math.exp(-rippleTime.current * 3); // Exponential decay
        const rippleDistance = Math.abs(distance - rippleRadius);
        
        // Add ripple to wave if point is near the ripple ring
        if (rippleDistance < 0.3) {
          wave += (1 - rippleDistance / 0.3) * rippleStrength * 0.15;
        }
      }
      
      // Apply wave height to Y position
      positions.setY(i, wave);
    }
    
    // Mark geometry as needing update
    positions.needsUpdate = true;

    // Reset ripple after animation completes
    if (rippleTime.current >= 1) {
      setClicked(false);
      rippleTime.current = 0;
    }

    // === MATERIAL & LIGHT BASED ON STATUS ===
    if (liquidRef.current?.material) {
      const emissiveBase = 0.15 + blend * 0.35;
      liquidRef.current.material.emissiveIntensity = emissiveBase + (isHovered ? 0.05 : 0);
      liquidRef.current.material.color.set('#8B4513');
      liquidRef.current.material.emissive.set('#4A2511');
    }

    if (pointLightRef.current) {
      lightColor.current.copy(closedColor).lerp(openColor, blend);
      pointLightRef.current.color.copy(lightColor.current);
      pointLightRef.current.intensity = 0.25 + blend * 0.65;
      pointLightRef.current.distance = 3 + blend * 1.5;
    }

    if (steamRef.current?.setTargetIntensity) {
      const baseSteam = 0.8 + blend * 0.6;
      const steamTarget = baseSteam * (isHovered ? 1.2 : 1);
      steamRef.current.setTargetIntensity(steamTarget);
    }
  });

  /**
   * Click handler - triggers ripple effect and steam burst
   */
  const handleClick = () => {
    setClicked(true);
    rippleTime.current = 0; // Reset ripple animation
    
    // Trigger steam burst via ref
    if (steamRef.current) {
      steamRef.current.burst();
    }
  };

  return (
    <group 
      ref={cupRef} 
      position={position}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* === TEA CUP (GLASS) === */}
      {/* Outer cylinder for cup body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 0.85, 2, 32, 1, true]} />
        <MeshTransmissionMaterial
          transmission={0.95} // High transmission for glass effect
          thickness={0.2} // Glass thickness
          roughness={0.05} // Very smooth surface
          clearcoat={1} // Glossy coating
          clearcoatRoughness={0.1}
          ior={1.5} // Index of refraction (glass)
          chromaticAberration={0.02} // Slight color separation
          color="#ffffff"
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Cup bottom (solid) */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.85, 32]} />
        <MeshTransmissionMaterial
          transmission={0.9}
          thickness={0.5}
          roughness={0.1}
          color="#ffffff"
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Cup handle */}
      <mesh position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.4, 0.08, 16, 32, Math.PI * 1.5]} />
        <MeshTransmissionMaterial
          transmission={0.9}
          thickness={0.3}
          roughness={0.1}
          color="#ffffff"
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* === TEA LIQUID === */}
      {/* Animated liquid surface with wave deformation */}
      <mesh 
        ref={liquidRef}
        position={[0, 0.3, 0]}
        geometry={liquidGeometry}
        receiveShadow
      >
        <meshStandardMaterial
          color="#8B4513" // Brown tea color
          emissive="#4A2511" // Warm glow
          emissiveIntensity={0.2}
          metalness={0.1}
          roughness={0.3}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === STEAM PARTICLES === */}
      {/* Rising steam effect with hover/click interactions */}
      <SteamParticles 
        ref={steamRef}
        position={[0, 1, 0]}
        intensity={statusOpen ? 1.2 : 0.6}
      />

      {/* === AMBIENT GLOW === */}
      {/* Subtle point light inside cup for warmth */}
      <pointLight
        ref={pointLightRef}
        position={[0, 0, 0]}
        intensity={0.5}
        distance={3}
        color="#ff9966"
        castShadow
      />
    </group>
  );
};

export default TeaCup;
