/**
 * PageTransition — wraps screen content with cinematic entrance.
 * Replaces the animate-page-in class with a component for consistency.
 */
import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  delay?: number
}

export function PageTransition({ children, className = '', delay = 0 }: Props) {
  return (
    <div
      className={className}
      style={{
        animation: `page-enter 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
      }}
    >
      {children}
    </div>
  )
}
