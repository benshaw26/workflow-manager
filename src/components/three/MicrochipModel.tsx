'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function useMaterials() {
  return useMemo(() => ({
    // PCB — vivid emerald green
    pcb: new THREE.MeshStandardMaterial({
      color: '#0a2e0c',
      emissive: '#061a06',
      emissiveIntensity: 0.3,
      metalness: 0.0,
      roughness: 0.75,
    }),
    // Solder mask — bright glossy green
    pcbMask: new THREE.MeshStandardMaterial({
      color: '#0f3d12',
      emissive: '#0a2a0c',
      emissiveIntensity: 0.4,
      metalness: 0.15,
      roughness: 0.45,
    }),
    // IC body — near-black with slight blue tint
    icBody: new THREE.MeshStandardMaterial({
      color: '#0d0d18', metalness: 0.08, roughness: 0.88,
    }),
    // Heat spreader — bright chrome
    heatSpreader: new THREE.MeshStandardMaterial({
      color: '#d0d8e8', metalness: 1.0, roughness: 0.08,
      envMapIntensity: 1.5,
    }),
    // Pins — mirror-like silver
    pin: new THREE.MeshStandardMaterial({
      color: '#dde4ef', metalness: 1.0, roughness: 0.05,
      envMapIntensity: 1.5,
    }),
    // Traces — bright glowing orange-copper
    trace: new THREE.MeshStandardMaterial({
      color: '#d4853a',
      metalness: 0.8,
      roughness: 0.25,
      emissive: '#a04010',
      emissiveIntensity: 0.55,
    }),
    // Ground fills — warm copper glow
    groundFill: new THREE.MeshStandardMaterial({
      color: '#c07030',
      metalness: 0.7,
      roughness: 0.35,
      emissive: '#7a3a10',
      emissiveIntensity: 0.3,
    }),
    // Ceramic caps — cream with warm tone
    cap: new THREE.MeshStandardMaterial({
      color: '#e8d8b8', metalness: 0.0, roughness: 0.80,
    }),
    // Resistors — dark grey
    resistor: new THREE.MeshStandardMaterial({
      color: '#282828', metalness: 0.06, roughness: 0.85,
    }),
    // Electrolytic body — deep indigo/navy
    electroBody: new THREE.MeshStandardMaterial({
      color: '#1a1060',
      emissive: '#0a0830',
      emissiveIntensity: 0.2,
      metalness: 0.15,
      roughness: 0.72,
    }),
    // Electrolytic top — polished aluminium
    electroTop: new THREE.MeshStandardMaterial({
      color: '#c8d4e4', metalness: 0.98, roughness: 0.12,
    }),
    // Crystal — bright silver
    crystal: new THREE.MeshStandardMaterial({
      color: '#d8e8f8', metalness: 0.98, roughness: 0.08,
    }),
    // Cyan LED — very bright, wide glow
    led: new THREE.MeshStandardMaterial({
      color: '#00ffff',
      emissive: '#00e5ff',
      emissiveIntensity: 3.5,
      metalness: 0.0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95,
    }),
    // Amber LED — bright warm
    ledAmber: new THREE.MeshStandardMaterial({
      color: '#ffcc00',
      emissive: '#ff9900',
      emissiveIntensity: 3.0,
      metalness: 0.0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95,
    }),
    // Silkscreen — bright white
    silk: new THREE.MeshStandardMaterial({
      color: '#f0f4ff',
      emissive: '#aabbcc',
      emissiveIntensity: 0.15,
      metalness: 0.0,
      roughness: 0.9,
    }),
    // Edge connector pads — bright gold
    soldermask: new THREE.MeshStandardMaterial({
      color: '#f0c040',
      metalness: 0.95,
      roughness: 0.10,
      emissive: '#c08000',
      emissiveIntensity: 0.4,
    }),
    // Inductor — warm bronze
    inductor: new THREE.MeshStandardMaterial({
      color: '#c09050',
      metalness: 0.75,
      roughness: 0.40,
      emissive: '#7a5020',
      emissiveIntensity: 0.2,
    }),
  }), [])
}

