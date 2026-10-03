import { useEffect, useState, useRef } from 'react'

const SESSION_KEY = 'fs_splash_shown'

interface Props { onDone: () => void }

// Signal nodes with emergence vectors and convergence targets
const SIGNALS = [
  { label: 'Face',  color: '#BFDBFE', textColor: '#1D4ED8', ex: '-72px', ey: '-56px', cx: '12px',  cy: '12px',  delay: 0 },
  { label: 'Voice', color: '#DDD6FE', textColor: '#6D28D9', ex: '72px',  ey: '-56px', cx: '-12px', cy: '12px',  delay: 0.18 },
  { label: 'EEG',   color: '#FDE68A', textColor: '#92400E', ex: '-72px', ey: '56px',  cx: '12px',  cy: '-12px', delay: 0.32 },
  { label: 'GSR',   color: '#A7F3D0', textColor: '#065F46', ex: '72px',  ey: '56px',  cx: '-12px', cy: '-12px', delay: 0.46 },
]

// Ambient particles — purely decorative
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size: 2 + (i % 3),
  angle: (i / 14) * 360,
  radius: 60 + (i % 4) * 18,
  duration: 6 + (i % 5) * 1.4,
  delay: (i * 0.3) % 3,
  opacity: 0.15 + (i % 4) * 0.08,
}))

type Phase = 'ambient' | 'core' | 'orb' | 'signals' | 'converge' | 'logo' | 'tagline' | 'out'

