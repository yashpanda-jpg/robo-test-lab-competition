"use client"

import { useMemo, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, ContactShadows, Grid, Text } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import { Button } from "@/components/ui/button"
import {
  LEVELS,
  netKey,
  makeSandboxLevel,
  SANDBOX_SLOTS,
  PART_DEFS,
  type Level,
  type Wire,
  type BoardComponent,
  type ComponentType,
} from "@/lib/levels"
import { BoardMesh } from "./board-mesh"
import { ComponentMesh } from "./component-mesh"
import { WireMesh } from "./wire-mesh"

const SNAP_DIST = 1.6

type Tool = "move" | "wire" | "delete"
type Mode = "levels" | "build"

function padMap(level: Level) {
  const m: Record<string, [number, number]> = {}
  for (const p of level.pads) m[p.id] = p.pos
  return m
}
function slotMap(level: Level) {
  const m: Record<string, [number, number]> = {}
  for (const s of level.slots) m[s.id] = s.pos
  return m
}

interface SceneProps {
  level: Level
  tool: Tool
  diagnostics: boolean
  freeform: boolean
  componentSlots: Record<string, string>
  setComponentSlots: (v: Record<string, string>) => void
  wires: Wire[]
  setWires: (v: Wire[]) => void
  pendingPad: string | null
  setPendingPad: (v: string | null) => void
  onDeleteComponent: (id: string) => void
}