// ── Sub-components ──────────────────────────────────────────────────────────

function QFPPin({ x, z, rotY, mat }: {
  x: number; z: number; rotY: number; mat: THREE.Material
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Foot — horizontal, soldered to PCB pad */}
      <mesh position={[0.20, 0.01, 0]} material={mat}>
        <boxGeometry args={[0.26, 0.020, 0.048]} />
      </mesh>
      {/* Vertical leg */}
      <mesh position={[0.07, 0.052, 0]} material={mat}>
        <boxGeometry args={[0.020, 0.072, 0.044]} />
      </mesh>
      {/* Shoulder — gull-wing bend into package */}
      <mesh position={[-0.012, 0.087, 0]} material={mat}>
        <boxGeometry args={[0.044, 0.020, 0.042]} />
      </mesh>
    </group>
  )
}

function PinRow({ count, side, mat }: {
  count: number; side: 'left' | 'right' | 'front' | 'back'; mat: THREE.Material
}) {
  const pitch = 0.115
  const offset = ((count - 1) / 2) * pitch
  const edgeDist = 0.97

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const t = i * pitch - offset
        let x = 0, z = 0, rotY = 0
        if (side === 'left')  { x = -edgeDist; z = t; rotY = Math.PI }
        if (side === 'right') { x =  edgeDist; z = t; rotY = 0 }
        if (side === 'front') { x = t; z =  edgeDist; rotY = -Math.PI / 2 }
        if (side === 'back')  { x = t; z = -edgeDist; rotY = Math.PI / 2 }
        return <QFPPin key={i} x={x} z={z} rotY={rotY} mat={mat} />
      })}
    </>
  )
}

function SMD({ x, y, z, rx = 0, ry = 0, rz = 0, w = 0.12, h = 0.06, d = 0.07, mat }: {
  x: number; y: number; z: number; rx?: number; ry?: number; rz?: number
  w?: number; h?: number; d?: number; mat: THREE.Material
}) {
  return (
    <mesh position={[x, y, z]} rotation={[rx, ry, rz]} material={mat}>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  )
}

function Trace({ x1, z1, x2, z2, mat, w = 0.018, y = 0.006 }: {
  x1: number; z1: number; x2: number; z2: number
  mat: THREE.Material; w?: number; y?: number
}) {
  const cx = (x1 + x2) / 2
  const cz = (z1 + z2) / 2
  const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
  const angle = Math.atan2(x2 - x1, z2 - z1)
  return (
    <mesh position={[cx, y, cz]} rotation={[0, angle, 0]} material={mat}>
      <boxGeometry args={[w, 0.008, len]} />
    </mesh>
  )
}

function ElectrolyticCap({ x, z, r = 0.09, h = 0.28, matBody, matTop }: {
  x: number; z: number; r?: number; h?: number
  matBody: THREE.Material; matTop: THREE.Material
}) {
  return (
    <group position={[x, h / 2 + 0.006, z]}>
      <mesh material={matBody}>
        <cylinderGeometry args={[r, r, h, 14]} />
      </mesh>
      {/* Polarity stripe */}
      <mesh position={[-r * 0.6, 0, 0]} material={matTop}>
        <boxGeometry args={[r * 0.35, h + 0.001, r * 0.25]} />
      </mesh>
      {/* Aluminium top disk */}
      <mesh position={[0, h / 2 + 0.007, 0]} material={matTop}>
        <cylinderGeometry args={[r - 0.007, r - 0.007, 0.013, 14]} />
      </mesh>
      {/* Vent cross */}
      <mesh position={[0, h / 2 + 0.014, 0]} material={matTop}>
        <boxGeometry args={[0.005, 0.005, r * 1.5]} />
      </mesh>
      <mesh position={[0, h / 2 + 0.014, 0]} material={matTop}>
        <boxGeometry args={[r * 1.5, 0.005, 0.005]} />
      </mesh>
    </group>
  )
}

