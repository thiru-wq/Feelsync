import { useState } from 'react'
import { useApp } from '../store'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CheckCircle, User, Mic, ShieldCheck, Activity, Trash2 } from 'lucide-react'

const GOALS = [
  'Manage stress', 'Improve sleep', 'Build resilience',
  'Practice mindfulness', 'Track my mood', 'Reduce anxiety',
]

export function Profile() {
  const { profile, setProfile, moodHistory, activities } = useApp()
  const [name, setName]   = useState(profile.name)
  const [goals, setGoals] = useState<string[]>(profile.goals)
  const [saved, setSaved] = useState(false)

  // Voice Settings State
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [voiceSpeed, setVoiceSpeed] = useState('1.0')
  const [sensorSimulated, setSensorSimulated] = useState(true)

  function toggleGoal(g: string) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  function save() {
    setProfile({ ...profile, name: name.trim() || 'Friend', goals })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function resetData() {
    if (!confirm('This will permanently clear all your FeelSync local data. Are you sure?')) return
    localStorage.clear()
    window.location.href = '/'
  }

  const initials = (profile.name || 'F').slice(0, 2).toUpperCase()

  return (
    <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-xl mx-auto w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 tracking-tight">Profile &amp; Settings</h1>

      {/* ── User Avatar & Summary ── */}
      <div className="flex items-center gap-4 mb-6 bg-white border border-gray-150 rounded-3xl p-5 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-xl select-none shadow-md">
          {profile.name ? initials : <User size={28} className="text-white" />}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg leading-tight">{profile.name || 'Friend'}</p>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {moodHistory.length} check-in{moodHistory.length !== 1 ? 's' : ''} ·{' '}
            {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} logged
          </p>
        </div>
      </div>

      {/* ── Personal Info ── */}
      <Card className="mb-4">
        <label htmlFor="profile-name" className="block text-sm font-semibold text-gray-800 mb-2">
          Your Preferred Name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="What should FeelSync call you?"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50/50 focus:bg-white transition-colors"
        />
      </Card>

      {/* ── Wellness Goals ── */}
      <Card className="mb-4">
        <p className="text-sm font-semibold text-gray-800 mb-1">Wellness Focus &amp; Goals</p>
        <p className="text-xs text-gray-400 mb-3">FeelSync tailors recommendations based on your selected priorities.</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map(g => (
            <button
              key={g}
              onClick={() => toggleGoal(g)}
              aria-pressed={goals.includes(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                goals.includes(g)
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Voice Agent Settings ── */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
            <Mic size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Voice Agent Configuration</h3>
            <p className="text-xs text-gray-400">Controls for browser text-to-speech responses</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Auto-speak AI responses</span>
            <button
              onClick={() => setAutoSpeak(a => !a)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                autoSpeak ? 'bg-violet-600' : 'bg-gray-200'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                autoSpeak ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Speech Speed</span>
            <select
              value={voiceSpeed}
              onChange={e => setVoiceSpeed(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1 bg-gray-50 font-medium"
            >
              <option value="0.8">0.8x (Relaxed)</option>
              <option value="1.0">1.0x (Normal)</option>
              <option value="1.2">1.2x (Faster)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Sensor Connections ── */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Sensor Connections</h3>
            <p className="text-xs text-gray-400">EEG &amp; GSR physiological indicators</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-700">Use Simulated Wearable Data</span>
          <button
            onClick={() => setSensorSimulated(s => !s)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              sensorSimulated ? 'bg-emerald-500' : 'bg-gray-200'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              sensorSimulated ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </Card>

      {/* ── Save Settings Button ── */}
      <Button size="lg" className="w-full mb-6 shadow-md shadow-violet-200" onClick={save}>
        {saved ? <><CheckCircle size={16} /> Settings Saved!</> : 'Save Profile Changes'}
      </Button>

      {/* ── Data Privacy & Danger Zone ── */}
      <div className="border border-red-150 bg-red-50/50 rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={18} className="text-red-500" />
          <h3 className="text-sm font-semibold text-red-700">Privacy &amp; Data Control</h3>
        </div>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          All your mood check-ins, journal notes, and voice transcriptions remain on your device in local storage.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-800 hover:bg-red-100 border border-red-200"
          onClick={resetData}
        >
          <Trash2 size={14} /> Reset All Local Data
        </Button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        FeelSync v1.0 · AI-Powered Emotional Wellness Support
      </p>
    </div>
  )
}

