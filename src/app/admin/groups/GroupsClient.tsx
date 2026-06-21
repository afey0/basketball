'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Users, ChevronRight, Target } from 'lucide-react'
import Link from 'next/link'

const GROUP_COLORS = ['#4f46e5','#6366f1','#10b981','#f59e0b','#ec4899']

interface Props { groups: any[]; coaches: any[] }

export default function GroupsClient({ groups: initial, coaches }: Props) {
  const [groups, setGroups] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editGroup, setEditGroup] = useState<any>(null)

  async function handleDelete(id: number) {
    if (!confirm('Delete this group? Students will be unassigned.')) return
    const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' })
    if (res.ok) { setGroups(prev => prev.filter(g => g.id !== id)); toast.success('Group deleted') }
    else toast.error('Cannot delete group with students')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        <button className="btn-primary" onClick={() => { setEditGroup(null); setShowModal(true) }}>
          <Plus size={15} /> New Group
        </button>
      </div>

      <div className="grid-3">
        {groups.map((g, i) => (
          <div key={g.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: GROUP_COLORS[i % GROUP_COLORS.length]
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, marginBottom: '0.75rem',
                  background: `${GROUP_COLORS[i % GROUP_COLORS.length]}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Target size={20} style={{ color: GROUP_COLORS[i % GROUP_COLORS.length] }} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{g.groupName}</h3>
                <span className="badge badge-purple" style={{ marginTop: '0.375rem' }}>{g.ageGroup}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="btn-ghost" style={{ padding: '0.375rem' }}
                  onClick={() => { setEditGroup(g); setShowModal(true) }}><Edit size={14} /></button>
                <button className="btn-ghost" style={{ padding: '0.375rem', color: '#ef4444' }}
                  onClick={() => handleDelete(g.id)}><Trash2 size={14} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Coach</span>
                <span style={{ fontWeight: 600 }}>{g.coach?.name || 'Unassigned'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Students</span>
                <span style={{ fontWeight: 600, color: GROUP_COLORS[i % GROUP_COLORS.length] }}>
                  {(g._count?.students ?? 0)} / {g.maxCapacity}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Monthly Fee</span>
                <span style={{ fontWeight: 700 }}>{g.paymentPlan ? `MVR ${g.paymentPlan.monthlyFee}` : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sessions/week</span>
                <span style={{ fontWeight: 600 }}>{g.schedules ? g.schedules.filter((s: any) => s.isActive).length : 0}</span>
              </div>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${Math.min(((g._count?.students ?? 0) / g.maxCapacity) * 100, 100)}%`,
                background: GROUP_COLORS[i % GROUP_COLORS.length]
              }} />
            </div>

            <Link href={`/admin/groups/${g.id}`} className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', fontSize: '0.8rem' }}>
              View Group <ChevronRight size={14} />
            </Link>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state-icon" style={{ color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '0.75rem', borderRadius: '50%', display: 'inline-flex' }}>
              <Target size={36} />
            </div>
            <div className="empty-state-title">No training groups yet</div>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>Create First Group</button>
          </div>
        )}
      </div>

      {showModal && <GroupModal group={editGroup} coaches={coaches} onClose={() => setShowModal(false)}
        onSave={g => {
          if (editGroup) setGroups(prev => prev.map(x => x.id === g.id ? g : x))
          else setGroups(prev => [g, ...prev])
          setShowModal(false)
        }} />}
    </div>
  )
}

function GroupModal({ group, coaches, onClose, onSave }: any) {
  const isEdit = !!group
  const [form, setForm] = useState(group || { groupName: '', ageGroup: 'U-8', coachId: '', maxCapacity: 20, description: '', monthlyFee: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = isEdit ? `/api/groups/${group.id}` : '/api/groups'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, coachId: form.coachId ? parseInt(form.coachId) : null, maxCapacity: parseInt(form.maxCapacity) }),
      })
      if (!res.ok) throw new Error()
      onSave(await res.json())
      toast.success(isEdit ? 'Group updated' : 'Group created')
    } catch { toast.error('Error saving group') }
    finally { setLoading(false) }
  }

  const AGE_GROUPS = ['U-8','U-10','U-12','U-14','U-16','U-18']
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>{isEdit ? 'Edit Group' : 'Create Training Group'}</h2>
          <button className="btn-ghost" style={{ padding: '0.375rem' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Group Name *</label>
              <input className="input" required value={form.groupName} onChange={e => set('groupName', e.target.value)} placeholder="e.g. Rising Stars" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Age Group *</label>
                <select className="select" value={form.ageGroup} onChange={e => set('ageGroup', e.target.value)}>
                  {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Max Capacity</label>
                <input className="input" type="number" value={form.maxCapacity} onChange={e => set('maxCapacity', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Coach</label>
              <select className="select" value={form.coachId || form.coach?.id || ''} onChange={e => set('coachId', e.target.value)}>
                <option value="">No coach assigned</option>
                {coaches.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.role})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Fee (MVR)</label>
              <input className="input" type="number" step="0.01" value={form.monthlyFee || form.paymentPlan?.monthlyFee || ''} onChange={e => set('monthlyFee', e.target.value)} placeholder="e.g. 650" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="input" rows={2} value={form.description || ''} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update' : 'Create Group'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