function Crystal({ x, z, mat }: { x: number; z: number; mat: THREE.Material }) {
  return (
    <group position={[x, 0.042, z]}>
      {/* HC-49/SMD body */}
      <mesh material={mat}>
        <boxGeometry args={[0.30, 0.068, 0.17]} />
      </mesh>
      {/* Raised dome */}
      <mesh position={[0, 0.040, 0]} material={mat}>
        <cylinderGeometry args={[0.055, 0.085, 0.048, 12]} />
      </mesh>
      {/* End caps */}
      <mesh position={[ 0.16, 0, 0]} material={mat}>
        <boxGeometry args={[0.018, 0.06, 0.15]} />
      </mesh>
      <mesh position={[-0.16, 0, 0]} material={mat}>
        <boxGeometry args={[0.018, 0.06, 0.15]} />
      </mesh>
    </group>
  )
}

function SOT23({ x, z, ry = 0, matBody, matPin }: {
  x: number; z: number; ry?: number
  matBody: THREE.Material; matPin: THREE.Material
}) {
  return (
    <group position={[x, 0.026, z]} rotation={[0, ry, 0]}>
      <mesh material={matBody}>
        <boxGeometry args={[0.10, 0.042, 0.058]} />
      </mesh>
      {/* 3 leads on one side */}
      {[-0.022, 0.0, 0.022].map((zo, i) => (
        <mesh key={i} position={[0.075, -0.012, zo]} material={matPin}>
          <boxGeometry args={[0.065, 0.013, 0.017]} />
        </mesh>
      ))}
      {/* 1 lead opposite */}
      <mesh position={[-0.075, -0.012, 0]} material={matPin}>
        <boxGeometry args={[0.065, 0.013, 0.017]} />
      </mesh>
    </group>
  )
}

// Wire-wound inductor (ferrite bead / power inductor)
function Inductor({ x, z, ry = 0, mat }: {
  x: number; z: number; ry?: number; mat: THREE.Material
}) {
  return (
    <group position={[x, 0.038, z]} rotation={[0, ry, 0]}>
      {/* Ferrite body */}
      <mesh material={mat}>
        <boxGeometry args={[0.18, 0.07, 0.18]} />
      </mesh>
      {/* Wire coil rings (5 turns visible) */}
      {[-0.055, -0.027, 0, 0.027, 0.055].map((xo, i) => (
        <mesh key={i} position={[xo, 0.04, 0]} rotation={[0, 0, Math.PI / 2]} material={mat}>
          <torusGeometry args={[0.06, 0.008, 6, 12]} />
        </mesh>
      ))}
    </group>
  )
}

// ── Main model ──────────────────────────────────────────────────────────────

