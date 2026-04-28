'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function CircuitLine({ points, color, speed }: { points: THREE.Vector3[]; color: string; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points])
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 20, 0.008, 6, false), [curve])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
      }),
    [color]
  )

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * speed) * 0.3
    }
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}

export function CircuitLines() {
  const lines = useMemo(
    () => [
      {
        points: [
          new THREE.Vector3(0, 0.05, 0.6),
          new THREE.Vector3(0, 0.05, 1.2),
          new THREE.Vector3(0.4, 0.05, 1.4),
        ],
        color: '#00d4ff',
        speed: 1.5,
      },
      {
        points: [
          new THREE.Vector3(0.6, 0.05, 0),
          new THREE.Vector3(1.2, 0.05, 0),
          new THREE.Vector3(1.4, 0.05, -0.4),
        ],
        color: '#00d4ff',
        speed: 2,
      },
      {
        points: [
          new THREE.Vector3(0, 0.05, -0.6),
          new THREE.Vector3(0, 0.05, -1.2),
          new THREE.Vector3(-0.5, 0.05, -1.4),
        ],
        color: '#7c3aed',
        speed: 1.2,
      },
      {
        points: [
          new THREE.Vector3(-0.6, 0.05, 0),
          new THREE.Vector3(-1.2, 0.05, 0.2),
          new THREE.Vector3(-1.4, 0.05, 0.6),
        ],
        color: '#7c3aed',
        speed: 1.8,
      },
      {
        points: [
          new THREE.Vector3(0.4, 0.05, 0.4),
          new THREE.Vector3(0.9, 0.05, 0.9),
          new THREE.Vector3(1.3, 0.05, 1.0),
        ],
        color: '#00d4ff',
        speed: 2.5,
      },
      {
        points: [
          new THREE.Vector3(-0.4, 0.05, -0.4),
          new THREE.Vector3(-1.0, 0.05, -0.9),
          new THREE.Vector3(-1.3, 0.05, -1.0),
        ],
        color: '#7c3aed',
        speed: 1.0,
      },
    ],
    []
  )

  return (
    <group>
      {lines.map((l, i) => (
        <CircuitLine key={i} {...l} />
      ))}
    </group>
  )
}
