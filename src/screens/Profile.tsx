import { useState } from 'react'
import { useApp } from '../store'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CheckCircle, User } from 'lucide-react'

const GOALS = [
  'Manage stress', 'Improve sleep', 'Build resilience',
  'Practice mindfulness', 'Track my mood', 'Reduce anxiety',
]

export function Profile() {
  const { profile, setProfile, moodHistory, activities } = useApp()
  const [name, setName]   = useState(profile.name)
  const [goals, setGoals] = useState<string[]>(profile.goals)
  const [saved, setSaved] = useState(false)

  function toggleGoal(g: string) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  function save() {
    setProfile({ ...profile, name: name.trim() || 'Friend', goals })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function resetData() {
    if (!confirm('This will permanently clear all your FeelSync data. Are you sure?')) return
    localStorage.clear()
    window.location.href = '/'
  }

  const initials = (profile.name || 'F').slice(0, 2).toUpperCase()

  return (
    <div className="flex-1 p-5 md:p-8 pb-24 md:pb-8 max-w-lg mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile & Settings</h1>

      {/* Avatar + stats */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xl select-none">
          {profile.name ? initials : <User size={28} className="text-violet-400" />}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{profile.name || 'Friend'}</p>
          <p className="text-sm text-gray-400">
            {moodHistory.length} check-in{moodHistory.length !== 1 ? 's' : ''} ·{' '}
            {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </div>

      {/* Name */}
      <Card className="mb-4">
        <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-2">
          Your name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="What should Sync call you?"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white transition-colors"
        />
      </Card>

      {/* Goals */}
      <Card className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Wellness goals</p>
        <p className="text-xs text-gray-400 mb-3">Select all that apply — Sync uses these to personalise suggestions.</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map(g => (
            <button
              key={g}
              onClick={() => toggleGoal(g)}
              aria-pressed={goals.includes(g)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                goals.includes(g)
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </Card>

      <Button size="lg" className="w-full mb-3" onClick={save}>
        {saved ? <><CheckCircle size={16} /> Saved!</> : 'Save changes'}
      </Button>

      {/* Danger zone */}
      <div className="mt-8 border border-red-100 rounded-2xl p-4">
        <p className="text-sm font-semibold text-red-600 mb-1">Danger zone</p>
        <p className="text-xs text-gray-400 mb-3">
          This permanently deletes all your local wellness data including mood history, activities, and settings.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200"
          onClick={resetData}
        >
          Reset all data
        </Button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        FeelSync v1.0 · Wellness support tool, not a medical service.
      </p>
    </div>
  )
}
