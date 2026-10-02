import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './store'
import { Nav } from './components/Nav'
import { Landing } from './screens/Landing'
import { Onboarding } from './screens/Onboarding'
import { Dashboard } from './screens/Dashboard'
import { MoodCheckin } from './screens/MoodCheckin'
import { Companion } from './screens/Companion'
import { Breathing } from './screens/Breathing'
import { Grounding } from './screens/Grounding'
import { Signals } from './screens/Signals'
import { Summary } from './screens/Summary'
import { History } from './screens/History'
import { VoiceAssistant } from './screens/VoiceAssistant'
import { Profile } from './screens/Profile'

function AppShell() {
  return (
    <div className="flex min-h-screen">
      <Nav />
      <div className="flex-1 flex flex-col bg-[#faf9f7] overflow-y-auto">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mood"      element={<MoodCheckin />} />
          <Route path="/companion" element={<Companion />} />
          <Route path="/breathing" element={<Breathing />} />
          <Route path="/grounding" element={<Grounding />} />
          <Route path="/signals"   element={<Signals />} />
          <Route path="/summary"   element={<Summary />} />
          <Route path="/history"   element={<History />} />
          <Route path="/voice"     element={<VoiceAssistant />} />
          <Route path="/profile"   element={<Profile />} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"           element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/*"          element={<AppShell />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
