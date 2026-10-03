/**
 * FusionCore — animated signal stream convergence visualization.
 * Shows 4 signal streams flowing into the WellnessOrb.
 * Pure CSS animations, no JS loops.
 */
import { WellnessOrb } from './WellnessOrb'

interface Props {
  active?: boolean
  completed?: boolean
}

const STREAMS = [
  { label: 'Face',  color: '#BFDBFE', angle: 315, icon: '👁'  },
  { label: 'Voice', color: '#DDD6FE', angle: 45,  icon: '🎙'  },
  { label: 'EEG',   color: '#FDE68A', angle: 135, icon: '🧠'  },
  { label: 'GSR',   color: '#A7F3D0', angle: 225, icon: '⚡'  },
]

// Tiny particle dot along a stream path
function StreamParticle({ angle, color, delay, distance }: {
  angle: number; color: string; delay: number; distance: number
}) {
  const rad = (angle * Math.PI) / 180
  const sx = Math.cos(rad) * distance
  const sy = Math.sin(rad) * distance

  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 5, height: 5,
        left: '50%', top: '50%',
        marginLeft: -2.5, marginTop: -2.5,
        background: color,
        boxShadow: `0 0 6px ${color}`,
        ['--sx' as string]: `${sx}px`,
        ['--sy' as string]: `${sy}px`,
        animation: `signal-flow-in 1.6s cubic-bezier(0.22,1,0.36,1) ${delay}s infinite`,
        opacity: 0,
      }}
    />
  )
}

export function FusionCore({ active = false, completed = false }: Props) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Signal stream particles */}
      {active && STREAMS.map((stream, si) =>
        [0, 0.4, 0.8].map((offset, pi) => (
          <StreamParticle
            key={`${si}-${pi}`}
            angle={stream.angle}
            color={stream.color}
            delay={si * 0.2 + offset}
            distance={72}
          />
        ))
      )}

      {/* Central orb */}
      <WellnessOrb
        size="md"
        showSignals={true}
        fusionMode={completed}
      />

      {/* Completion radial rings */}
      {completed && (
        <>
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 176, height: 176,
              border: '1.5px solid rgba(139,92,246,0.4)',
              animation: 'radial-pulse 2s cubic-bezier(0.16,1,0.3,1) both',
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 176, height: 176,
              border: '1px solid rgba(167,139,250,0.25)',
              animation: 'radial-pulse 2s cubic-bezier(0.16,1,0.3,1) 0.3s both',
            }}
          />
        </>
      )}
    </div>
  )
}