export function MicrochipModel() {
  const groupRef = useRef<THREE.Group>(null)
  const mat = useMaterials()

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    // Primary Y spin — leisurely
    groupRef.current.rotation.y = t * 0.14
    // X pitch — slow sine wave with good amplitude (tilts forward/back)
    groupRef.current.rotation.x = Math.sin(t * 0.21) * 0.22
    // Z roll — offset phase for gyroscopic precession feel
    groupRef.current.rotation.z = Math.sin(t * 0.09 + 1.4) * 0.09
  })

  return (
    <group ref={groupRef}>

      {/* ── PCB substrate ── */}
      <mesh position={[0, -0.045, 0]} material={mat.pcb}>
        <boxGeometry args={[4.4, 0.092, 4.4]} />
      </mesh>
      {/* Solder mask top */}
      <mesh position={[0, 0.0, 0]} material={mat.pcbMask}>
        <boxGeometry args={[4.4, 0.013, 4.4]} />
      </mesh>

      {/* ── Edge connector pads (card-edge fingers) ── */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[-1.8 + i * 0.44, 0.007, -2.18]} material={mat.soldermask}>
          <boxGeometry args={[0.20, 0.006, 0.14]} />
        </mesh>
      ))}

      {/* ── Corner ground fills ── */}
      {[[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.007, z as number]} material={mat.groundFill}>
          <boxGeometry args={[0.85, 0.006, 0.85]} />
        </mesh>
      ))}

      {/* ── IC package body (64-pin QFP) ── */}
      <mesh position={[0, 0.092, 0]} material={mat.icBody}>
        <boxGeometry args={[1.84, 0.175, 1.84]} />
      </mesh>
      {/* Chamfered corners */}
      {[[-0.87, 0.185, -0.87], [0.87, 0.185, -0.87],
        [-0.87, 0.185,  0.87], [0.87, 0.185,  0.87]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z as number]} rotation={[0, Math.PI / 4, 0]} material={mat.icBody}>
          <boxGeometry args={[0.065, 0.025, 0.065]} />
        </mesh>
      ))}
      {/* Pin-1 indicator — amber dot */}
      <mesh position={[-0.84, 0.182, -0.84]} material={mat.ledAmber}>
        <cylinderGeometry args={[0.038, 0.038, 0.004, 8]} />
      </mesh>

      {/* ── Integrated Heat Spreader (IHS) ── */}
      <mesh position={[0, 0.19, 0]} material={mat.heatSpreader}>
        <boxGeometry args={[1.76, 0.030, 1.76]} />
      </mesh>
      {/* Spreader perimeter rim */}
      <mesh position={[0, 0.205, 0]} material={mat.heatSpreader}>
        <boxGeometry args={[1.82, 0.015, 1.82]} />
      </mesh>
      {/* Die shadow through spreader */}
      <mesh position={[0, 0.201, 0]} material={mat.icBody}>
        <boxGeometry args={[0.94, 0.006, 0.94]} />
      </mesh>
      {/* Spreader cross-hatch mill lines */}
      {[-0.55, -0.27, 0, 0.27, 0.55].map((offset, i) => (
        <mesh key={`hx-${i}`} position={[offset, 0.206, 0]} material={mat.icBody}>
          <boxGeometry args={[0.003, 0.003, 1.68]} />
        </mesh>
      ))}
      {[-0.55, -0.27, 0, 0.27, 0.55].map((offset, i) => (
        <mesh key={`hz-${i}`} position={[0, 0.206, offset]} material={mat.icBody}>
          <boxGeometry args={[1.68, 0.003, 0.003]} />
        </mesh>
      ))}
      {/* Laser-etched product code bars */}
      <mesh position={[0.05, 0.206, -0.22]} material={mat.icBody}>
        <boxGeometry args={[0.58, 0.004, 0.052]} />
      </mesh>
      <mesh position={[0.05, 0.206, -0.10]} material={mat.icBody}>
        <boxGeometry args={[0.46, 0.004, 0.042]} />
      </mesh>
      <mesh position={[0.0,  0.206,  0.04]} material={mat.icBody}>
        <boxGeometry args={[0.52, 0.004, 0.042]} />
      </mesh>
      <mesh position={[-0.04, 0.206, 0.16]} material={mat.icBody}>
        <boxGeometry args={[0.38, 0.004, 0.038]} />
      </mesh>

      {/* ── 64-pin QFP — 16 per side ── */}
      <PinRow count={16} side="left"  mat={mat.pin} />
      <PinRow count={16} side="right" mat={mat.pin} />
      <PinRow count={16} side="front" mat={mat.pin} />
      <PinRow count={16} side="back"  mat={mat.pin} />

      {/* ── Copper traces — fan-out from IC ── */}
      {/* Left side */}
      <Trace x1={-0.97} z1={-0.60} x2={-1.60} z2={-0.60} mat={mat.trace} />
      <Trace x1={-0.97} z1={-0.37} x2={-1.65} z2={-0.37} mat={mat.trace} />
      <Trace x1={-0.97} z1={-0.14} x2={-1.70} z2={-0.14} mat={mat.trace} />
      <Trace x1={-0.97} z1={ 0.14} x2={-1.70} z2={ 0.14} mat={mat.trace} />
      <Trace x1={-0.97} z1={ 0.37} x2={-1.40} z2={ 0.75} mat={mat.trace} />
      <Trace x1={-0.97} z1={ 0.60} x2={-1.60} z2={ 0.95} mat={mat.trace} />
      <Trace x1={-0.97} z1={ 0.80} x2={-1.55} z2={ 1.20} mat={mat.trace} />
      {/* Right side */}
      <Trace x1={ 0.97} z1={-0.55} x2={ 1.65} z2={-0.55} mat={mat.trace} />
      <Trace x1={ 0.97} z1={-0.27} x2={ 1.60} z2={-0.27} mat={mat.trace} />
      <Trace x1={ 0.97} z1={ 0.10} x2={ 1.60} z2={ 0.45} mat={mat.trace} />
      <Trace x1={ 0.97} z1={ 0.45} x2={ 1.65} z2={ 0.80} mat={mat.trace} />
      <Trace x1={ 0.97} z1={ 0.70} x2={ 1.55} z2={ 1.10} mat={mat.trace} />
      {/* Front */}
      <Trace x1={-0.35} z1={ 0.97} x2={-0.35} z2={ 1.65} mat={mat.trace} />
      <Trace x1={ 0.05} z1={ 0.97} x2={ 0.05} z2={ 1.60} mat={mat.trace} />
      <Trace x1={ 0.40} z1={ 0.97} x2={ 0.70} z2={ 1.55} mat={mat.trace} />
      <Trace x1={ 0.65} z1={ 0.97} x2={ 0.90} z2={ 1.40} mat={mat.trace} />
      {/* Back */}
      <Trace x1={-0.25} z1={-0.97} x2={-0.25} z2={-1.60} mat={mat.trace} />
      <Trace x1={ 0.10} z1={-0.97} x2={ 0.10} z2={-1.65} mat={mat.trace} />
      <Trace x1={ 0.45} z1={-0.97} x2={ 0.75} z2={-1.50} mat={mat.trace} />
      <Trace x1={-0.55} z1={-0.97} x2={-0.90} z2={-1.45} mat={mat.trace} />
      {/* Power bus traces (wider) */}
      <Trace x1={-1.70} z1={-0.14} x2={-1.70} z2={-0.90} mat={mat.trace} w={0.028} />
      <Trace x1={-1.70} z1={ 0.14} x2={-1.70} z2={ 0.90} mat={mat.trace} w={0.028} />
      <Trace x1={ 1.65} z1={-0.55} x2={ 1.65} z2={-1.10} mat={mat.trace} w={0.024} />
      <Trace x1={ 1.65} z1={ 0.80} x2={ 1.65} z2={ 1.40} mat={mat.trace} w={0.024} />
      {/* Differential pairs (narrow, tight) */}
      <Trace x1={-0.97} z1={-0.78} x2={-1.90} z2={-0.78} mat={mat.trace} w={0.011} />
      <Trace x1={-0.97} z1={-0.83} x2={-1.90} z2={-0.83} mat={mat.trace} w={0.011} />
      <Trace x1={ 0.97} z1={-0.78} x2={ 1.90} z2={-0.78} mat={mat.trace} w={0.011} />
      <Trace x1={ 0.97} z1={-0.83} x2={ 1.90} z2={-0.83} mat={mat.trace} w={0.011} />
      {/* Horizontal bus segment */}
      <Trace x1={-1.90} z1={-0.78} x2={-1.90} z2={-1.20} mat={mat.trace} w={0.011} />
      <Trace x1={-1.90} z1={-0.83} x2={-1.90} z2={-1.25} mat={mat.trace} w={0.011} />

      {/* ── Electrolytic capacitors ── */}
      <ElectrolyticCap x={-1.80} z={ 0.55} matBody={mat.electroBody} matTop={mat.electroTop} />
      <ElectrolyticCap x={-1.80} z={-0.55} matBody={mat.electroBody} matTop={mat.electroTop} />
      <ElectrolyticCap x={ 1.80} z={ 0.55} matBody={mat.electroBody} matTop={mat.electroTop} />
      <ElectrolyticCap x={ 1.80} z={-0.30} r={0.075} h={0.24} matBody={mat.electroBody} matTop={mat.electroTop} />
      <ElectrolyticCap x={-0.55} z={-1.80} r={0.075} h={0.24} matBody={mat.electroBody} matTop={mat.electroTop} />
      <ElectrolyticCap x={ 0.55} z={ 1.80} r={0.080} h={0.26} matBody={mat.electroBody} matTop={mat.electroTop} />

      {/* ── Crystal oscillator ── */}
      <Crystal x={ 0.80} z={-1.60} mat={mat.crystal} />

      {/* ── Power inductor ── */}
      <Inductor x={-0.80} z={ 1.60} mat={mat.inductor} />

      {/* ── SOT-23 voltage regulators ── */}
      <SOT23 x={-1.55} z={ 1.15} ry={0}           matBody={mat.icBody} matPin={mat.pin} />
      <SOT23 x={ 1.55} z={ 1.10} ry={Math.PI / 2} matBody={mat.icBody} matPin={mat.pin} />
      <SOT23 x={ 0.30} z={-1.65} ry={Math.PI / 4} matBody={mat.icBody} matPin={mat.pin} />

      {/* ── 0402 Ceramic decoupling caps (near IC) ── */}
      <SMD x={-1.08} y={0.04} z={ 0.00} ry={0}           mat={mat.cap} w={0.08} h={0.05} d={0.055} />
      <SMD x={-1.08} y={0.04} z={-0.18} ry={0}           mat={mat.cap} w={0.08} h={0.05} d={0.055} />
      <SMD x={ 1.08} y={0.04} z={ 0.12} ry={0}           mat={mat.cap} w={0.08} h={0.05} d={0.055} />
      <SMD x={-0.05} y={0.04} z={-1.08} ry={Math.PI / 2} mat={mat.cap} w={0.08} h={0.05} d={0.055} />
      <SMD x={ 0.18} y={0.04} z={ 1.08} ry={Math.PI / 2} mat={mat.cap} w={0.08} h={0.05} d={0.055} />

      {/* ── Larger 0603 ceramic caps ── */}
      <SMD x={-1.15} y={0.04} z={-1.15} ry={0.3}         mat={mat.cap} />
      <SMD x={-1.15} y={0.04} z={-1.38} ry={0.0}         mat={mat.cap} />
      <SMD x={ 1.15} y={0.04} z={ 1.15} ry={0.5}         mat={mat.cap} />
      <SMD x={ 1.25} y={0.04} z={-1.15} ry={Math.PI / 2} mat={mat.cap} />
      <SMD x={-1.15} y={0.04} z={ 1.25} ry={Math.PI / 2} mat={mat.cap} />
      <SMD x={ 0.65} y={0.04} z={ 1.55} ry={0.1}         mat={mat.cap} />
      <SMD x={-0.65} y={0.04} z={-1.45} ry={0.2}         mat={mat.cap} />
      <SMD x={ 1.15} y={0.04} z={ 1.38} ry={Math.PI / 2} mat={mat.cap} />
      <SMD x={-1.35} y={0.04} z={ 0.00} ry={0}           mat={mat.cap} w={0.1} h={0.055} d={0.06} />
      <SMD x={-1.35} y={0.04} z={-0.20} ry={0}           mat={mat.cap} w={0.1} h={0.055} d={0.06} />
      <SMD x={ 1.35} y={0.04} z={-0.0}  ry={0}           mat={mat.cap} w={0.1} h={0.055} d={0.06} />

      {/* ── Resistors ── */}
      <SMD x={-1.68} y={0.04} z={ 0.65} ry={Math.PI/2} w={0.14} h={0.055} d={0.065} mat={mat.resistor} />
      <SMD x={-1.68} y={0.04} z={-0.65} ry={Math.PI/2} w={0.14} h={0.055} d={0.065} mat={mat.resistor} />
      <SMD x={ 1.68} y={0.04} z={ 0.30} ry={Math.PI/2} w={0.14} h={0.055} d={0.065} mat={mat.resistor} />
      <SMD x={ 1.68} y={0.04} z={-0.30} ry={Math.PI/2} w={0.14} h={0.055} d={0.065} mat={mat.resistor} />
      <SMD x={ 0.35} y={0.04} z={-1.68} ry={0.0}       w={0.14} h={0.055} d={0.065} mat={mat.resistor} />
      <SMD x={-0.45} y={0.04} z={ 1.68} ry={0.0}       w={0.14} h={0.055} d={0.065} mat={mat.resistor} />
      <SMD x={ 0.75} y={0.04} z={ 1.68} ry={0.15}      w={0.14} h={0.055} d={0.065} mat={mat.resistor} />
      <SMD x={-0.85} y={0.04} z={-1.60} ry={0.1}       w={0.14} h={0.055} d={0.065} mat={mat.resistor} />
      {/* Resistor network — 0-ohm jumper row */}
      {[-0.33, -0.11, 0.11, 0.33].map((z, i) => (
        <SMD key={i} x={-1.95} y={0.04} z={z} ry={Math.PI/2} w={0.11} h={0.05} d={0.055} mat={mat.resistor} />
      ))}

      {/* ── LED indicators ── */}
      <SMD x={-1.95} y={0.04} z={-0.60} ry={0} w={0.09} h={0.08} d={0.09} mat={mat.led} />
      <SMD x={ 1.95} y={0.04} z={ 0.85} ry={0} w={0.09} h={0.08} d={0.09} mat={mat.led} />
      <SMD x={ 0.00} y={0.04} z={ 1.95} ry={0} w={0.09} h={0.08} d={0.09} mat={mat.ledAmber} />

      {/* ── Silkscreen outlines & reference labels ── */}
      {[
        [ 0.68, 0.009, -1.62, 0.44, 0.001, 0.30],
        [-1.15, 0.009, -1.25, 0.09, 0.001, 0.34],
        [ 1.15, 0.009,  1.25, 0.44, 0.001, 0.09],
        [-0.55, 0.009,  1.18, 0.09, 0.001, 0.26],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y as number, z as number]} material={mat.silk}>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}
      {/* Small text-bar labels */}
      {[
        [-1.80, 0.009,  0.10, 0.28, 0.001, 0.028],
        [-1.80, 0.009, -0.10, 0.28, 0.001, 0.028],
        [ 1.80, 0.009,  0.10, 0.28, 0.001, 0.028],
        [ 0.80, 0.009, -1.48, 0.20, 0.001, 0.028],
        [ 0.80, 0.009, -1.52, 0.16, 0.001, 0.022],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y as number, z as number]} material={mat.silk}>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}

      {/* ── Vias — organized grid + near-IC bypass ── */}
      {[
        // Left column
        [-1.30, -1.00], [-1.30, -0.65], [-1.30, -0.30], [-1.30, 0.05],
        [-1.30,  0.40], [-1.30,  0.75], [-1.30,  1.10],
        // Right column
        [ 1.30, -1.00], [ 1.30, -0.45], [ 1.30,  0.45], [ 1.30,  1.00],
        // Bottom row
        [-0.55, -1.30], [-0.10, -1.30], [ 0.35, -1.30],
        // Top row
        [-0.45,  1.30], [ 0.10,  1.30], [ 0.55,  1.30],
        // Near-IC bypass
        [-1.05,  0.20], [ 1.05,  0.20], [ 0.20, -1.05], [-0.20, 1.05],
        [ 0.20,  1.05], [-1.05, -0.20],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.008, z as number]} material={mat.trace}>
          <cylinderGeometry args={[0.025, 0.025, 0.005, 8]} />
        </mesh>
      ))}
      {/* Annular rings */}
      {[
        [-1.30, -1.00], [-1.30,  0.05], [-1.30,  1.10],
        [ 1.30, -1.00], [ 1.30,  1.00],
        [-0.55, -1.30], [ 0.35, -1.30],
        [-0.45,  1.30], [ 0.55,  1.30],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.005, z as number]} material={mat.trace}>
          <ringGeometry args={[0.025, 0.048, 10]} />
        </mesh>
      ))}

      {/* ── Mounting holes ── */}
      {[[-2.0, -2.0], [2.0, -2.0], [-2.0, 2.0], [2.0, 2.0]].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, 0.005, z as number]} material={mat.trace}>
            <ringGeometry args={[0.08, 0.13, 16]} />
          </mesh>
          <mesh position={[x, 0.01, z as number]} material={mat.silk}>
            <ringGeometry args={[0.13, 0.17, 14]} />
          </mesh>
        </group>
      ))}

    </group>
  )
}
