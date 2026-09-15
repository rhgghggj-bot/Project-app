"use client"
import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

function starShape() {
  const shape = new THREE.Shape()
  const pts: [number, number][] = [
    [0, 2.78], [0.56, 0.56], [2.78, 0], [0.56, -0.56],
    [0, -2.78], [-0.56, -0.56], [-2.78, 0], [-0.56, 0.56],
  ]
  shape.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1])
  shape.closePath()
  return shape
}

function Star({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const shape = useMemo(() => starShape(), [])
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(shape, {
    depth: 0.6, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 4, curveSegments: 8
  }), [shape])

  useFrame((state) => {
    if (!meshRef.current) return
    const p = progressRef.current
    const t = state.clock.elapsedTime
    // Continuous spin stays in the camera-facing plane (z) so the star
    // never turns edge-on to the camera; y/x only tilt within a bounded
    // range for a subtle 3D wobble plus a scroll-driven reveal turn.
    meshRef.current.rotation.z = t * 0.5
    meshRef.current.rotation.y = Math.sin(t * 0.25) * 0.4 + p * 0.35
    meshRef.current.rotation.x = Math.cos(t * 0.2) * 0.18 + p * 0.3
    const pulse = 1 + Math.max(0, (p - 0.68) / 0.24) * 0.3 * (p < 0.94 ? 1 : Math.max(0, 1 - (p - 0.94) / 0.06))
    meshRef.current.scale.setScalar(pulse)
    state.camera.position.z = 9 - p * 1.4
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhysicalMaterial
        color="#D4A843"
        metalness={0.7}
        roughness={0.18}
        iridescence={1}
        iridescenceIOR={1.3}
        iridescenceThicknessRange={[100, 400]}
        clearcoat={0.5}
        clearcoatRoughness={0.2}
      />
    </mesh>
  )
}

export default function StarScene3D({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 38 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} color="#ffffff" />
      <pointLight position={[-4, -1, 3]} intensity={26} color="#2B7FFF" />
      <pointLight position={[3, -3, -2]} intensity={20} color="#D4A843" />
      <pointLight position={[0, 3, -4]} intensity={14} color="#87CEEB" />
      <Star progressRef={progressRef} />
    </Canvas>
  )
}