export function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('ambient')
  const doneRef = useRef(false)

  const prefersReduced = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current

  useEffect(() => {
    if (prefersReduced) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onDone()
      return
    }

    // Cinematic timeline
    const timers = [
      setTimeout(() => setPhase('core'),     200),
      setTimeout(() => setPhase('orb'),      500),
      setTimeout(() => setPhase('signals'),  900),
      setTimeout(() => setPhase('converge'), 1600),
      setTimeout(() => setPhase('logo'),     2000),
      setTimeout(() => setPhase('tagline'),  2300),
      setTimeout(() => setPhase('out'),      2900),
      setTimeout(() => {
        if (!doneRef.current) {
          doneRef.current = true
          sessionStorage.setItem(SESSION_KEY, '1')
          onDone()
        }
      }, 3450),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone, prefersReduced])

  const isConverging = phase === 'converge' || phase === 'logo' || phase === 'tagline' || phase === 'out'
  const showSignals  = phase === 'signals' || isConverging
  const showLogo     = phase === 'logo' || phase === 'tagline' || phase === 'out'
  const showTagline  = phase === 'tagline' || phase === 'out'
  const isOut        = phase === 'out'

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #FAFAF8 0%, #F5F3FF 40%, #EFF6FF 70%, #ECFDF5 100%)',
        animation: isOut ? 'splash-out 0.55s cubic-bezier(0.22,1,0.36,1) both' : undefined,
      }}
      aria-hidden="true"
    >
      {/* ── Layer 1: Ambient background blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: '60vw', height: '60vw',
            top: '-15vw', left: '-10vw',
            background: 'radial-gradient(circle, rgba(196,181,253,0.22) 0%, transparent 70%)',
            animation: 'ambient-drift 14s ease-in-out infinite',
            animationDelay: '0s',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '50vw', height: '50vw',
            bottom: '-10vw', right: '-8vw',
            background: 'radial-gradient(circle, rgba(167,243,208,0.18) 0%, transparent 70%)',
            animation: 'ambient-drift 16s ease-in-out infinite reverse',
            animationDelay: '-5s',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '40vw', height: '40vw',
            top: '30%', right: '5%',
            background: 'radial-gradient(circle, rgba(191,219,254,0.15) 0%, transparent 70%)',
            animation: 'ambient-drift 18s ease-in-out infinite',
            animationDelay: '-8s',
          }}
        />
      </div>

      {/* ── Layer 2: Ambient particles ── */}
      {(phase !== 'ambient') && (
        <div className="absolute inset-0 pointer-events-none" style={{ perspective: '600px' }}>
          {PARTICLES.map(p => {
            const rad = (p.angle * Math.PI) / 180
            const x = Math.cos(rad) * p.radius
            const y = Math.sin(rad) * p.radius * 0.6
            return (
              <div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  width: p.size, height: p.size,
                  left: '50%', top: '50%',
                  marginLeft: -p.size / 2, marginTop: -p.size / 2,
                  background: p.id % 3 === 0 ? '#C4B5FD' : p.id % 3 === 1 ? '#BFDBFE' : '#A7F3D0',
                  transform: `translate(${x}px, ${y}px)`,
                  animation: `particle-twinkle ${p.duration}s ease-in-out infinite`,
                  animationDelay: `${p.delay}s`,
                  opacity: p.opacity,
                }}
              />
            )
          })}
        </div>
      )}

      {/* ── Layer 3: Core orb system ── */}
      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>

        {/* Ambient glow — Layer 1 */}
        {phase !== 'ambient' && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(167,139,250,0.30) 0%, rgba(139,92,246,0.10) 50%, transparent 70%)',
              filter: 'blur(20px)',
              animation: 'splash-ambient-in 0.6s cubic-bezier(0.22,1,0.36,1) both, glow-ring 5s ease-in-out 0.6s infinite',
            }}
          />
        )}

        {/* Energy ring — Layer 2 */}
        {(phase === 'orb' || showSignals || showLogo) && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 160, height: 160,
              background: 'transparent',
              border: '1.5px solid rgba(167,139,250,0.35)',
              boxShadow: 'inset 0 0 20px rgba(139,92,246,0.08), 0 0 20px rgba(139,92,246,0.10)',
              animation: 'splash-orb-expand 0.5s cubic-bezier(0.22,1,0.36,1) both, gradient-ring 12s linear 0.5s infinite',
            }}
          />
        )}

        {/* Gradient ring — Layer 3 */}
        {(phase === 'orb' || showSignals || showLogo) && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 140, height: 140,
              background: 'conic-gradient(from 0deg, rgba(139,92,246,0) 0%, rgba(167,139,250,0.5) 30%, rgba(196,181,253,0.7) 50%, rgba(167,139,250,0.5) 70%, rgba(139,92,246,0) 100%)',
              borderRadius: '50%',
              animation: 'splash-orb-expand 0.5s cubic-bezier(0.22,1,0.36,1) both, gradient-ring 8s linear 0.5s infinite',
              animationDelay: '0s, 0.5s',
              opacity: 0.6,
            }}
          />
        )}

        {/* Core violet orb — Layer 4 */}
        {phase !== 'ambient' && (
          <div
            className="absolute rounded-3xl flex items-center justify-center z-10"
            style={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)',
              boxShadow: '0 0 32px 8px rgba(139,92,246,0.30), 0 8px 32px rgba(109,40,217,0.25)',
              animation: phase === 'core'
                ? 'splash-core-in 0.7s cubic-bezier(0.34,1.56,0.64,1) both'
                : isConverging
                ? 'fusion-pulse 1.2s cubic-bezier(0.16,1,0.3,1) both'
                : 'orb-breathe 4.5s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: 32 }}>💜</span>
          </div>
        )}

        {/* Radial pulse on convergence */}
        {isConverging && (
          <>
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 80, height: 80,
                border: '2px solid rgba(139,92,246,0.5)',
                animation: 'radial-pulse 1.4s cubic-bezier(0.16,1,0.3,1) both',
              }}
            />
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 80, height: 80,
                border: '1px solid rgba(167,139,250,0.35)',
                animation: 'radial-pulse 1.4s cubic-bezier(0.16,1,0.3,1) 0.2s both',
              }}
            />
          </>
        )}

        {/* Signal nodes — Layer 5 */}
        {SIGNALS.map((sig) => (
          <div
            key={sig.label}
            className="absolute flex flex-col items-center gap-1 z-20"
            style={{
              animation: !showSignals
                ? 'none'
                : isConverging
                ? `splash-signal-converge 0.55s cubic-bezier(0.22,1,0.36,1) ${sig.delay}s both`
                : `splash-signal-emerge 0.6s cubic-bezier(0.34,1.56,0.64,1) ${sig.delay}s both`,
              ['--ex' as string]: sig.ex,
              ['--ey' as string]: sig.ey,
              ['--cx' as string]: sig.cx,
              ['--cy' as string]: sig.cy,
              opacity: showSignals ? undefined : 0,
            }}
          >
            <div
              className="rounded-2xl flex items-center justify-center shadow-md"
              style={{
                width: 40, height: 40,
                background: sig.color,
                border: `1.5px solid rgba(255,255,255,0.8)`,
                boxShadow: `0 4px 16px rgba(0,0,0,0.08), 0 0 12px ${sig.color}80`,
              }}
            >
              <span style={{ fontSize: 18 }}>
                {sig.label === 'Face' ? '👁' : sig.label === 'Voice' ? '🎙' : sig.label === 'EEG' ? '🧠' : '⚡'}
              </span>
            </div>
            <span
              className="font-semibold rounded-full px-2 py-0.5"
              style={{
                fontSize: 10,
                color: sig.textColor,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(4px)',
              }}
            >
              {sig.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Logo + Tagline ── */}
      <div className="mt-8 text-center" style={{ minHeight: 80 }}>
        {showLogo && (
          <h1
            className="font-bold text-gray-900 tracking-tight"
            style={{
              fontSize: 32,
              animation: 'splash-logo-reveal 0.6s cubic-bezier(0.22,1,0.36,1) both',
            }}
          >
            FeelSync
          </h1>
        )}
        {showTagline && (
          <p
            className="font-semibold text-violet-500 uppercase mt-2"
            style={{
              fontSize: 11,
              letterSpacing: '0.15em',
              animation: 'splash-tagline-in 0.5s cubic-bezier(0.22,1,0.36,1) both',
            }}
          >
            Understand · Support · Feel Better
          </p>
        )}
      </div>
    </div>
  )
}

export function shouldShowSplash(): boolean {
  return !sessionStorage.getItem(SESSION_KEY)
}
