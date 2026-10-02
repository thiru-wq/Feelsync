import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, Smile, MessageCircle, Activity, Clock, User, Mic, Wind, Leaf, BarChart2,
  Settings, HelpCircle, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const mainLinks = [
  { to: '/dashboard', icon: Home,          label: 'Home' },
  { to: '/mood',      icon: Smile,         label: 'Check-in' },
  { to: '/companion', icon: MessageCircle, label: 'AI Companion' },
  { to: '/breathing', icon: Wind,          label: 'Breathe' },
  { to: '/grounding', icon: Leaf,          label: 'Grounding' },
  { to: '/signals',   icon: Activity,      label: 'Wellness' },
  { to: '/history',   icon: Clock,         label: 'History' },
  { to: '/profile',   icon: User,          label: 'Profile' },
]

const bottomLinks = [
  { to: '/dashboard', icon: Home,          label: 'Home' },
  { to: '/mood',      icon: Smile,         label: 'Check-in' },
  { to: '/companion', icon: MessageCircle, label: 'Aura' },
  { to: '/breathing', icon: Wind,          label: 'Breathe' },
  { to: '/profile',   icon: User,          label: 'Profile' },
]

function NavItem({ to, icon: Icon, label, onClick, isActive }: {
  to: string
  icon: typeof Home
  label: string
  onClick?: () => void
  isActive: boolean
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-lavender-100 text-lavender-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      {label}
    </NavLink>
  )
}

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const close = () => setMobileOpen(false)

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <nav className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-gray-100 min-h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center shadow-md">
            <span className="text-white text-xl">💜</span>
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-900 tracking-tight">AuraWell</h1>
            <p className="text-xs text-gray-400">Wellness Companion</p>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-3 space-y-1">
          {mainLinks.map(link => (
            <NavItem
              key={link.to}
              {...link}
              isActive={location.pathname === link.to}
            />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="px-3 py-6 border-t border-gray-100 space-y-1">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <Settings size={18} />
            Settings
          </NavLink>
          <NavLink
            to="/help"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <HelpCircle size={18} />
            Help
          </NavLink>
        </div>
      </nav>

      {/* ── Mobile Top Header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-5 h-16">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center">
            <span className="text-white text-base">💜</span>
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">AuraWell</span>
        </div>
        <button
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* ── Mobile Slide-Down Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" onClick={close}>
          <div
            className="absolute top-16 left-0 right-0 bg-white border-b border-gray-100 px-4 py-4 flex flex-col gap-1 shadow-xl animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            {mainLinks.map(link => (
              <NavItem
                key={link.to}
                {...link}
                onClick={close}
                isActive={location.pathname === link.to}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex justify-around py-2.5 px-2 z-50">
        {bottomLinks.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                isActive ? 'text-lavender-600' : 'text-gray-400'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Spacer for mobile top header */}
      <div className="md:hidden h-16 shrink-0" />
    </>
  )
}
