import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, Smile, MessageCircle, Activity, Clock, User, Wind, Leaf,
  Settings, HelpCircle, Menu, X, Mic
} from 'lucide-react'
import { useState } from 'react'

const mainLinks = [
  { to: '/dashboard', icon: Home,          label: 'Home' },
  { to: '/voice',     icon: Mic,           label: 'Voice Agent' },
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
  { to: '/voice',     icon: Mic,           label: 'Voice' },
  { to: '/mood',      icon: Smile,         label: 'Check-in' },
  { to: '/companion', icon: MessageCircle, label: 'Companion' },
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-violet-50 text-violet-700 font-semibold border-l-2 border-violet-600 pl-[10px]'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 border-l-2 border-transparent pl-[10px]'
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
      <nav className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-gray-100 min-h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-sm">
            <span className="text-white text-base">💜</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 tracking-tight">FeelSync</h1>
            <p className="text-xs text-gray-400">Wellness Companion</p>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-3 space-y-0.5">
          {mainLinks.map(link => (
            <NavItem
              key={link.to}
              {...link}
              isActive={location.pathname === link.to}
            />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="px-3 py-5 border-t border-gray-100 space-y-0.5">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 pl-[10px] rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors border-l-2 border-transparent"
          >
            <Settings size={18} />
            Settings
          </NavLink>
          <NavLink
            to="/companion"
            className="flex items-center gap-3 px-3 py-2.5 pl-[10px] rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors border-l-2 border-transparent"
          >
            <HelpCircle size={18} />
            Help &amp; Support
          </NavLink>
        </div>
      </nav>

      {/* ── Mobile Top Header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-5 h-14 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-xs">
            <span className="text-white text-sm">💜</span>
          </div>
          <span className="font-bold text-base text-gray-900 tracking-tight">FeelSync</span>
        </div>
        <button
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile Slide-Down Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={close}>
          <div
            className="absolute top-14 left-0 right-0 bg-white border-b border-gray-100 px-4 py-3 flex flex-col gap-0.5 shadow-xl animate-fade-in"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 flex justify-around py-1.5 px-1 z-50 shadow-lg">
        {bottomLinks.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to
          const isVoice = to === '/voice'
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
                isActive
                  ? 'text-violet-700 font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              } ${isVoice && !isActive ? 'bg-violet-50 text-violet-600 rounded-xl px-3' : ''} ${isVoice && isActive ? 'bg-violet-100 rounded-xl px-3' : ''}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{label}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
