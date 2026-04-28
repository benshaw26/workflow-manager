'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { MicrochipModel } from './MicrochipModel'
import { CircuitLines } from './CircuitLines'
import { DataParticles } from './DataParticles'
import { CameraRig } from './CameraRig'

function Lights() {
  return (
    <>
      <ambientLight intensity={0.6} color="#1a2a3a" />
      {/* Key cyan light — top front */}
      <pointLight position={[3, 5, 4]} intensity={6} color="#00e5ff" />
      {/* Fill — indigo left */}
      <pointLight position={[-4, 2, -2]} intensity={4} color="#818cf8" />
      {/* Rim — amber bottom right */}
      <pointLight position={[2, -3, 3]} intensity={3} color="#ffaa00" />
      {/* Top-down white spot for spreader reflection */}
      <spotLight
        position={[0, 7, 1]}
        angle={0.30}
        penumbra={0.5}
        intensity={5}
        color="#ffffff"
        castShadow
      />
      {/* Subtle green bounce from PCB */}
      <pointLight position={[0, -1, 0]} intensity={1.5} color="#00ff44" />
    </>
  )
}

export default function MicrochipScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 1.5, 11], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Lights />
          <MicrochipModel />
          <CircuitLines />
          <DataParticles count={60} />
          <CameraRig />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI * 0.65}
            minPolarAngle={Math.PI * 0.2}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
