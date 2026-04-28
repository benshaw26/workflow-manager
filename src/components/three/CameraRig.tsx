'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useMousePosition } from '@/hooks/useMousePosition'

export function CameraRig() {
  const { camera } = useThree()
  const mouse = useMousePosition()
  const targetRef = useRef({ x: 0, y: 0 })

  useFrame(() => {
    targetRef.current.x += (mouse.x * 0.5 - targetRef.current.x) * 0.05
    targetRef.current.y += (mouse.y * 0.3 - targetRef.current.y) * 0.05
    camera.position.x = targetRef.current.x
    camera.position.y = 1 + targetRef.current.y
    camera.lookAt(0, 0.1, 0)
  })

  return null
}
