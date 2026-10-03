import { useState } from 'react'
import { useApp } from '../store'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CheckCircle, User, Mic, ShieldCheck, Activity, Trash2, Check } from 'lucide-react'

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
    <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-28 md:pb-8 max-w-xl mx-auto w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 tracking-tight">Profile &amp; Settings</h1>

      {/* ── User Avatar & Summary ── */}
      <div className="flex items-center gap-4 mb-5 bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-lg select-none shadow-sm shrink-0">
          {profile.name ? initials : <User size={24} className="text-white" />}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-base leading-tight">{profile.name || 'Friend'}</p>
          <p className="text-xs text-gray-400 mt-1">
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
          className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50/50 focus:bg-white transition-colors"
        />
      </Card>

      {/* ── Wellness Goals ── */}
      <Card className="mb-4">
        <p className="text-sm font-semibold text-gray-800 mb-1">Wellness Focus &amp; Goals</p>
        <p className="text-xs text-gray-400 mb-3">FeelSync tailors recommendations based on your selected priorities.</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map(g => {
            const selected = goals.includes(g)
            return (
              <button
                key={g}
                onClick={() => toggleGoal(g)}
                aria-pressed={selected}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  selected
                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                }`}
              >
                {selected && <Check size={11} className="shrink-0" />}
                {g}
              </button>
            )
          })}
        </div>
      </Card>

      {/* ── Voice Agent Settings ── */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
            <Mic size={17} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Voice Agent Configuration</h3>
            <p className="text-xs text-gray-400">Controls for browser text-to-speech responses</p>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">Auto-speak AI responses</label>
            <button
              onClick={() => setAutoSpeak(a => !a)}
              role="switch"
              aria-checked={autoSpeak}
              aria-label="Toggle auto-speak AI responses"
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2 ${
                autoSpeak ? 'bg-violet-600' : 'bg-gray-200'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                autoSpeak ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">Speech Speed</label>
            <select
              value={voiceSpeed}
              onChange={e => setVoiceSpeed(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1 bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="0.8">0.8× (Relaxed)</option>
              <option value="1.0">1.0× (Normal)</option>
              <option value="1.2">1.2× (Faster)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Sensor Connections ── */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Activity size={17} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Sensor Connections</h3>
            <p className="text-xs text-gray-400">EEG &amp; GSR physiological indicators</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <label className="text-xs font-medium text-gray-700">Use Simulated Wearable Data</label>
          <button
            onClick={() => setSensorSimulated(s => !s)}
            role="switch"
            aria-checked={sensorSimulated}
            aria-label="Toggle simulated wearable data"
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2 ${
              sensorSimulated ? 'bg-violet-600' : 'bg-gray-200'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
              sensorSimulated ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </Card>

      {/* ── Save Settings Button ── */}
      <Button size="lg" className="w-full mb-4 shadow-sm shadow-violet-200" onClick={save}>
        {saved ? <><CheckCircle size={15} /> Settings Saved!</> : 'Save Profile Changes'}
      </Button>

      {/* ── Data Privacy & Danger Zone ── */}
      <div className="border border-red-200 bg-red-50 rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={17} className="text-red-500" />
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
          <Trash2 size={13} /> Reset All Local Data
        </Button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        FeelSync v1.0 · AI-Powered Emotional Wellness Support
      </p>
    </div>
  )
}
