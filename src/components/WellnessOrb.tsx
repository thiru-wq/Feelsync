/**
 * WellnessOrb — 5-layer premium animated wellness core.
 * Layer 1: soft ambient radial glow
 * Layer 2: translucent blurred energy ring
 * Layer 3: slow-moving gradient ring
 * Layer 4: central violet/blue wellness core (breathing)
 * Layer 5: signal nodes with gentle float
 *
 * Pure CSS animations, no JS loops.
 */

interface OrbProps {
  size?: 'sm' | 'md' | 'lg'
  showSignals?: boolean
  activeSignal?: 'face' | 'voice' | 'eeg' | 'gsr' | null
  /** When true, signal nodes animate toward center (fusion mode) */
  fusionMode?: boolean
  className?: string
}

const SIGNAL_NODES = [
  { key: 'face',  label: 'Face',  icon: '👁',  angle: 315, bg: '#DBEAFE', border: '#BFDBFE', text: '#1D4ED8', glow: 'rgba(191,219,254,0.6)' },
  { key: 'voice', label: 'Voice', icon: '🎙',  angle: 45,  bg: '#EDE9FE', border: '#DDD6FE', text: '#6D28D9', glow: 'rgba(221,214,254,0.6)' },
  { key: 'eeg',   label: 'EEG',   icon: '🧠',  angle: 135, bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', glow: 'rgba(253,230,138,0.6)' },
  { key: 'gsr',   label: 'GSR',   icon: '⚡',  angle: 225, bg: '#D1FAE5', border: '#A7F3D0', text: '#065F46', glow: 'rgba(167,243,208,0.6)' },
]

const SIZES = {
  sm: { container: 128, orb: 52,  ring1: 80,  ring2: 104, ring3: 120, radius: 50, nodeSize: 28, fontSize: 9  },
  md: { container: 176, orb: 68,  ring1: 104, ring2: 140, ring3: 164, radius: 66, nodeSize: 34, fontSize: 10 },
  lg: { container: 240, orb: 92,  ring1: 140, ring2: 192, ring3: 224, radius: 90, nodeSize: 42, fontSize: 11 },
}

export function WellnessOrb({
  size = 'md',
  showSignals = true,
  activeSignal = null,
  fusionMode = false,
  className = '',
}: OrbProps) {
  const s = SIZES[size]
  const half = s.container / 2

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: s.container, height: s.container }}
      aria-hidden="true"
    >
      {/* ── Layer 1: Ambient radial glow ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: s.ring3,
          height: s.ring3,
          background: 'radial-gradient(circle, rgba(167,139,250,0.28) 0%, rgba(139,92,246,0.08) 55%, transparent 75%)',
          filter: 'blur(14px)',
          animation: 'glow-ring 5s ease-in-out infinite',
        }}
      />

      {/* ── Layer 2: Translucent blurred energy ring ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: s.ring2,
          height: s.ring2,
          background: 'transparent',
          border: '1.5px solid rgba(167,139,250,0.30)',
          boxShadow: 'inset 0 0 16px rgba(139,92,246,0.06), 0 0 16px rgba(139,92,246,0.08)',
          backdropFilter: 'blur(1px)',
          animation: 'gradient-ring 16s linear infinite',
        }}
      />

      {/* ── Layer 3: Gradient ring ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: s.ring1,
          height: s.ring1,
          background: 'conic-gradient(from 0deg, rgba(139,92,246,0) 0%, rgba(167,139,250,0.55) 30%, rgba(196,181,253,0.75) 50%, rgba(167,139,250,0.55) 70%, rgba(139,92,246,0) 100%)',
          animation: 'gradient-ring 10s linear infinite',
          opacity: 0.65,
        }}
      />

      {/* ── Layer 4: Central wellness core ── */}
      <div
        className="absolute rounded-3xl flex items-center justify-center z-10"
        style={{
          width: s.orb,
          height: s.orb,
          background: fusionMode
            ? 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 40%, #4F46E5 100%)'
            : 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)',
          boxShadow: fusionMode
            ? '0 0 48px 16px rgba(139,92,246,0.40), 0 8px 32px rgba(109,40,217,0.30)'
            : '0 0 32px 8px rgba(139,92,246,0.22), 0 6px 24px rgba(109,40,217,0.20)',
          animation: fusionMode
            ? 'fusion-pulse 1.2s cubic-bezier(0.16,1,0.3,1) both, orb-breathe 4.5s ease-in-out 1.2s infinite'
            : 'orb-breathe 4.5s ease-in-out infinite',
        }}
      >
        <span style={{ fontSize: s.orb * 0.38 }}>💜</span>
      </div>

      {/* ── Layer 5: Signal nodes ── */}
      {showSignals && SIGNAL_NODES.map((node, i) => {
        const rad = (node.angle * Math.PI) / 180
        const x = Math.cos(rad) * s.radius
        const y = Math.sin(rad) * s.radius
        const isActive = activeSignal === node.key

        return (
          <div
            key={node.key}
            className="absolute flex flex-col items-center z-20"
            style={{
              left: half + x - s.nodeSize / 2,
              top:  half + y - s.nodeSize / 2 - 6,
              animation: fusionMode
                ? `signal-flow-in 0.8s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s both`
                : `float-gentle ${6 + i * 0.7}s ease-in-out ${i * 0.5}s infinite`,
              ['--sx' as string]: `${-x * 0.9}px`,
              ['--sy' as string]: `${-y * 0.9}px`,
            }}
          >
            <div
              className="rounded-2xl flex items-center justify-center"
              style={{
                width: s.nodeSize,
                height: s.nodeSize,
                background: node.bg,
                border: `1.5px solid ${node.border}`,
                boxShadow: isActive
                  ? `0 0 16px 4px ${node.glow}, 0 4px 12px rgba(0,0,0,0.08)`
                  : `0 4px 12px rgba(0,0,0,0.06)`,
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 300ms cubic-bezier(0.22,1,0.36,1), box-shadow 300ms ease',
                fontSize: s.nodeSize * 0.48,
              }}
            >
              {node.icon}
            </div>
            <span
              className="font-semibold rounded-full px-1.5 py-0.5 mt-0.5"
              style={{
                fontSize: s.fontSize,
                color: node.text,
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(4px)',
                lineHeight: 1.2,
              }}
            >
              {node.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
