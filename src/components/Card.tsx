import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className = '', onClick, hover = false }: CardProps) {
  const base = 'bg-white rounded-3xl shadow-sm border border-gray-100/50 p-6 transition-all duration-250'
  const hoverClass = hover ? 'card-hover cursor-pointer' : ''
  
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${base} ${hoverClass} text-left w-full ${className}`}
      >
        {children}
      </button>
    )
  }
  return <div className={`${base} ${hoverClass} ${className}`}>{children}</div>
}
