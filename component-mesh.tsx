"use client"

import { Text } from "@react-three/drei"
import type { ComponentType } from "@/lib/levels"

interface PartProps {
  type: ComponentType
  color?: string
}

/** The physical body of a component, modelled at the origin, sitting on y=0 */
function PartBody({ type, color }: PartProps) {
  switch (type) {
    case "ic":
      return (
        <group>
          {/* chip body */}
          <mesh castShadow position={[0, 0.28, 0]}>
            <boxGeometry args={[1.7, 0.55, 1.4]} />
            <meshStandardMaterial color="#111417" roughness={0.5} metalness={0.2} />
          </mesh>
          {/* notch dot */}
          <mesh position={[-0.6, 0.56, -0.45]}>
            <cylinderGeometry args={[0.09, 0.09, 0.03, 16]} />
            <meshStandardMaterial color="#3a3f45" />
          </mesh>
          {/* pins */}
          {[-0.6, -0.2, 0.2, 0.6].map((x) =>
            [-0.78, 0.78].map((z) => (
              <mesh key={`${x}-${z}`} position={[x, 0.12, z]} castShadow>
                <boxGeometry args={[0.14, 0.06, 0.24]} />
                <meshStandardMaterial color="#c9ccd1" metalness={0.9} roughness={0.3} />
              </mesh>
            )),
          )}
        </group>
      )
    case "resistor":
      return (
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow position={[0, 0, 0]}>
            <capsuleGeometry args={[0.28, 0.7, 8, 16]} />
            <meshStandardMaterial color="#d9c8a0" roughness={0.6} />
          </mesh>
          {/* color bands */}
          {[-0.18, 0, 0.18].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <cylinderGeometry args={[0.29, 0.29, 0.08, 16]} />
              <meshStandardMaterial color={["#7c3f00", "#111", "#c026d3"][i]} />
            </mesh>
          ))}
        </group>
      )
    case "led":
      return (
        <group>
          <mesh castShadow position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.34, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial
              color={color ?? "#ef4444"}
              emissive={color ?? "#ef4444"}
              emissiveIntensity={0.6}
              transparent
              opacity={0.85}
              roughness={0.15}
            />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.28, 24]} />
            <meshStandardMaterial
              color={color ?? "#ef4444"}
              emissive={color ?? "#ef4444"}
              emissiveIntensity={0.35}
              transparent
              opacity={0.8}
              roughness={0.2}
            />
          </mesh>
        </group>
      )
    case "capacitor":
      return (
        <group>
          <mesh castShadow position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.36, 0.36, 0.9, 24]} />
            <meshStandardMaterial color={color ?? "#2563eb"} roughness={0.35} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.36, 0.36, 0.04, 24]} />
            <meshStandardMaterial color="#dfe4ea" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* stripe */}
          <mesh position={[0.34, 0.45, 0]}>
            <boxGeometry args={[0.04, 0.7, 0.14]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
        </group>
      )
    case "battery":
      return (
        <group>
          <mesh castShadow position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.44, 32]} />
            <meshStandardMaterial color="#c0c5cc" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.06, 24]} />
            <meshStandardMaterial color="#8a8f96" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      )
    case "switch":
      return (
        <group>
          <mesh castShadow position={[0, 0.24, 0]}>
            <boxGeometry args={[1.1, 0.48, 0.9]} />
            <meshStandardMaterial color="#1f2937" roughness={0.5} />
          </mesh>
          <mesh castShadow position={[0, 0.56, 0]}>
            <boxGeometry args={[0.5, 0.22, 0.5]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.4} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}

interface ComponentMeshProps {
  type: ComponentType
  label: string
  color?: string
  position: [number, number, number]
  state: "correct" | "wrong" | "dragging" | "placed"
  onPointerDown?: (e: any) => void
  onClick?: (e: any) => void
  interactive?: boolean
  cursor?: string
}

const STATE_RING: Record<string, string> = {
  correct: "#22c55e",
  wrong: "#f59e0b",
  dragging: "#2b83f6",
  placed: "#94a3b8",
}

export function ComponentMesh({
  type,
  label,
  color,
  position,
  state,
  onPointerDown,
  onClick,
  interactive,
  cursor = "grab",
}: ComponentMeshProps) {
  return (
    <group position={position}>
      {/* footprint / status ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.95, 1.12, 40]} />
        <meshBasicMaterial
          color={STATE_RING[state]}
          transparent
          opacity={state === "correct" ? 0.9 : 0.65}
        />
      </mesh>

      {/* invisible grab pad so the whole footprint is interactive */}
      {interactive && (
        <mesh
          position={[0, 0.4, 0]}
          onPointerDown={onPointerDown}
          onClick={onClick}
          onPointerOver={() => (document.body.style.cursor = cursor)}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <boxGeometry args={[1.9, 1.2, 1.7]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      <PartBody type={type} color={color} />

      <Text
        position={[0, 0.02, 1.28]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.34}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  )
}
