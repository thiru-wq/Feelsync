/**
 * signalProvider.ts
 *
 * Abstraction layer for wellness sensor data.
 *
 * DEMO MODE: values are simulated with a bounded random walk.
 *
 * TO INTEGRATE REAL HARDWARE:
 *   Replace `SimulatedSignalProvider` with a class that reads from
 *   your EEG/GSR device (e.g. via WebSocket, AWS IoT, or Web Bluetooth)
 *   while keeping the same `SignalProvider` interface.
 *   The Signals screen imports only the interface + `createSignalProvider()`,
 *   so the UI requires zero changes.
 */

export interface SignalReading {
  /** Millisecond timestamp of this reading */
  timestamp: number
  /** EEG-derived calmness index 0–100 (higher = calmer) */
  eegCalmness: number
  /** EEG-derived focus/engagement index 0–100 (higher = more focused) */
  eegFocus: number
  /** GSR-derived arousal index 0–100 (higher = more aroused/activated) */
  gsrArousal: number
  /** GSR-derived relaxation index 0–100 (higher = more relaxed) */
  gsrRelaxation: number
}

export interface SignalProvider {
  /** Start streaming; calls `onReading` each interval */
  start(onReading: (r: SignalReading) => void): void
  /** Stop streaming and clean up */
  stop(): void
  /** Human-readable source label shown in the UI */
  readonly sourceLabel: string
  /** Whether this is simulated (drives the demo disclaimer) */
  readonly isSimulated: boolean
}

// ─── Bounded random walk helpers ─────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

/** Small nudge that keeps values in a realistic wellness range */
function nudge(v: number, lo: number, hi: number, step = 3): number {
  return clamp(+(v + (Math.random() - 0.5) * step).toFixed(1), lo, hi)
}

// ─── Simulated provider ───────────────────────────────────────────────────────

class SimulatedSignalProvider implements SignalProvider {
  readonly sourceLabel = 'Demo Sensor'
  readonly isSimulated = true

  private timer: ReturnType<typeof setInterval> | null = null

  // Seed values in a calm-ish resting range
  private state: Omit<SignalReading, 'timestamp'> = {
    eegCalmness:    68,
    eegFocus:       55,
    gsrArousal:     32,
    gsrRelaxation:  70,
  }

  start(onReading: (r: SignalReading) => void) {
    // Emit immediately so the UI has data before the first interval fires
    onReading({ ...this.state, timestamp: Date.now() })

    this.timer = setInterval(() => {
      this.state = {
        eegCalmness:   nudge(this.state.eegCalmness,   30, 95),
        eegFocus:      nudge(this.state.eegFocus,       20, 90),
        gsrArousal:    nudge(this.state.gsrArousal,     10, 70),
        gsrRelaxation: nudge(this.state.gsrRelaxation,  25, 95),
      }
      onReading({ ...this.state, timestamp: Date.now() })
    }, 2000)
  }

  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Returns the active signal provider.
 * Swap `SimulatedSignalProvider` here for a real hardware provider.
 */
export function createSignalProvider(): SignalProvider {
  return new SimulatedSignalProvider()
}
