"use client"

import { useMemo } from "react"
import { Text } from "@react-three/drei"

interface BoardMeshProps {
  size: [number, number]
}

export function BoardMesh({ size }: BoardMeshProps) {
  const [w, d] = size

  // decorative copper traces baked into the silkscreen for that CAD look
  const traces = useMemo(() => {
    const lines: { x: number; z: number; len: number; horizontal: boolean }[] = []
    const cols = 7
    for (let i = 0; i < cols; i++) {
      const x = -w / 2 + 1 + (i * (w - 2)) / (cols - 1)
      lines.push({ x, z: 0, len: d - 1.4, horizontal: false })
    }
    for (let i = 0; i < 4; i++) {
      const z = -d / 2 + 1 + (i * (d - 2)) / 3
      lines.push({ x: 0, z, len: w - 1.4, horizontal: true })
    }
    return lines
  }, [w, d])

  return (
    <group>
      {/* board base */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[w, 0.28, d]} />
        <meshStandardMaterial color="#1f9d57" roughness={0.95} metalness={0} flatShading />
      </mesh>
      {/* top solder-mask surface slightly brighter */}
      <mesh position={[0, 0.141, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#2bbb68" roughness={1} metalness={0} />
      </mesh>

      {/* copper traces */}
      {traces.map((t, i) => (
        <mesh
          key={i}
          position={[t.x, 0.152, t.z]}
          rotation={[-Math.PI / 2, 0, t.horizontal ? Math.PI / 2 : 0]}
        >
          <planeGeometry args={[0.09, t.len]} />
          <meshStandardMaterial color="#e8b84b" metalness={0} roughness={0.9} />
        </mesh>
      ))}

      {/* mounting holes in corners */}
      {[
        [-w / 2 + 0.55, -d / 2 + 0.55],
        [w / 2 - 0.55, -d / 2 + 0.55],
        [-w / 2 + 0.55, d / 2 - 0.55],
        [w / 2 - 0.55, d / 2 - 0.55],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.16, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.28, 24]} />
          <meshStandardMaterial color="#c9a24a" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* silkscreen board label */}
      <Text
        position={[-w / 2 + 0.3, 0.16, d / 2 - 0.3]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.26}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
        fillOpacity={0.85}
      >
        REV-A · FIXBOARD
      </Text>
    </group>
  )
}
