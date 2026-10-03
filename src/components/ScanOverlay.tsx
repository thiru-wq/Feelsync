/**
 * ScanOverlay — premium biometric scanning HUD.
 * Visual only — does NOT touch camera/detection logic.
 */
import { type ReactNode } from 'react'

interface Props {
  active: boolean
  confirmed?: boolean
  absent?: boolean
  children?: ReactNode
}

// Corner bracket element
function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isTop    = pos === 'tl' || pos === 'tr'
  const isLeft   = pos === 'tl' || pos === 'bl'
  const borderT  = isTop  ? '2px solid' : 'none'
  const borderB  = !isTop ? '2px solid' : 'none'
  const borderL  = isLeft  ? '2px solid' : 'none'
  const borderR  = !isLeft ? '2px solid' : 'none'
  const top    = isTop  ? 0 : undefined
  const bottom = !isTop ? 0 : undefined
  const left   = isLeft  ? 0 : undefined
  const right  = !isLeft ? 0 : undefined

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: 20, height: 20,
        top, bottom, left, right,
        borderTop: borderT, borderBottom: borderB,
        borderLeft: borderL, borderRight: borderR,
        borderColor: 'rgba(139,92,246,0.7)',
        borderRadius: pos === 'tl' ? '4px 0 0 0' : pos === 'tr' ? '0 4px 0 0' : pos === 'bl' ? '0 0 0 4px' : '0 0 4px 0',
        animation: 'hud-corner-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        animationDelay: pos === 'tl' ? '0ms' : pos === 'tr' ? '60ms' : pos === 'bl' ? '120ms' : '180ms',
      }}
    />
  )
}

export function ScanOverlay({ active, confirmed, absent, children }: Props) {
  const frameColor = confirmed
    ? 'rgba(52,211,153,0.7)'
    : absent
    ? 'rgba(251,191,36,0.6)'
    : active
    ? 'rgba(139,92,246,0.5)'
    : 'rgba(255,255,255,0.25)'

  const frameShadow = confirmed
    ? '0 0 20px rgba(52,211,153,0.35)'
    : active
    ? '0 0 20px rgba(139,92,246,0.25)'
    : 'none'

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-4"
    >
      {/* Face guide oval */}
      <div
        className="relative flex flex-col items-center justify-between p-3"
        style={{
          width: '55%',
          paddingBottom: '70%',
          maxWidth: 220,
          maxHeight: 280,
          borderRadius: '45%',
          border: `2px solid ${frameColor}`,
          boxShadow: frameShadow,
          transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
          position: 'relative',
        }}
      >
        {/* Corner HUD brackets */}
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />

        {/* Scan line — only during active scanning */}
        {active && !confirmed && !absent && (
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              height: 1.5,
              background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.8) 30%, rgba(167,139,250,1) 50%, rgba(139,92,246,0.8) 70%, transparent 100%)',
              boxShadow: '0 0 8px rgba(139,92,246,0.6)',
              animation: 'scan-sweep 2.2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {children}
    </div>
  )
}
