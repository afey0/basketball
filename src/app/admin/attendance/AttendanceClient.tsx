'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Clock, FileText, Users } from 'lucide-react'

interface Props { groups: any[] }

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: '✅ Present', cls: 'badge-green' },
  { value: 'ABSENT', label: '❌ Absent', cls: 'badge-red' },
  { value: 'LATE', label: '⏰ Late', cls: 'badge-yellow' },
  { value: 'EXCUSED', label: '📝 Excused', cls: 'badge-blue' },
]

export default function AttendanceClient({ groups }: Props) {
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || '')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const group = groups.find(g => g.id === parseInt(selectedGroup as string))
  const students = group?.students || []

  useEffect(() => {
    if (!selectedGroup || !selectedDate) return
    setLoading(true)
    fetch(`/api/attendance?groupId=${selectedGroup}&date=${selectedDate}`)
      .then(r => r.json())
      .then(data => {
        const map: Record<number, string> = {}
        data.forEach((a: any) => { map[a.studentId] = a.status })
        setAttendance(map)
      })
      .finally(() => setLoading(false))
  }, [selectedGroup, selectedDate])

  function setStatus(studentId: number, status: string) {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  function markAll(status: string) {
    const map: Record<number, string> = {}
    students.forEach((s: any) => { map[s.id] = status })
    setAttendance(map)
  }

  async function saveAttendance() {
    if (students.length === 0) return
    setSaving(true)
    try {
      const records = students.map((s: any) => ({
        studentId: s.id,
        trainingGroupId: parseInt(selectedGroup as string),
        date: selectedDate,
        status: attendance[s.id] || 'ABSENT',
      }))
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      })
      if (!res.ok) throw new Error()
      toast.success(`Attendance saved for ${records.length} students`)
    } catch { toast.error('Failed to save attendance') }
    finally { setSaving(false) }
  }

  const counts = {
    present: Object.values(attendance).filter(s => s === 'PRESENT').length,
    absent: Object.values(attendance).filter(s => s === 'ABSENT').length,
    late: Object.values(attendance).filter(s => s === 'LATE').length,
    excused: Object.values(attendance).filter(s => s === 'EXCUSED').length,
  }

  return (
    <div>
      {/* Selectors */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="select" style={{ width: 200 }} value={selectedGroup}
          onChange={e => setSelectedGroup(e.target.value)}>
          {groups.map(g => <option key={g.id} value={g.id}>{g.groupName} ({g.ageGroup})</option>)}
        </select>
        <input type="date" className="input" style={{ width: 160 }} value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)} />
        <div style={{ flex: 1 }} />
        <button className="btn-ghost" onClick={() => markAll('PRESENT')} style={{ fontSize: '0.8rem' }}>✅ All Present</button>
        <button className="btn-ghost" onClick={() => markAll('ABSENT')} style={{ fontSize: '0.8rem' }}>❌ All Absent</button>
        <button className="btn-primary" onClick={saveAttendance} disabled={saving || students.length === 0}>
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Summary bar */}
      {students.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <span className="badge badge-green">✅ Present: {counts.present}</span>
          <span className="badge badge-red">❌ Absent: {counts.absent}</span>
          <span className="badge badge-yellow">⏰ Late: {counts.late}</span>
          <span className="badge badge-blue">📝 Excused: {counts.excused}</span>
          <span style={{ fontSize: '0.8rem', color: '#8B8BA7', marginLeft: 'auto' }}>{students.length} students</span>
        </div>
      )}

      {/* Student List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8B8BA7' }}>Loading...</div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <div className="empty-state-title">No students in this group</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any, i: number) => {
                const status = attendance[s.id] || ''
                return (
                  <tr key={s.id} style={{
                    background: status === 'PRESENT' ? 'rgba(74,222,128,0.04)'
                      : status === 'ABSENT' ? 'rgba(248,113,113,0.04)'
                      : status === 'LATE' ? 'rgba(251,191,36,0.04)' : 'transparent'
                  }}>
                    <td style={{ width: 40, color: '#8B8BA7', fontSize: '0.8rem' }}>{i+1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.7rem' }}>
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                          {s.jerseyNumber && <div style={{ fontSize: '0.7rem', color: '#8B8BA7' }}>#{s.jerseyNumber}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {STATUS_OPTIONS.map(opt => (
                          <button key={opt.value}
                            className={`badge ${status === opt.value ? opt.cls : ''}`}
                            style={{
                              cursor: 'pointer', border: status === opt.value ? undefined : '1px solid rgba(255,255,255,0.1)',
                              background: status === opt.value ? undefined : 'transparent',
                              color: status === opt.value ? undefined : '#8B8BA7',
                              transition: 'all 0.15s',
                            }}
                            onClick={() => setStatus(s.id, opt.value)}
                          >{opt.label}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
