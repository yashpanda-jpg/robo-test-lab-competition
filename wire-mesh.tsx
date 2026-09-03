"use client"

import { useMemo } from "react"
import * as THREE from "three"

interface WireMeshProps {
  from: [number, number] // x,z
  to: [number, number]
  color: string
  lift?: number
  onClick?: (e: any) => void
  interactive?: boolean
  dimmed?: boolean
}

export function WireMesh({
  from,
  to,
  color,
  lift = 1.1,
  onClick,
  interactive,
  dimmed,
}: WireMeshProps) {
  const geometry = useMemo(() => {
    const start = new THREE.Vector3(from[0], 0.16, from[1])
    const end = new THREE.Vector3(to[0], 0.16, to[1])
    const dist = start.distanceTo(end)
    const mid = start.clone().lerp(end, 0.5)
    mid.y += Math.min(1.6, 0.35 + dist * lift * 0.14)
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
    return new THREE.TubeGeometry(curve, 24, 0.075, 10, false)
  }, [from, to, lift])

  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={dimmed ? 0.05 : 0.25}
          roughness={0.35}
          metalness={0.3}
          transparent
          opacity={dimmed ? 0.5 : 1}
        />
      </mesh>
      {/* fat invisible hit tube for easy clicking */}
      {interactive && (
        <mesh
          geometry={geometry}
          onClick={onClick}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
          scale={[1, 1, 1]}
        >
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          {/* enlarge hit area */}
        </mesh>
      )}
    </group>
  )
}
