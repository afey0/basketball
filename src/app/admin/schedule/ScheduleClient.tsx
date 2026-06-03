'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { DAY_LABELS, DAY_ORDER } from '@/lib/utils'

const DAY_COLOR = ['#6366f1','#4f46e5','#10b981','#f59e0b','#ec4899','#14b8a6','#8b5cf6']
const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN']

interface Props { schedules: any[]; groups: any[] }

export default function ScheduleClient({ schedules: initial, groups }: Props) {
  const [schedules, setSchedules] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editSchedule, setEditSchedule] = useState<any>(null)
  const [view, setView] = useState<'week' | 'list'>('week')

  async function handleDelete(id: number) {
    if (!confirm('Delete this session?')) return
    const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
    if (res.ok) { setSchedules(prev => prev.filter(s => s.id !== id)); toast.success('Session deleted') }
    else toast.error('Failed to delete')
  }

  // Group by day
  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = schedules.filter(s => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime))
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <div className="tab-nav" style={{ width: 'fit-content' }}>
          <button className={`tab-btn ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>Week View</button>
          <button className={`tab-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List View</button>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn-primary" onClick={() => { setEditSchedule(null); setShowModal(true) }}>
          <Plus size={15} /> Add Session
        </button>
      </div>

      {view === 'week' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
          {DAYS.map((day, i) => (
            <div key={day}>
              <div style={{
                textAlign: 'center', fontWeight: 800, fontSize: '0.75rem',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: byDay[day].length > 0 ? DAY_COLOR[i] : 'var(--text-muted)',
                marginBottom: '0.625rem', padding: '0.5rem',
                background: byDay[day].length > 0 ? `${DAY_COLOR[i]}15` : 'transparent',
                borderRadius: 8,
              }}>
                {day}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {byDay[day].map(s => (
                  <div key={s.id} style={{
                    padding: '0.625rem', borderRadius: 8,
                    background: `${DAY_COLOR[i]}12`,
                    border: `1px solid ${DAY_COLOR[i]}30`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 3, bottom: 0, background: DAY_COLOR[i] }} />
                    <div style={{ paddingLeft: '0.375rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem' }}>{s.trainingGroup?.groupName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--brand)', fontWeight: 700 }}>{s.startTime}–{s.endTime}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.location}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" style={{ padding: '0.2rem', fontSize: '0.7rem' }}
                        onClick={() => { setEditSchedule(s); setShowModal(true) }}><Edit size={11} /></button>
                      <button className="btn-ghost" style={{ padding: '0.2rem', color: '#ef4444' }}
                        onClick={() => handleDelete(s.id)}><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
                {byDay[day].length === 0 && (
                  <div style={{
                    padding: '1.25rem 0.5rem', textAlign: 'center',
                    color: 'var(--text-muted)', fontSize: '0.7rem',
                    border: '1px dashed var(--border)', borderRadius: 8,
                  }}>No sessions</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr><th>Day</th><th>Group</th><th>Time</th><th>Location</th><th>Coach</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No sessions scheduled</td></tr>
              ) : schedules.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700 }}>{DAY_LABELS[s.dayOfWeek] || s.dayOfWeek}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.trainingGroup?.groupName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.trainingGroup?.ageGroup}</div>
                  </td>
                  <td style={{ color: 'var(--brand)', fontWeight: 700 }}>{s.startTime} – {s.endTime}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.location}</td>
                  <td style={{ fontSize: '0.875rem' }}>{s.trainingGroup?.coach?.name || '—'}</td>
                  <td>
                    <span className={`badge ${s.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button className="btn-ghost" style={{ padding: '0.375rem' }}
                        onClick={() => { setEditSchedule(s); setShowModal(true) }}><Edit size={14} /></button>
                      <button className="btn-ghost" style={{ padding: '0.375rem', color: '#ef4444' }}
                        onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ScheduleModal schedule={editSchedule} groups={groups}
          onClose={() => setShowModal(false)}
          onSave={s => {
            if (editSchedule) setSchedules(prev => prev.map(x => x.id === s.id ? s : x))
            else setSchedules(prev => [...prev, s])
            setShowModal(false)
          }} />
      )}
    </div>
  )
}

function ScheduleModal({ schedule, groups, onClose, onSave }: any) {
  const isEdit = !!schedule
  const [form, setForm] = useState(schedule || {
    trainingGroupId: '', dayOfWeek: 'MON', startTime: '16:00', endTime: '18:00', location: 'Main Court', isActive: true
  })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = isEdit ? `/api/schedules/${schedule.id}` : '/api/schedules'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, trainingGroupId: parseInt(form.trainingGroupId || form.trainingGroup?.id) }),
      })
      if (!res.ok) throw new Error()
      onSave(await res.json())
      toast.success(isEdit ? 'Session updated' : 'Session created')
    } catch { toast.error('Error saving session') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>{isEdit ? 'Edit Session' : 'Add Session'}</h2>
          <button className="btn-ghost" style={{ padding: '0.375rem' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Training Group *</label>
              <select className="select" required value={form.trainingGroupId || form.trainingGroup?.id || ''}
                onChange={e => set('trainingGroupId', e.target.value)}>
                <option value="">Select group</option>
                {groups.map((g: any) => <option key={g.id} value={g.id}>{g.groupName} ({g.ageGroup})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Day of Week *</label>
              <select className="select" value={form.dayOfWeek} onChange={e => set('dayOfWeek', e.target.value)}>
                {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => (
                  <option key={d} value={d}>{DAY_LABELS[d]}</option>
                ))}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input className="input" type="time" required value={form.startTime} onChange={e => set('startTime', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input className="input" type="time" required value={form.endTime} onChange={e => set('endTime', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location *</label>
              <input className="input" required value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Main Court, Arena B" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
              <label htmlFor="isActive" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Active session</label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
