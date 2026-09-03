export type Vec2 = [number, number] // x, z on the board plane

export type ComponentType =
  | "ic"
  | "resistor"
  | "led"
  | "capacitor"
  | "battery"
  | "switch"

export interface Pad {
  id: string
  pos: Vec2
  label: string
}

export interface Slot {
  id: string
  pos: Vec2
}

export interface BoardComponent {
  id: string
  type: ComponentType
  label: string
  /** slot the component MUST end up in to be correct */
  correctSlot: string
  /** slot the component starts in (may be wrong on purpose) */
  startSlot: string
  color?: string
}

/** an unordered pair of pad ids that should be wired together */
export type Net = [string, string]

export interface Wire {
  a: string
  b: string
}

export interface Level {
  id: number
  name: string
  brief: string
  boardSize: [number, number] // width (x), depth (z)
  pads: Pad[]
  slots: Slot[]
  components: BoardComponent[]
  /** the correct netlist the player must reproduce */
  requiredNets: Net[]
  /** premade wiring — contains correct wires, wrong wires, and omissions */
  startWires: Wire[]
}

export function netKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`
}

/** Friendly display names + default colors for each part type. */
export const PART_DEFS: {
  type: ComponentType
  label: string
  color?: string
}[] = [
  { type: "resistor", label: "resistor" },
  { type: "led", label: "led", color: "#ef4444" },
  { type: "battery", label: "battery" },
  { type: "capacitor", label: "capacitor", color: "#2563eb" },
  { type: "ic", label: "chip" },
  { type: "switch", label: "switch" },
]

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Blink Circuit",
    brief:
      "A simple LED circuit. Two parts sit in the wrong spots and one wire is wrong. Put every part where it belongs, delete the bad wire, and add the missing ones.",
    boardSize: [12, 8],
    pads: [
      { id: "l1_vplus", pos: [-4.6, 2.6], label: "V+" },
      { id: "l1_r_a", pos: [-1.4, 2.6], label: "R1a" },
      { id: "l1_r_b", pos: [1.4, 2.6], label: "R1b" },
      { id: "l1_d_a", pos: [4.6, 2.6], label: "D+" },
      { id: "l1_d_k", pos: [4.6, -2.6], label: "D-" },
      { id: "l1_gnd", pos: [-4.6, -2.6], label: "GND" },
    ],
    slots: [
      { id: "l1_s1", pos: [-3.4, 0.2] },
      { id: "l1_s2", pos: [0, 0.2] },
      { id: "l1_s3", pos: [3.4, 0.2] },
    ],
    components: [
      { id: "l1_bat", type: "battery", label: "battery", correctSlot: "l1_s1", startSlot: "l1_s2" },
      { id: "l1_r1", type: "resistor", label: "resistor", correctSlot: "l1_s2", startSlot: "l1_s1" },
      { id: "l1_d1", type: "led", label: "led", correctSlot: "l1_s3", startSlot: "l1_s3", color: "#ef4444" },
    ],
    requiredNets: [
      ["l1_vplus", "l1_r_a"],
      ["l1_r_b", "l1_d_a"],
      ["l1_d_k", "l1_gnd"],
    ],
    startWires: [
      { a: "l1_vplus", b: "l1_r_a" }, // correct
      { a: "l1_r_b", b: "l1_d_k" }, // WRONG (should reach D+)
      // missing: r_b -> d_a  and  d_k -> gnd
    ],
  },
  {
    id: 2,
    name: "Dual Indicator",
    brief:
      "Two LEDs share a battery through a filter capacitor. Three parts are swapped and several wires are crossed. Rebuild the correct wiring.",
    boardSize: [13, 9],
    pads: [
      { id: "l2_vplus", pos: [-5.2, 3.0], label: "V+" },
      { id: "l2_ra", pos: [-2.4, 3.0], label: "R1a" },
      { id: "l2_rb", pos: [0.4, 3.0], label: "R1b" },
      { id: "l2_r2a", pos: [-2.4, -3.0], label: "R2a" },
      { id: "l2_r2b", pos: [0.4, -3.0], label: "R2b" },
      { id: "l2_d1", pos: [3.2, 3.0], label: "D1" },
      { id: "l2_d2", pos: [3.2, -3.0], label: "D2" },
      { id: "l2_cap", pos: [-5.2, 0 ], label: "C+" },
      { id: "l2_gnd", pos: [5.2, 0], label: "GND" },
    ],
    slots: [
      { id: "l2_s1", pos: [-3.8, 0.6] },
      { id: "l2_s2", pos: [-1.2, 0.6] },
      { id: "l2_s3", pos: [1.4, 0.6] },
      { id: "l2_s4", pos: [-1.2, -1.4] },
      { id: "l2_s5", pos: [1.4, -1.4] },
    ],
    components: [
      { id: "l2_bat", type: "battery", label: "battery", correctSlot: "l2_s1", startSlot: "l2_s3" },
      { id: "l2_r1", type: "resistor", label: "resistor 1", correctSlot: "l2_s2", startSlot: "l2_s4" },
      { id: "l2_r2", type: "resistor", label: "resistor 2", correctSlot: "l2_s4", startSlot: "l2_s2" },
      { id: "l2_cap", type: "capacitor", label: "capacitor", correctSlot: "l2_s3", startSlot: "l2_s1", color: "#2563eb" },
      { id: "l2_led1", type: "led", label: "led", correctSlot: "l2_s5", startSlot: "l2_s5", color: "#22c55e" },
    ],
    requiredNets: [
      ["l2_vplus", "l2_ra"],
      ["l2_vplus", "l2_r2a"],
      ["l2_rb", "l2_d1"],
      ["l2_r2b", "l2_d2"],
      ["l2_d1", "l2_gnd"],
      ["l2_d2", "l2_gnd"],
      ["l2_vplus", "l2_cap"],
    ],
    startWires: [
      { a: "l2_vplus", b: "l2_ra" }, // correct
      { a: "l2_rb", b: "l2_d2" }, // WRONG (crossed)
      { a: "l2_r2b", b: "l2_d1" }, // WRONG (crossed)
      { a: "l2_d1", b: "l2_gnd" }, // correct
      { a: "l2_vplus", b: "l2_cap" }, // correct
      // missing: vplus->r2a, rb->d1, r2b->d2, d2->gnd
    ],
  },
  {
    id: 3,
    name: "Logic Driver",
    brief:
      "A chip drives an LED through a switch. The board came with mixed-up parts and a tangle of bad wires. Get it working.",
    boardSize: [14, 10],
    pads: [
      { id: "l3_vcc", pos: [-5.8, 3.4], label: "VCC" },
      { id: "l3_in", pos: [-5.8, 0], label: "IN" },
      { id: "l3_gnd", pos: [-5.8, -3.4], label: "GND" },
      { id: "l3_u_vcc", pos: [-1.6, 3.4], label: "U1v" },
      { id: "l3_u_in", pos: [-1.6, 1.2], label: "U1i" },
      { id: "l3_u_out", pos: [-1.6, -1.2], label: "U1o" },
      { id: "l3_u_gnd", pos: [-1.6, -3.4], label: "U1g" },
      { id: "l3_sw_a", pos: [2.2, 1.2], label: "SWa" },
      { id: "l3_sw_b", pos: [2.2, -1.2], label: "SWb" },
      { id: "l3_r_a", pos: [5.6, 3.4], label: "Ra" },
      { id: "l3_r_b", pos: [5.6, 1.0], label: "Rb" },
      { id: "l3_led", pos: [5.6, -1.4], label: "D+" },
      { id: "l3_led_k", pos: [5.6, -3.4], label: "D-" },
    ],
    slots: [
      { id: "l3_s1", pos: [-3.8, 0] },
      { id: "l3_s2", pos: [-0.2, 0] },
      { id: "l3_s3", pos: [2.2, 0] },
      { id: "l3_s4", pos: [4.0, 1.4] },
      { id: "l3_s5", pos: [4.0, -1.8] },
      { id: "l3_s6", pos: [-3.8, -2.6] },
    ],
    components: [
      { id: "l3_bat", type: "battery", label: "battery", correctSlot: "l3_s1", startSlot: "l3_s4" },
      { id: "l3_ic", type: "ic", label: "chip", correctSlot: "l3_s2", startSlot: "l3_s2" },
      { id: "l3_sw", type: "switch", label: "switch", correctSlot: "l3_s3", startSlot: "l3_s6" },
      { id: "l3_r1", type: "resistor", label: "resistor", correctSlot: "l3_s4", startSlot: "l3_s1" },
      { id: "l3_led", type: "led", label: "led", correctSlot: "l3_s5", startSlot: "l3_s5", color: "#f59e0b" },
      { id: "l3_cap", type: "capacitor", label: "capacitor", correctSlot: "l3_s6", startSlot: "l3_s3", color: "#2563eb" },
    ],
    requiredNets: [
      ["l3_vcc", "l3_u_vcc"],
      ["l3_in", "l3_u_in"],
      ["l3_gnd", "l3_u_gnd"],
      ["l3_u_out", "l3_sw_a"],
      ["l3_sw_b", "l3_r_a"],
      ["l3_r_b", "l3_led"],
      ["l3_led_k", "l3_gnd"],
    ],
    startWires: [
      { a: "l3_vcc", b: "l3_u_vcc" }, // correct
      { a: "l3_in", b: "l3_u_out" }, // WRONG
      { a: "l3_gnd", b: "l3_u_gnd" }, // correct
      { a: "l3_u_in", b: "l3_sw_a" }, // WRONG
      { a: "l3_sw_b", b: "l3_led" }, // WRONG
      { a: "l3_r_b", b: "l3_led_k" }, // WRONG
      // missing several correct nets
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Sandbox / "build your own" board                                          */
/* -------------------------------------------------------------------------- */

export const SANDBOX_BOARD: [number, number] = [16, 11]

/** Eight open footprints laid out in a 4 x 2 grid where parts snap. */
export const SANDBOX_SLOTS: Slot[] = [
  { id: "sb_s1", pos: [-5.4, 1.6] },
  { id: "sb_s2", pos: [-1.8, 1.6] },
  { id: "sb_s3", pos: [1.8, 1.6] },
  { id: "sb_s4", pos: [5.4, 1.6] },
  { id: "sb_s5", pos: [-5.4, -1.6] },
  { id: "sb_s6", pos: [-1.8, -1.6] },
  { id: "sb_s7", pos: [1.8, -1.6] },
  { id: "sb_s8", pos: [5.4, -1.6] },
]

/** A rail of solder pads along the top and bottom you can freely wire. */
export const SANDBOX_PADS: Pad[] = [
  ...[-6, -3.6, -1.2, 1.2, 3.6, 6].map((x, i) => ({
    id: `sb_t${i + 1}`,
    pos: [x, 4.4] as Vec2,
    label: `T${i + 1}`,
  })),
  ...[-6, -3.6, -1.2, 1.2, 3.6, 6].map((x, i) => ({
    id: `sb_b${i + 1}`,
    pos: [x, -4.4] as Vec2,
    label: `B${i + 1}`,
  })),
]

/** Build a Level-shaped object for the sandbox from the current parts. */
export function makeSandboxLevel(components: BoardComponent[]): Level {
  return {
    id: 0,
    name: "Sandbox",
    brief: "",
    boardSize: SANDBOX_BOARD,
    pads: SANDBOX_PADS,
    slots: SANDBOX_SLOTS,
    components,
    requiredNets: [],
    startWires: [],
  }
}