function Scene({
  level,
  tool,
  diagnostics,
  freeform,
  componentSlots,
  setComponentSlots,
  wires,
  setWires,
  pendingPad,
  setPendingPad,
  onDeleteComponent,
}: SceneProps) {
  const controls = useRef<OrbitControlsImpl>(null)
  const pads = useMemo(() => padMap(level), [level])
  const slots = useMemo(() => slotMap(level), [level])
  const requiredSet = useMemo(
    () => new Set(level.requiredNets.map(([a, b]) => netKey(a, b))),
    [level],
  )

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [tempPos, setTempPos] = useState<[number, number]>([0, 0])

  function startDrag(compId: string) {
    if (tool !== "move") return
    setDraggingId(compId)
    const slot = componentSlots[compId]
    setTempPos(slots[slot])
    if (controls.current) controls.current.enabled = false
  }

  function endDrag() {
    if (!draggingId) return
    let best: string | null = null
    let bestD = SNAP_DIST
    for (const s of level.slots) {
      const dx = s.pos[0] - tempPos[0]
      const dz = s.pos[1] - tempPos[1]
      const dist = Math.hypot(dx, dz)
      if (dist < bestD) {
        bestD = dist
        best = s.id
      }
    }
    const next = { ...componentSlots }
    const fromSlot = componentSlots[draggingId]
    if (best && best !== fromSlot) {
      const occupant = Object.keys(next).find((c) => next[c] === best && c !== draggingId)
      if (occupant) next[occupant] = fromSlot
      next[draggingId] = best
    }
    setComponentSlots(next)
    setDraggingId(null)
    if (controls.current) controls.current.enabled = true
  }

  function handlePad(padId: string) {
    if (tool !== "wire") return
    if (!pendingPad) {
      setPendingPad(padId)
      return
    }
    if (pendingPad === padId) {
      setPendingPad(null)
      return
    }
    const key = netKey(pendingPad, padId)
    const exists = wires.some((w) => netKey(w.a, w.b) === key)
    if (!exists) setWires([...wires, { a: pendingPad, b: padId }])
    setPendingPad(null)
  }

  function removeWire(index: number) {
    if (tool !== "wire" && tool !== "delete") return
    setWires(wires.filter((_, i) => i !== index))
  }

  return (
    <>
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#ffffff", "#c7d3df", 0.9]} />
      <directionalLight
        position={[7, 13, 6]}
        intensity={1.35}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-8, 7, -5]} intensity={0.35} color="#e8f0ff" />

      {/* Tinkercad-style workplane grid */}
      <Grid
        position={[0, -0.16, 0]}
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#b7c6d8"
        sectionSize={5}
        sectionThickness={1.1}
        sectionColor="#8fa6bf"
        fadeDistance={55}
        fadeStrength={1.4}
        infiniteGrid
        followCamera={false}
      />

      <group position={[0, 0, 0]}>
        <BoardMesh size={level.boardSize} />

        {/* pads */}
        {level.pads.map((p) => {
          const isPending = pendingPad === p.id
          return (
            <group key={p.id} position={[p.pos[0], 0, p.pos[1]]}>
              <mesh
                position={[0, 0.18, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={(e) => {
                  e.stopPropagation()
                  handlePad(p.id)
                }}
                onPointerOver={() =>
                  tool === "wire" && (document.body.style.cursor = "crosshair")
                }
                onPointerOut={() => (document.body.style.cursor = "auto")}
              >
                <circleGeometry args={[0.34, 24]} />
                <meshStandardMaterial
                  color={isPending ? "#2b83f6" : "#e6b34a"}
                  emissive={isPending ? "#2b83f6" : "#000000"}
                  emissiveIntensity={isPending ? 0.7 : 0}
                  metalness={0.85}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, 0.14, 0]}>
                <cylinderGeometry args={[0.13, 0.13, 0.3, 16]} />
                <meshStandardMaterial color="#3b2f18" metalness={0.4} roughness={0.6} />
              </mesh>
              <Text
                position={[0, 0.16, 0.56]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.24}
                color="#f4fbff"
                anchorX="center"
                anchorY="middle"
                fillOpacity={0.9}
              >
                {p.label}
              </Text>
            </group>
          )
        })}

        {/* ghost target wires (diagnostics, levels only) */}
        {diagnostics &&
          !freeform &&
          level.requiredNets.map(([a, b]) => {
            const key = netKey(a, b)
            const present = wires.some((w) => netKey(w.a, w.b) === key)
            if (present) return null
            return (
              <WireMesh
                key={`ghost-${key}`}
                from={pads[a]}
                to={pads[b]}
                color="#4a9bf5"
                dimmed
              />
            )
          })}

        {/* wires */}
        {wires.map((w, i) => {
          const key = netKey(w.a, w.b)
          const correct = requiredSet.has(key)
          const color = freeform
            ? "#2b83f6"
            : diagnostics
              ? correct
                ? "#22c55e"
                : "#ef4444"
              : "#e6b34a"
          return (
            <WireMesh
              key={`${key}-${i}`}
              from={pads[w.a]}
              to={pads[w.b]}
              color={color}
              interactive={tool === "wire" || tool === "delete"}
              onClick={(e: any) => {
                e.stopPropagation()
                removeWire(i)
              }}
            />
          )
        })}

        {/* components */}
        {level.components.map((c) => {
          const isDragging = draggingId === c.id
          const slot = componentSlots[c.id]
          const pos: [number, number] = isDragging ? tempPos : slots[slot]
          const correct = slot === c.correctSlot
          const state = isDragging
            ? "dragging"
            : freeform
              ? "placed"
              : correct
                ? "correct"
                : "wrong"
          return (
            <ComponentMesh
              key={c.id}
              type={c.type}
              label={c.label}
              color={c.color}
              position={[pos[0], 0.15, pos[1]]}
              state={state}
              interactive={tool === "move" || tool === "delete"}
              cursor={tool === "delete" ? "pointer" : "grab"}
              onPointerDown={
                tool === "move"
                  ? (e: any) => {
                      e.stopPropagation()
                      startDrag(c.id)
                    }
                  : undefined
              }
              onClick={
                tool === "delete"
                  ? (e: any) => {
                      e.stopPropagation()
                      onDeleteComponent(c.id)
                    }
                  : undefined
              }
            />
          )
        })}

        {/* drag plane */}
        {draggingId && (
          <mesh
            position={[0, 0.15, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerMove={(e) => {
              e.stopPropagation()
              setTempPos([e.point.x, e.point.z])
            }}
            onPointerUp={(e) => {
              e.stopPropagation()
              endDrag()
            }}
          >
            <planeGeometry args={[80, 80]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}
      </group>

      <ContactShadows
        position={[0, -0.15, 0]}
        opacity={0.32}
        scale={40}
        blur={2.4}
        far={9}
        color="#334155"
      />

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        minDistance={9}
        maxDistance={28}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 0, 0]}
      />
    </>
  )
}

