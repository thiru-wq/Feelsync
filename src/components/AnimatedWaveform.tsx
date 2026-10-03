/**
 * AnimatedWaveform — premium waveform using Web Audio AnalyserNode data.
 * Falls back to CSS animation when no analyser is provided.
 * Does NOT modify any audio/speech logic — purely visual.
 */
import { useRef, useEffect } from 'react'

interface Props {
  /** Web Audio AnalyserNode — if provided, bars react to real audio */
  analyser?: AnalyserNode | null
  barCount?: number
  color?: string
  active?: boolean
  height?: number
}

const BAR_COUNT = 11

export function AnimatedWaveform({
  analyser,
  barCount = BAR_COUNT,
  color = '#8B5CF6',
  active = true,
  height = 40,
}: Props) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([])
  const rafRef  = useRef<number>(0)
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

  useEffect(() => {
    if (!analyser || !active) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    analyser.fftSize = 64
    const bufferLength = analyser.frequencyBinCount
    dataRef.current = new Uint8Array(new ArrayBuffer(bufferLength))

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)
      if (!dataRef.current) return
      analyser.getByteFrequencyData(dataRef.current)

      barsRef.current.forEach((bar, i) => {
        if (!bar || !dataRef.current) return
        const binIndex = Math.floor((i / barCount) * bufferLength)
        const value = dataRef.current[binIndex] / 255
        const h = Math.max(0.12, value)
        bar.style.transform = `scaleY(${h})`
        bar.style.opacity = String(0.4 + value * 0.6)
      })
    }
    draw()

    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser, active, barCount])

  return (
    <div
      className="flex items-center justify-center gap-[3px]"
      style={{ height }}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }, (_, i) => {
        // Sinusoidal height profile for visual interest
        const baseH = 8 + Math.sin(i * 0.65) * 10 + Math.sin(i * 1.3) * 6
        const dur   = 0.65 + (i % 4) * 0.15
        const delay = i * 0.07

        return (
          <span
            key={i}
            ref={el => { barsRef.current[i] = el }}
            className="rounded-full inline-block"
            style={{
              width: 3,
              height: Math.max(6, baseH),
              background: color,
              transformOrigin: 'center',
              // CSS fallback when no analyser
              animation: analyser ? 'none' : `wave-bar ${dur}s ease-in-out ${delay}s infinite`,
              transition: 'transform 60ms linear, opacity 60ms linear',
            }}
          />
        )
      })}
    </div>
  )
}