export function PcbGame() {
  const [mode, setMode] = useState<Mode>("levels")
  const [levelIndex, setLevelIndex] = useState(0)

  const [tool, setTool] = useState<Tool>("move")
  const [diagnostics, setDiagnostics] = useState(false)
  const [pendingPad, setPendingPad] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  // level-mode state
  const levelInit = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of LEVELS[levelIndex].components) m[c.id] = c.startSlot
    return m
  }, [levelIndex])
  const [levelSlots, setLevelSlots] = useState<Record<string, string>>(levelInit)
  const [levelWires, setLevelWires] = useState<Wire[]>(
    LEVELS[0].startWires.map((w) => ({ ...w })),
  )

  // build-mode state
  const [buildComponents, setBuildComponents] = useState<BoardComponent[]>([])
  const [buildSlots, setBuildSlots] = useState<Record<string, string>>({})
  const [buildWires, setBuildWires] = useState<Wire[]>([])
  const [buildCounter, setBuildCounter] = useState(1)

  const freeform = mode === "build"
  const level = freeform ? makeSandboxLevel(buildComponents) : LEVELS[levelIndex]
  const componentSlots = freeform ? buildSlots : levelSlots
  const wires = freeform ? buildWires : levelWires

  function setComponentSlots(v: Record<string, string>) {
    if (freeform) setBuildSlots(v)
    else setLevelSlots(v)
    setChecked(false)
  }
  function setWires(v: Wire[]) {
    if (freeform) setBuildWires(v)
    else setLevelWires(v)
    setChecked(false)
  }

  function loadLevel(index: number) {
    setLevelIndex(index)
    const m: Record<string, string> = {}
    for (const c of LEVELS[index].components) m[c.id] = c.startSlot
    setLevelSlots(m)
    setLevelWires(LEVELS[index].startWires.map((w) => ({ ...w })))
    setPendingPad(null)
    setChecked(false)
    setDiagnostics(false)
    setTool("move")
  }

  function resetLevel() {
    const m: Record<string, string> = {}
    for (const c of LEVELS[levelIndex].components) m[c.id] = c.startSlot
    setLevelSlots(m)
    setLevelWires(LEVELS[levelIndex].startWires.map((w) => ({ ...w })))
    setPendingPad(null)
    setChecked(false)
    setDiagnostics(false)
  }

  function switchMode(next: Mode) {
    setMode(next)
    setTool("move")
    setPendingPad(null)
    setChecked(false)
    setDiagnostics(false)
  }

  function addPart(type: ComponentType) {
    const used = new Set(Object.values(buildSlots))
    const free = SANDBOX_SLOTS.find((s) => !used.has(s.id))
    if (!free) return
    const def = PART_DEFS.find((d) => d.type === type)!
    const id = `build_${buildCounter}`
    const count = buildComponents.filter((c) => c.type === type).length + 1
    setBuildComponents([
      ...buildComponents,
      {
        id,
        type,
        label: count > 1 ? `${def.label} ${count}` : def.label,
        correctSlot: free.id,
        startSlot: free.id,
        color: def.color,
      },
    ])
    setBuildSlots({ ...buildSlots, [id]: free.id })
    setBuildCounter(buildCounter + 1)
  }

  function deleteComponent(id: string) {
    setBuildComponents(buildComponents.filter((c) => c.id !== id))
    const next = { ...buildSlots }
    delete next[id]
    setBuildSlots(next)
  }

  function clearBuild() {
    setBuildComponents([])
    setBuildSlots({})
    setBuildWires([])
    setPendingPad(null)
    setBuildCounter(1)
  }

  // win evaluation (levels only)
  const requiredKeys = level.requiredNets.map(([a, b]) => netKey(a, b))
  const wireKeys = new Set(wires.map((w) => netKey(w.a, w.b)))
  const placementDone = level.components.every((c) => componentSlots[c.id] === c.correctSlot)
  const wiringDone =
    wireKeys.size === requiredKeys.length && requiredKeys.every((k) => wireKeys.has(k))
  const solved = !freeform && placementDone && wiringDone

  const wrongCount = wires.filter((w) => !requiredKeys.includes(netKey(w.a, w.b))).length
  const missingCount = requiredKeys.filter((k) => !wireKeys.has(k)).length
  const misplacedCount = level.components.filter(
    (c) => componentSlots[c.id] !== c.correctSlot,
  ).length

  const slotsFull = Object.keys(buildSlots).length >= SANDBOX_SLOTS.length

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#e4ebf3] font-sans text-slate-700">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 12, 13], fov: 42 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#e4ebf3"]} />
        <fog attach="fog" args={["#e4ebf3", 34, 60]} />
        <Scene
          level={level}
          tool={tool}
          diagnostics={diagnostics}
          freeform={freeform}
          componentSlots={componentSlots}
          setComponentSlots={setComponentSlots}
          wires={wires}
          setWires={setWires}
          pendingPad={pendingPad}
          setPendingPad={setPendingPad}
          onDeleteComponent={deleteComponent}
        />
      </Canvas>

      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 md:p-6">
        <div className="pointer-events-auto max-w-md rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur">
          {/* mode switch */}
          <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-0.5">
            <SegButton active={mode === "levels"} onClick={() => switchMode("levels")}>
              Levels
            </SegButton>
            <SegButton active={mode === "build"} onClick={() => switchMode("build")}>
              Build
            </SegButton>
          </div>

          {freeform ? (
            <>
              <h1 className="text-lg font-semibold tracking-tight text-slate-800">
                Build your own circuit
              </h1>
              <p className="mt-1.5 text-pretty text-[13px] leading-relaxed text-slate-500">
                Add parts from the tray, drag them onto the footprints, then route wires between
                the gold pads. It&apos;s your board — there are no wrong answers here.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#2b83f6]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#2b83f6]" />
                Level {level.id} / {LEVELS.length}
              </div>
              <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-800">
                {level.name}
              </h1>
              <p className="mt-1.5 text-pretty text-[13px] leading-relaxed text-slate-500">
                {level.brief}
              </p>
            </>
          )}
        </div>

        {/* status chips (levels only) */}
        {!freeform && (
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <StatusChip label="Misplaced parts" value={misplacedCount} />
            <StatusChip label="Bad wires" value={diagnostics ? wrongCount : null} />
            <StatusChip label="Missing wires" value={diagnostics ? missingCount : null} />
          </div>
        )}
      </div>

      {/* parts tray (build only) */}
      {freeform && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center p-4 md:p-6">
          <div className="pointer-events-auto w-40 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg shadow-slate-900/5 backdrop-blur">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Parts tray
            </div>
            <div className="flex flex-col gap-1.5">
              {PART_DEFS.map((p) => (
                <button
                  key={p.type}
                  onClick={() => addPart(p.type)}
                  disabled={slotsFull}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium capitalize text-slate-700 transition-colors hover:border-[#2b83f6] hover:text-[#2b83f6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {p.label}
                  <span className="text-slate-300">+</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-slate-400">
              {slotsFull ? "Board is full — delete a part to add more." : "Tap to drop a part on the board."}
            </p>
          </div>
        </div>
      )}

      {/* bottom toolbar */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-lg shadow-slate-900/5 backdrop-blur">
          <ToolButton active={tool === "move"} onClick={() => setTool("move")}>
            Arrange parts
          </ToolButton>
          <ToolButton active={tool === "wire"} onClick={() => setTool("wire")}>
            Route wires
          </ToolButton>
          <ToolButton active={tool === "delete"} onClick={() => setTool("delete")}>
            Delete
          </ToolButton>
          <div className="mx-1 h-6 w-px bg-slate-200" />
          {freeform ? (
            <Button
              variant="ghost"
              className="h-9 rounded-lg px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              onClick={clearBuild}
            >
              Clear board
            </Button>
          ) : (
            <>
              <ToolButton active={diagnostics} onClick={() => setDiagnostics((d) => !d)}>
                Diagnostics
              </ToolButton>
              <Button
                variant="ghost"
                className="h-9 rounded-lg px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                onClick={resetLevel}
              >
                Reset
              </Button>
              <Button
                className="h-9 rounded-lg bg-[#2b83f6] px-4 font-semibold text-white hover:bg-[#1f6fd8]"
                onClick={() => {
                  setChecked(true)
                  setDiagnostics(true)
                }}
              >
                Verify board
              </Button>
            </>
          )}
        </div>
        <p className="text-center text-[11px] text-slate-500">
          {tool === "move"
            ? "Drag a part onto a footprint. Rings show placement status."
            : tool === "wire"
              ? "Click two gold pads to route a wire between them."
              : "Click a part or a wire to remove it."}
        </p>
      </div>

      {/* win / verify overlay (levels only) */}
      {checked && !freeform && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl shadow-slate-900/10">
            {solved ? (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
                  ✓
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-800">Board passes QA</h2>
                <p className="mt-1.5 text-[13px] text-slate-500">
                  Every part is seated and the wiring is clean. Nice repair.
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  {levelIndex < LEVELS.length - 1 ? (
                    <Button
                      className="bg-[#2b83f6] font-semibold text-white hover:bg-[#1f6fd8]"
                      onClick={() => loadLevel(levelIndex + 1)}
                    >
                      Next level
                    </Button>
                  ) : (
                    <Button
                      className="bg-[#2b83f6] font-semibold text-white hover:bg-[#1f6fd8]"
                      onClick={() => loadLevel(0)}
                    >
                      Restart from level 1
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    onClick={() => setChecked(false)}
                  >
                    Keep inspecting
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-600">
                  !
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-800">Not quite yet</h2>
                <ul className="mx-auto mt-3 space-y-1 text-left text-[13px] text-slate-600">
                  <li>Misplaced parts: {misplacedCount}</li>
                  <li>Bad wires to remove: {wrongCount}</li>
                  <li>Missing wires to add: {missingCount}</li>
                </ul>
                <p className="mt-3 text-[12px] text-slate-400">
                  Diagnostics is on — bad wires glow red, missing ones show as blue ghosts.
                </p>
                <Button
                  className="mt-5 bg-[#2b83f6] font-semibold text-white hover:bg-[#1f6fd8]"
                  onClick={() => setChecked(false)}
                >
                  Back to repair
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

function StatusChip({ label, value }: { label: string; value: number | null }) {
  const ok = value === 0
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] shadow-sm backdrop-blur">
      <span className="text-slate-400">{label}</span>
      <span
        className={
          value === null
            ? "text-slate-300"
            : ok
              ? "font-semibold text-green-600"
              : "font-semibold text-amber-500"
        }
      >
        {value === null ? "—" : value}
      </span>
    </div>
  )
}

function ToolButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        "h-9 rounded-lg px-4 text-[13px] font-medium transition-colors " +
        (active
          ? "bg-[#2b83f6] text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
      }
    >
      {children}
    </button>
  )
}

function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-md px-3 py-1 text-[12px] font-semibold transition-colors " +
        (active ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")
      }
    >
      {children}
    </button>
  )
}
